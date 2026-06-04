"""
Student Performance System — Flask Backend
R. C. Patel Institute of Technology, Shirpur
AI & ML Department | Semester IV Project

A comprehensive academic performance tracking system with AI-powered
assessments, attendance tracking, coding stats, and smart insights.
"""

# ═══════════════════════════════════════════════════════════════
# IMPORTS
# ═══════════════════════════════════════════════════════════════
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from mongoengine import connect, Q, DoesNotExist
from models import (
    User, Branch, TimetableSlot, LectureAttendance, Todo,
    CodingStat, Notification, SubjectiveAssessment,
    SubjectRecommendation, AssignedTrack, StudyPlan,
    Note, Certification, UserGamification
)
from coding_scraper import sync_all_stats
from assessment_engine import generate_questions, evaluate_text_answer, call_model, SUBJECT_INFO
from datetime import datetime, date
from dotenv import load_dotenv
import os
import calendar
import certifi

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION & DATABASE
# ═══════════════════════════════════════════════════════════════
load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
SECRET_KEY = os.getenv('SECRET_KEY')

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}, supports_credentials=True)
app.config['SECRET_KEY'] = SECRET_KEY or 'dev_secret_key_123'
app.config['JWT_SECRET_KEY'] = app.config['SECRET_KEY']
jwt = JWTManager(app)

# MongoDB Connection
if MONGO_URI:
    try:
        connect(host=MONGO_URI, tls=True, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
        print("[+] Connected to MongoDB Atlas")
    except Exception as e:
        print(f"[-] MongoDB Atlas failed: {e}, falling back to local DB")
        connect('student_performance_db')
else:
    print("[!] MONGO_URI not set, using local database")
    connect('student_performance_db')

@app.route('/api/assessment/generate', methods=['POST'])
@login_required
def api_generate_assessment():
    data = request.get_json()
    subject = data.get('subject')
    unit = data.get('unit')

    if not subject or not unit:
        return jsonify({"error": "Subject and Unit are required"}), 400

    questions = generate_questions(subject, unit)
    if not questions:
        return jsonify({"error": "Failed to generate questions"}), 500

    # Save assessment to database so we have an ID to track results
    new_assessment = SubjectiveAssessment(
        student=current_user,
        branch=current_user.branch,
        subject=subject,
        unit=int(unit),
        questions=[{
            "id": q['id'], 
            "text": q['text'], 
            "marks": q['marks'], 
            "model_solution": q.get('model_solution', ''),
            "co": q.get('co', ''),
            "blooms": q.get('blooms', '')
        } for q in questions],
        max_score=sum(q['marks'] for q in questions),
        status='generating' if data.get('mode') == 'qb' else 'idle'
    ).save()

    # Get subject metadata for official QB header
    subj_info = SUBJECT_INFO.get(subject, {'name': subject, 'code': ''})

    return jsonify({
        "assessment_id": str(new_assessment.id),
        "subject_info": {
            "short": subject,
            "name": subj_info['name'],
            "code": subj_info['code']
        },
        "questions": [{
            "id": q['id'], 
            "text": q['text'], 
            "marks": q['marks'], 
            "co": q.get('co', ''),
            "blooms": q.get('blooms', ''),
            "model_solution": q.get('model_solution', '')
        } for q in questions]
    }), 201

@app.route('/api/assessment/submit/<assessment_id>', methods=['POST'])
@login_required
def api_submit_assessment(assessment_id):
    data = request.get_json()
    student_answers = data.get('answers') # List of {question_id, text}

    try:
        assessment = SubjectiveAssessment.objects.get(id=assessment_id, student=current_user)
    except DoesNotExist:
        return jsonify({"error": "Assessment not found"}), 404

    if assessment.status == 'completed':
        return jsonify({"error": "Assessment already submitted"}), 400

    evaluated_answers = []
    total_score = 0

    for ans in student_answers:
        question = next((q for q in assessment.questions if q['id'] == ans['question_id']), None)
        if question:
            eval_result = evaluate_text_answer(question, ans['text'])
            evaluated_answers.append({
                "question_id": ans['question_id'],
                "student_answer": ans['text'],
                "score": eval_result['score'],
                "feedback": eval_result['feedback'],
                "model_solution": question['model_solution']
            })
            total_score += eval_result['score']

    assessment.answers = evaluated_answers
    assessment.total_score = total_score
    assessment.status = 'completed'
    assessment.date_completed = datetime.utcnow()
    assessment.save()

    return jsonify({
        "message": "Assessment submitted and evaluated",
        "total_score": total_score,
        "max_score": assessment.max_score,
        "results": evaluated_answers
    }), 200

@app.route('/api/assessment/results', methods=['GET'])
@login_required
def api_assessment_results():
    history = SubjectiveAssessment.objects(student=current_user, status='completed').order_by('-date_completed')
    return jsonify([{
        "id": str(a.id),
        "subject": a.subject,
        "unit": a.unit,
        "score": a.total_score,
        "max_score": a.max_score,
        "status": a.status,
        "date": a.date_completed.strftime("%Y-%m-%d %H:%M") if a.date_completed else a.date_created.strftime("%Y-%m-%d %H:%M"),
        "feedback": "Analysis complete. View detailed breakdown below.",
        "results": a.answers
    } for a in history])

# File upload config
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
NOTES_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'notes')
CERTIFICATIONS_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'certifications')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(NOTES_FOLDER, exist_ok=True)
os.makedirs(CERTIFICATIONS_FOLDER, exist_ok=True)

HOLIDAYS = {
    date(2026, 2, 18): "Shivaji Maharaj Jayanti",
    date(2026, 3, 3): "Dhulivandan",
    date(2026, 3, 18): "Gudhi Padwa",
    date(2026, 3, 21): "Ramjan Eid",
    date(2026, 3, 26): "Shriram Navami",
    date(2026, 3, 31): "Mahavir Jayanti",
    date(2026, 4, 3): "Good Friday",
    date(2026, 4, 14): "Dr. Babasaheb Ambedkar Jayanti",
    date(2026, 6, 27): "Bakrid",
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    try:
        return User.objects(id=user_id).first()
    except Exception:
        return None

@app.route('/')
def home():
    return jsonify({"status": "ok", "app": "Student Performance System API", "version": "1.0"})


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.objects(username=username).first()
    if user and check_password_hash(user.password, password):
        login_user(user, remember=True)
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": str(user.id),
                "username": user.username,
                "full_name": user.full_name
            }
        }), 200
    return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/token/refresh', methods=['POST'])
@jwt_required(refresh=True)
def token_refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify({"access_token": new_access_token}), 200


@app.route('/api/branches', methods=['GET'])
def api_branches():
    branches = Branch.objects().all()
    return jsonify([{"id": str(b.id), "name": b.name} for b in branches])

@app.route('/api/signup', methods=['POST'])
def api_signup():
    username = request.form.get('username')
    password = request.form.get('password')
    full_name = request.form.get('full_name', '').strip()
    email = request.form.get('email', '').strip()
    roll_no = request.form.get('roll_no', '').strip()
    prn = request.form.get('prn', '').strip()
    branch_id = request.form.get('branch_id')
    section = request.form.get('section')

    if User.objects(username=username).first():
        return jsonify({"error": "Username already exists"}), 400
    
    photo_filename = None
    photo = request.files.get('photo')
    if photo and photo.filename and allowed_file(photo.filename):
        filename = secure_filename(f"{username}_{photo.filename}")
        photo.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        photo_filename = filename

    branch_obj = Branch.objects(id=branch_id).first() if branch_id else None
    new_user = User(
        username=username,
        password=generate_password_hash(password, method='pbkdf2:sha256'),
        full_name=full_name, email=email, roll_no=roll_no, prn=prn,
        photo=photo_filename, branch=branch_obj, section=section
    )
    new_user.save()
    login_user(new_user, remember=True)
    access_token = create_access_token(identity=str(new_user.id))
    refresh_token = create_refresh_token(identity=str(new_user.id))
    return jsonify({
        "message": "User created successfully",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": str(new_user.id),
            "username": new_user.username,
            "full_name": new_user.full_name
        }
    }), 201

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

def get_user_slots_for_day(user, day_name):
    try:
        if not user.branch: return []
    except DoesNotExist:
        return []
    return TimetableSlot.objects(branch=user.branch, day=day_name).filter(
        Q(section=None) | Q(section=user.section)
    ).order_by('slot_number')

def get_attendance_summary(user):
    try:
        if not user.branch: return []
    except DoesNotExist:
        return []
    all_slots = TimetableSlot.objects(branch=user.branch).filter(
        Q(section=None) | Q(section=user.section)
    )
    subject_slots = {}
    for slot in all_slots:
        key = f"{slot.subject_name} ({slot.subject_type})"
        if key not in subject_slots: subject_slots[key] = []
        subject_slots[key].append(slot.id)

    summary = []
    for subject_label, slot_ids in subject_slots.items():
        total = LectureAttendance.objects(student=user, timetable_slot__in=slot_ids).count()
        attended = LectureAttendance.objects(student=user, timetable_slot__in=slot_ids, status='present').count()
        pct = (attended / total * 100) if total > 0 else 0
        summary.append({
            'subject': subject_label, 'total': total, 'attended': attended, 'percentage': pct,
            'status': 'safe' if pct >= 75 else ('critical' if total > 0 else 'na')
        })
    summary.sort(key=lambda x: (0 if x['status'] == 'critical' else 1, x['subject']))
    return summary

def calculate_risk_score(summary, todos, coding_stats):
    risk_level, risk_color, advice = 'Low Risk', 'success', 'Keep up the excellent work!'
    low_attendance_subjects = [s for s in summary if s['percentage'] < 75 and s['total'] > 0]
    pending_tasks = len(todos)
    total_solved = sum(c.problems_solved for c in coding_stats)
    
    risk_factors = 0
    if len(low_attendance_subjects) >= 2: risk_factors += 2
    elif len(low_attendance_subjects) == 1: risk_factors += 1
    if pending_tasks > 10: risk_factors += 2
    elif pending_tasks > 5: risk_factors += 1
    if total_solved == 0: risk_factors += 1
        
    if risk_factors >= 3: risk_level, risk_color, advice = 'High Risk', 'danger', 'Critical actions needed.'
    elif risk_factors >= 1: risk_level, risk_color, advice = 'Moderate Risk', 'warning', 'Focused effort required.'
    return {'level': risk_level, 'color': risk_color, 'advice': advice}

@app.route('/api/dashboard')
@login_required
def api_dashboard():
    summary = get_attendance_summary(current_user)
    todos = Todo.objects(student=current_user, completed=False)
    coding_stats = CodingStat.objects(student=current_user)
    total_lectures = sum(s['total'] for s in summary)
    attended_lectures = sum(s['attended'] for s in summary)
    overall_attendance = (attended_lectures / total_lectures * 100) if total_lectures > 0 else 0
    total_solved = sum(c.problems_solved for c in coding_stats)
    risk_profile = calculate_risk_score(summary, todos, coding_stats)
    
    return jsonify({
        "user": {
            "full_name": current_user.full_name,
            "username": current_user.username,
            "photo": current_user.photo,
            "branch": current_user.branch.name if current_user.branch else None,
            "section": current_user.section
        },
        "overall_attendance": overall_attendance,
        "pending_tasks_count": len(todos),
        "total_solved": total_solved,
        "risk_profile": risk_profile,
        "attendance_summary": summary,
        "coding_stats": [
            {"platform": c.platform, "problems_solved": c.problems_solved, "rating": c.rating}
            for c in coding_stats
        ]
    })


@app.route('/api/attendance', methods=['GET', 'POST'])
@login_required
def api_attendance():
    today = date.today()
    selected_date_str = request.args.get('date', today.isoformat())
    try: selected_date = date.fromisoformat(selected_date_str)
    except: selected_date = today
    day_name = calendar.day_name[selected_date.weekday()]
    slots = get_user_slots_for_day(current_user, day_name)
    
    if request.method == 'POST':
        data = request.get_json()
        slot_id = data.get('slot_id')
        status = data.get('status') # 'present', 'absent', or ''
        
        if selected_date > today:
            return jsonify({"error": "Future date attendance not allowed"}), 400
            
        slot = TimetableSlot.objects(id=slot_id).first()
        if not slot:
            return jsonify({"error": "Slot not found"}), 404
            
        dt = datetime.combine(selected_date, datetime.min.time())
        if status in ('present', 'absent'):
            LectureAttendance.objects(student=current_user, date=dt, timetable_slot=slot).update_one(set__status=status, upsert=True)
        else:
            LectureAttendance.objects(student=current_user, date=dt, timetable_slot=slot).delete()
            
        return jsonify({"message": "Attendance updated"})

    existing_records = {}
    dt = datetime.combine(selected_date, datetime.min.time())
    for rec in LectureAttendance.objects(student=current_user, date=dt):
        existing_records[str(rec.timetable_slot.id)] = rec.status
        
    return jsonify({
        "date": selected_date.isoformat(),
        "day_name": day_name,
        "slots": [
            {
                "id": str(s.id),
                "time": f"{s.start_time} - {s.end_time}",
                "slot": f"Slot {s.slot_number}",
                "subject": s.subject_name,
                "type": s.subject_type,
                "prof": s.professor,
                "section": s.section or "",
                "status": existing_records.get(str(s.id))
            } for s in slots
        ]
    })


@app.route('/api/todo', methods=['GET', 'POST'])
@login_required
def api_todo():
    if request.method == 'POST':
        data = request.get_json()
        task = data.get('task')
        type = data.get('type')
        if task:
            new_todo = Todo(task=task, type=type, student=current_user).save()
            return jsonify({
                "id": str(new_todo.id),
                "task": new_todo.task,
                "type": new_todo.type,
                "completed": new_todo.completed,
                "date_added": new_todo.date_added.isoformat()
            }), 201
        return jsonify({"error": "Task description required"}), 400
    
    todos = Todo.objects(student=current_user).order_by('-date_added')
    return jsonify([
        {
            "id": str(t.id),
            "task": t.task,
            "type": t.type,
            "completed": t.completed,
            "date_added": t.date_added.isoformat()
        } for t in todos
    ])


@app.route('/api/todo/toggle/<id>', methods=['POST'])
@login_required
def api_toggle_todo(id):
    todo = Todo.objects(id=id, student=current_user).first()
    if todo:
        todo.completed = not todo.completed
        todo.save()
        return jsonify({"message": "Todo updated", "completed": todo.completed})
    return jsonify({"error": "Todo not found"}), 404


@app.route('/api/todo/delete/<id>', methods=['DELETE'])
@login_required
def api_delete_todo(id):
    Todo.objects(id=id, student=current_user).delete()
    return jsonify({"message": "Todo deleted"})



@app.route('/api/coding/sync', methods=['POST'])
@login_required
def api_sync_coding_stats():
    stats = sync_all_stats(current_user)
    updated_stats = []
    for s in stats:
        stat_obj = CodingStat.objects(student=current_user, platform=s['platform']).update_one(
            set__problems_solved=s['problems_solved'],
            set__rating=s['rating'],
            upsert=True
        )
        updated_stats.append(s)
    
    return jsonify({
        "message": "Stats synced successfully",
        "stats": updated_stats
    })

@app.route('/api/coding/recommendations', methods=['GET'])
@login_required
def api_coding_recommendations():
    recs = SubjectRecommendation.objects()
    return jsonify([{
        "id": str(r.id),
        "subject": r.subject_name,
        "topic": r.topic,
        "problem_name": r.problem_name,
        "problem_url": r.problem_url,
        "platform": r.platform,
        "difficulty": r.difficulty
    } for r in recs])

@app.route('/api/coding/stats', methods=['GET'])
@login_required
def api_get_coding_stats():
    stats = CodingStat.objects(student=current_user)
    return jsonify([{
        "platform": s.platform,
        "problems_solved": s.problems_solved,
        "rating": s.rating
    } for s in stats])

@app.route('/api/coding/tracks', methods=['GET', 'POST'])
@login_required
def api_coding_tracks():
    if request.method == 'POST':
        data = request.get_json()
        track_id = data.get('id')
        progress = data.get('progress')
        if track_id and progress is not None:
            track = AssignedTrack.objects(id=track_id, student=current_user).first()
            if track:
                track.progress = int(progress)
                track.save()
                return jsonify({"message": "Progress updated"})
        return jsonify({"error": "Invalid data"}), 400

    tracks = AssignedTrack.objects(student=current_user)
    # If no tracks exist for this user, seed the DAA track
    if not tracks:
        daa_track = AssignedTrack(
            student=current_user,
            name="DAA Track (RCPIT AI&ML S4)",
            platform="CodeChef",
            url="https://www.codechef.com/learn/course/rcpit-aiml-s4-daa-2026",
            progress=0
        ).save()
        tracks = [daa_track]

    return jsonify([{
        "id": str(t.id),
        "name": t.name,
        "platform": t.platform,
        "url": t.url,
        "progress": t.progress
    } for t in tracks])


@app.route('/api/profile', methods=['GET', 'POST'])
@login_required
def api_profile():
    if request.method == 'POST':
        data = request.get_json()
        current_user.full_name = data.get('name', current_user.full_name) # Frontend uses 'name'
        current_user.email = data.get('email', current_user.email)
        current_user.leetcode = data.get('leetcode', '')
        current_user.hackerrank = data.get('hackerrank', '')
        current_user.codechef = data.get('codechef', '')
        current_user.github = data.get('github', '')
        current_user.university = data.get('university', '')
        current_user.semester = data.get('semester', '')
        current_user.cgpa_target = data.get('cgpaTarget', current_user.cgpa_target)
        if 'totalSemesters' in data: current_user.total_semesters = int(data.get('totalSemesters') or 8)
        if 'semestersCompleted' in data: current_user.semesters_completed = int(data.get('semestersCompleted') or 0)
        if 'semGPAs' in data: current_user.sem_gpas = data.get('semGPAs')
        
        # Preserve other fields or allow updates
        if 'roll_no' in data: current_user.roll_no = data.get('roll_no')
        if 'prn' in data: current_user.prn = data.get('prn')
        if 'section' in data: current_user.section = data.get('section')
        
        current_user.save()
        return jsonify({
            "message": "Profile updated successfully",
            "user": {
                "full_name": current_user.full_name,
                "leetcode": current_user.leetcode,
                "university": current_user.university,
                "semester": current_user.semester,
                "cgpaTarget": current_user.cgpa_target,
                "totalSemesters": current_user.total_semesters,
                "semestersCompleted": current_user.semesters_completed,
                "semGPAs": current_user.sem_gpas
            }
        }), 200
        
    return jsonify({
        "name": current_user.full_name,
        "email": current_user.email,
        "roll_no": current_user.roll_no,
        "prn": current_user.prn,
        "branch": current_user.branch.name if current_user.branch else "",
        "section": current_user.section,
        "university": current_user.university or "",
        "semester": current_user.semester or "1st Semester",
        "cgpaTarget": current_user.cgpa_target or "",
        "totalSemesters": current_user.total_semesters or 8,
        "semestersCompleted": current_user.semesters_completed or 0,
        "semGPAs": current_user.sem_gpas or [],
        "leetcode": current_user.leetcode or "",
        "hackerrank": current_user.hackerrank or "",
        "codechef": current_user.codechef or "",
        "github": current_user.github or "",
        "show_on_leaderboard": current_user.show_on_leaderboard or False
    })


@app.route('/api/notifications', methods=['GET'])
@login_required
def api_get_notifications():
    # Helper to seed some demo notifications if few exist
    if Notification.objects(student=current_user).count() < 5:
        demo_notes = [
            {"title": "Welcome to Student Diary", "desc": "Explore your dashboard to see your academic progress.", "type": "info"},
            {"title": "Low Attendance Alert", "desc": "Your attendance in Mathematics is currently 72%.", "type": "danger"},
            {"title": "Assignment Deadline", "desc": "Software Engineering: Project Phase 1 is due in 24 hours.", "type": "warning"},
            {"title": "New Coding Milestone", "desc": "You just reached a 50-day streak on LeetCode!", "type": "success"},
            {"title": "System Update", "desc": "New features added to the Profile and Alerts sections.", "type": "zap"}
        ]
        for note in demo_notes:
            Notification(student=current_user, **note).save()

    notes = Notification.objects(student=current_user).order_by('-date_added')
    return jsonify([{
        "id": str(n.id),
        "title": n.title,
        "desc": n.desc,
        "type": n.type,
        "read": n.read,
        "time": n.date_added.strftime("%Y-%m-%d %H:%M:%S")
    } for n in notes])

@app.route('/api/notifications/read/<note_id>', methods=['POST'])
@login_required
def api_mark_notification_read(note_id):
    try:
        note = Notification.objects.get(id=note_id, student=current_user)
        note.read = True
        note.save()
        return jsonify({"message": "Marked as read"}), 200
    except DoesNotExist:
        return jsonify({"error": "Notification not found"}), 404

@app.route('/api/notifications/<note_id>', methods=['DELETE'])
@login_required
def api_delete_notification(note_id):
    try:
        note = Notification.objects.get(id=note_id, student=current_user)
        note.delete()
        return jsonify({"message": "Deleted"}), 200
    except DoesNotExist:
        return jsonify({"error": "Notification not found"}), 404

# ═══════════════════════════════════════════════════════════════
# NEW FEATURES — All additive, no existing code modified
# ═══════════════════════════════════════════════════════════════

from models import StudyPlan, Note, Certification, UserGamification

# ──── NOTES UPLOAD CONFIG ────
NOTES_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'notes')
os.makedirs(NOTES_FOLDER, exist_ok=True)

# ──── CERTIFICATIONS UPLOAD CONFIG ────
CERTIFICATIONS_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'certifications')
os.makedirs(CERTIFICATIONS_FOLDER, exist_ok=True)

# ──── Feature 1: SMART INSIGHTS ────
@app.route('/api/insights', methods=['GET'])
@login_required
def api_insights():
    summary = get_attendance_summary(current_user)
    coding_stats = CodingStat.objects(student=current_user)
    todos = Todo.objects(student=current_user, completed=False)
    
    # Attendance predictions
    attendance_alerts = []
    for s in summary:
        if s['total'] > 0 and s['percentage'] < 85:
            lectures_needed = 0
            present = s['attended']
            total = s['total']
            while total < 100 and (present / total * 100) < 75:
                present += 1
                total += 1
                lectures_needed += 1
            if s['percentage'] < 75:
                attendance_alerts.append({
                    'subject': s['subject'],
                    'current': round(s['percentage'], 1),
                    'status': 'critical',
                    'message': f"Below 75%! Need {lectures_needed} consecutive classes to recover."
                })
            else:
                buffer = 0
                p, t = s['attended'], s['total']
                while t < 100 and (p / (t + 1) * 100) >= 75:
                    t += 1
                    buffer += 1
                attendance_alerts.append({
                    'subject': s['subject'],
                    'current': round(s['percentage'], 1),
                    'status': 'warning',
                    'message': f"Can miss only {buffer} more classes before falling below 75%."
                })
    
    # Coding velocity
    total_solved = sum(c.problems_solved for c in coding_stats)
    coding_insight = {
        'total_solved': total_solved,
        'platforms': len(list(coding_stats)),
        'level': 'Beginner' if total_solved < 50 else 'Intermediate' if total_solved < 200 else 'Advanced'
    }
    
    # Overall health score (0-100)
    overall_attendance = sum(s['attended'] for s in summary)
    total_lectures = sum(s['total'] for s in summary)
    att_pct = (overall_attendance / total_lectures * 100) if total_lectures > 0 else 0
    att_score = min(att_pct / 100 * 40, 40)
    coding_score = min(total_solved / 200 * 30, 30)
    task_score = max(30 - len(todos) * 3, 0)
    health_score = round(att_score + coding_score + task_score)
    
    return jsonify({
        'attendance_alerts': attendance_alerts,
        'coding_insight': coding_insight,
        'health_score': health_score,
        'pending_tasks': len(todos),
        'overall_attendance': round(att_pct, 1),
        'total_subjects': len(summary),
        'critical_subjects': len([s for s in summary if s['total'] > 0 and s['percentage'] < 75]),
    })

# ──── Feature 3: SMART REMINDERS ────
@app.route('/api/smart-reminders', methods=['GET'])
@login_required
def api_smart_reminders():
    reminders = []
    today = date.today()
    summary = get_attendance_summary(current_user)
    todos = Todo.objects(student=current_user, completed=False)
    coding_stats = CodingStat.objects(student=current_user)
    
    # Academic Calendar Events (Check within next 7 days)
    for item in ACADEMIC_CALENDAR:
        event_date = date.fromisoformat(item["date"])
        days_left = (event_date - today).days
        if 0 <= days_left <= 7:
            cat = item["category"]
            rtype = "danger" if cat == "exam" else "warning" if cat in ("internship", "project", "placement") else "info"
            time_msg = "TODAY" if days_left == 0 else "Tomorrow" if days_left == 1 else f"in {days_left} days"
            
            reminders.append({
                'type': rtype,
                'title': f"📅 {item['event']}",
                'message': f"Scheduled {time_msg} — {item['date']}",
                'priority': 1 if rtype == 'danger' else 2 if rtype == 'warning' else 3
            })

    # Holidays (Check within next 7 days)
    for hdate, hname in HOLIDAYS.items():
        days_left = (hdate - today).days
        if 0 <= days_left <= 7:
            time_msg = "TODAY" if days_left == 0 else "Tomorrow" if days_left == 1 else f"in {days_left} days"
            reminders.append({
                'type': 'info',
                'title': f"🎉 Holiday: {hname}",
                'message': f"{time_msg} — {hdate.isoformat()}",
                'priority': 3
            })

    # Attendance shortage warnings
    for s in summary:
        if s['total'] > 0:
            if s['percentage'] < 75:
                reminders.append({
                    'type': 'danger',
                    'icon': 'alert',
                    'title': f"Attendance Critical: {s['subject']}",
                    'message': f"Currently at {s['percentage']:.0f}%. Attend all upcoming classes to recover.",
                    'priority': 1
                })
            elif s['percentage'] < 80:
                can_miss = 0
                p, t = s['attended'], s['total']
                while (p / (t + 1) * 100) >= 75:
                    t += 1
                    can_miss += 1
                reminders.append({
                    'type': 'warning',
                    'icon': 'clock',
                    'title': f"Attendance Warning: {s['subject']}",
                    'message': f"At {s['percentage']:.0f}%. Can miss only {can_miss} more class(es).",
                    'priority': 2
                })
    
    # Task overload
    pending_count = len(todos)
    if pending_count > 8:
        reminders.append({
            'type': 'warning',
            'icon': 'tasks',
            'title': 'Task Overload',
            'message': f"You have {pending_count} pending tasks. Consider completing some today.",
            'priority': 2
        })
    
    # Coding motivation
    total_solved = sum(c.problems_solved for c in coding_stats)
    if total_solved == 0:
        reminders.append({
            'type': 'info',
            'icon': 'code',
            'title': 'Start Your Coding Journey',
            'message': 'Solve your first problem today! Link your LeetCode/CodeChef in profile.',
            'priority': 3
        })
    elif total_solved < 50:
        reminders.append({
            'type': 'info',
            'icon': 'trending',
            'title': 'Keep Coding!',
            'message': f"{total_solved} problems solved. Aim for 50 to unlock the Coder badge!",
            'priority': 3
        })
    
    reminders.sort(key=lambda x: x['priority'])
    return jsonify(reminders)

# ──── Feature 4: WEAK AREA DETECTION ────
@app.route('/api/weak-areas', methods=['GET'])
@login_required
def api_weak_areas():
    assessments = SubjectiveAssessment.objects(student=current_user, status='completed')
    
    subject_units = {}
    for a in assessments:
        key = a.subject
        if key not in subject_units:
            subject_units[key] = {}
        unit_key = f"Unit {a.unit}"
        if unit_key not in subject_units[key]:
            subject_units[key][unit_key] = {'total_score': 0, 'max_score': 0, 'attempts': 0}
        subject_units[key][unit_key]['total_score'] += (a.total_score or 0)
        subject_units[key][unit_key]['max_score'] += (a.max_score or 0)
        subject_units[key][unit_key]['attempts'] += 1
    
    results = []
    for subject, units in subject_units.items():
        unit_data = []
        total_earned = 0
        total_possible = 0
        for unit_name, data in sorted(units.items()):
            pct = (data['total_score'] / data['max_score'] * 100) if data['max_score'] > 0 else 0
            total_earned += data['total_score']
            total_possible += data['max_score']
            unit_data.append({
                'unit': unit_name,
                'score': data['total_score'],
                'max_score': data['max_score'],
                'percentage': round(pct, 1),
                'attempts': data['attempts'],
                'status': 'strong' if pct >= 70 else 'moderate' if pct >= 50 else 'weak'
            })
        overall_pct = (total_earned / total_possible * 100) if total_possible > 0 else 0
        results.append({
            'subject': subject,
            'subject_name': SUBJECT_INFO.get(subject, {}).get('name', subject),
            'overall_percentage': round(overall_pct, 1),
            'overall_status': 'strong' if overall_pct >= 70 else 'moderate' if overall_pct >= 50 else 'weak',
            'units': unit_data
        })
    
    results.sort(key=lambda x: x['overall_percentage'])
    return jsonify(results)

@app.route('/api/weak-areas/recovery-plan', methods=['POST'])
@login_required
def api_recovery_plan():
    data = request.get_json()
    subject = data.get('subject')
    unit_performance = data.get('units', [])
    
    if not subject:
        return jsonify({"error": "Subject is required"}), 400
    
    # Filter for weak units
    weak_units = [u['unit'] for u in unit_performance if u['status'] == 'weak']
    
    if not weak_units:
        return jsonify({"plan": "Great job! You don't have any critical weak areas in this subject. Keep maintaining your performance."})
    
    from assessment_engine import call_model, SUBJECT_INFO
    subject_name = SUBJECT_INFO.get(subject, {}).get('name', subject)
    
    prompt = f"""
    The student is struggling with the following units in {subject_name} ({subject}):
    {', '.join(weak_units)}
    
    Based on these weak areas, provide a concise 4-5 bullet point AI recovery plan. 
    Suggest specific high-priority topics for these units and a study strategy.
    Keep it encouraging and actionable.
    """
    
    plan = call_model(prompt, "You are a helpful academic counselor.")
    return jsonify({"plan": plan or "Focus on revising the fundamentals of the identified weak units."})

# ──── Feature 2: STUDY PLANNER ────
@app.route('/api/study-plan', methods=['GET'])
@login_required
def api_get_study_plan():
    date_str = request.args.get('date', date.today().isoformat())
    try:
        target_date = datetime.fromisoformat(date_str)
    except:
        target_date = datetime.combine(date.today(), datetime.min.time())
    
    plan = StudyPlan.objects(student=current_user, date=target_date).first()
    if not plan:
        return jsonify({'blocks': [], 'ai_generated': False})
    return jsonify({
        'id': str(plan.id),
        'date': plan.date.isoformat(),
        'blocks': plan.blocks,
        'ai_generated': plan.ai_generated
    })

@app.route('/api/study-plan/generate', methods=['POST'])
@login_required
def api_generate_study_plan():
    summary = get_attendance_summary(current_user)
    weak_subjects = [s['subject'] for s in summary if s['total'] > 0 and s['percentage'] < 80]
    all_subjects = [s['subject'] for s in summary if s['total'] > 0]
    
    # Build a simple prioritized plan
    blocks = []
    time_slots = [
        ('09:00', '10:30'), ('10:45', '12:15'), ('14:00', '15:30'),
        ('15:45', '17:15'), ('19:00', '20:30'), ('20:45', '22:00')
    ]
    
    # Prioritize weak subjects
    priority_subjects = weak_subjects + [s for s in all_subjects if s not in weak_subjects]
    
    for i, (start, end) in enumerate(time_slots):
        if i < len(priority_subjects):
            subj = priority_subjects[i]
            is_weak = subj in weak_subjects
            blocks.append({
                'subject': subj,
                'time_start': start,
                'time_end': end,
                'priority': 'high' if is_weak else 'normal',
                'notes': 'Focus area - attendance/performance low' if is_weak else 'Regular revision'
            })
    
    today_dt = datetime.combine(date.today(), datetime.min.time())
    plan = StudyPlan.objects(student=current_user, date=today_dt).first()
    if plan:
        plan.blocks = blocks
        plan.ai_generated = True
        plan.save()
    else:
        plan = StudyPlan(student=current_user, date=today_dt, blocks=blocks, ai_generated=True).save()
    
    return jsonify({
        'id': str(plan.id),
        'date': today_dt.isoformat(),
        'blocks': blocks,
        'ai_generated': True
    })

@app.route('/api/study-plan/save', methods=['POST'])
@login_required
def api_save_study_plan():
    data = request.get_json()
    blocks = data.get('blocks', [])
    date_str = data.get('date', date.today().isoformat())
    try:
        target_date = datetime.fromisoformat(date_str)
    except:
        target_date = datetime.combine(date.today(), datetime.min.time())
    
    plan = StudyPlan.objects(student=current_user, date=target_date).first()
    if plan:
        plan.blocks = blocks
        plan.ai_generated = False
        plan.save()
    else:
        plan = StudyPlan(student=current_user, date=target_date, blocks=blocks, ai_generated=False).save()
    return jsonify({'message': 'Plan saved', 'id': str(plan.id)})

# ──── Feature 5: NOTES UPLOAD ────
@app.route('/api/notes', methods=['GET'])
@login_required
def api_get_notes():
    search = request.args.get('search', '')
    subject = request.args.get('subject', '')
    notes = Note.objects(student=current_user).order_by('-uploaded_at')
    if subject:
        notes = notes.filter(subject=subject)
    if search:
        notes = notes.filter(Q(title__icontains=search) | Q(subject__icontains=search))
    return jsonify([{
        'id': str(n.id),
        'title': n.title,
        'subject': n.subject or '',
        'unit': n.unit,
        'filename': n.filename,
        'ai_summary': n.ai_summary or '',
        'uploaded_at': n.uploaded_at.strftime('%Y-%m-%d %H:%M')
    } for n in notes])

@app.route('/api/notes/upload', methods=['POST'])
@login_required
def api_upload_note():
    title = request.form.get('title', 'Untitled')
    subject = request.form.get('subject', '')
    unit = request.form.get('unit')
    file = request.files.get('file')
    
    if not file or not file.filename:
        return jsonify({'error': 'No file provided'}), 400
    
    filename = secure_filename(f"{current_user.username}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{file.filename}")
    file.save(os.path.join(NOTES_FOLDER, filename))
    
    note = Note(
        student=current_user,
        title=title,
        subject=subject,
        unit=int(unit) if unit else None,
        filename=filename
    ).save()
    
    return jsonify({'message': 'Note uploaded', 'id': str(note.id)}), 201

@app.route('/api/notes/<note_id>', methods=['DELETE'])
@login_required
def api_delete_note(note_id):
    try:
        note = Note.objects.get(id=note_id, student=current_user)
        filepath = os.path.join(NOTES_FOLDER, note.filename)
        if os.path.exists(filepath):
            os.remove(filepath)
        note.delete()
        return jsonify({'message': 'Note deleted'})
    except DoesNotExist:
        return jsonify({'error': 'Note not found'}), 404

@app.route('/api/notes/<note_id>/summarize', methods=['POST'])
@login_required
def api_summarize_note(note_id):
    try:
        note = Note.objects.get(id=note_id, student=current_user)
    except DoesNotExist:
        return jsonify({'error': 'Note not found'}), 404
    
    filepath = os.path.join(NOTES_FOLDER, note.filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found on server'}), 404
    
    from assessment_engine import extract_file_text, call_model
    text = extract_file_text(filepath)
    if not text:
        return jsonify({'error': 'Could not extract text from file'}), 400
    
    prompt = f"Summarize the following academic notes in 5-8 concise bullet points:\n\n{text[:8000]}"
    summary = call_model(prompt, "You are a concise academic summarizer.")
    
    if summary:
        note.ai_summary = summary
        note.save()
        return jsonify({'summary': summary})
    return jsonify({'error': 'Failed to generate summary'}), 500

# ──── Feature 5.5: CERTIFICATIONS ────
@app.route('/api/certifications', methods=['GET'])
@login_required
def api_get_certifications():
    certs = Certification.objects(student=current_user).order_by('-uploaded_at')
    return jsonify([{
        'id': str(c.id),
        'title': c.title,
        'organization': c.organization,
        'date_issued': c.date_issued.strftime('%Y-%m-%d') if c.date_issued else None,
        'filename': c.filename,
        'uploaded_at': c.uploaded_at.strftime('%Y-%m-%d %H:%M')
    } for c in certs])

@app.route('/api/certifications/upload', methods=['POST'])
@login_required
def api_upload_certification():
    title = request.form.get('title', 'Untitled')
    organization = request.form.get('organization', 'Unknown')
    date_issued_str = request.form.get('date_issued')
    file = request.files.get('file')
    
    if not file or not file.filename:
        return jsonify({'error': 'No file provided'}), 400
        
    date_issued = None
    if date_issued_str:
        try:
            date_issued = datetime.strptime(date_issued_str, '%Y-%m-%d')
        except ValueError:
            pass
            
    filename = secure_filename(f"cert_{current_user.username}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{file.filename}")
    file.save(os.path.join(CERTIFICATIONS_FOLDER, filename))
    
    cert = Certification(
        student=current_user,
        title=title,
        organization=organization,
        date_issued=date_issued,
        filename=filename
    ).save()
    
    return jsonify({'message': 'Certification uploaded', 'id': str(cert.id)}), 201

@app.route('/api/certifications/<cert_id>', methods=['DELETE'])
@login_required
def api_delete_certification(cert_id):
    try:
        cert = Certification.objects.get(id=cert_id, student=current_user)
        filepath = os.path.join(CERTIFICATIONS_FOLDER, cert.filename)
        if os.path.exists(filepath):
            os.remove(filepath)
        cert.delete()
        return jsonify({'message': 'Certification deleted'})
    except DoesNotExist:
        return jsonify({'error': 'Certification not found'}), 404


# ──── Feature 6: GAMIFICATION ────

BADGE_DEFINITIONS = [
    {'id': 'first_login', 'name': 'First Steps', 'desc': 'Logged in for the first time', 'icon': '🚀'},
    {'id': 'attendance_80', 'name': 'Attendance Pro', 'desc': 'Overall attendance above 80%', 'icon': '📅'},
    {'id': 'attendance_90', 'name': 'Attendance Master', 'desc': 'Overall attendance above 90%', 'icon': '🏆'},
    {'id': 'problems_50', 'name': 'Code Warrior', 'desc': 'Solved 50+ coding problems', 'icon': '⚔️'},
    {'id': 'problems_100', 'name': 'Century Club', 'desc': 'Solved 100+ coding problems', 'icon': '💯'},
    {'id': 'problems_200', 'name': 'Code Legend', 'desc': 'Solved 200+ coding problems', 'icon': '🏅'},
    {'id': 'first_assessment', 'name': 'Test Taker', 'desc': 'Completed first assessment', 'icon': '📝'},
    {'id': 'all_subjects', 'name': 'Well Rounded', 'desc': 'Assessed in all subjects', 'icon': '🌟'},
    {'id': 'streak_7', 'name': '7-Day Streak', 'desc': 'Active for 7 consecutive days', 'icon': '🔥'},
    {'id': 'notes_5', 'name': 'Note Keeper', 'desc': 'Uploaded 5+ notes', 'icon': '📚'},
]

@app.route('/api/gamification', methods=['GET'])
@login_required
def api_gamification():
    gam = UserGamification.objects(student=current_user).first()
    if not gam:
        gam = UserGamification(student=current_user, badges=[{'id': 'first_login', 'unlocked_at': datetime.utcnow().isoformat()}]).save()
    
    return jsonify({
        'xp': gam.xp,
        'level': gam.level,
        'badges': gam.badges,
        'study_streak': gam.study_streak,
        'attendance_streak': gam.attendance_streak,
        'coding_streak': gam.coding_streak,
        'all_badges': BADGE_DEFINITIONS,
        'xp_to_next': (gam.level) * 100
    })

@app.route('/api/gamification/check', methods=['POST'])
@login_required
def api_check_gamification():
    gam = UserGamification.objects(student=current_user).first()
    if not gam:
        gam = UserGamification(student=current_user).save()
    
    unlocked_ids = {b['id'] for b in gam.badges}
    new_badges = []
    xp_gained = 0
    
    # Check attendance badges
    summary = get_attendance_summary(current_user)
    total_l = sum(s['total'] for s in summary)
    attended_l = sum(s['attended'] for s in summary)
    att_pct = (attended_l / total_l * 100) if total_l > 0 else 0
    
    if att_pct >= 80 and 'attendance_80' not in unlocked_ids:
        new_badges.append({'id': 'attendance_80', 'unlocked_at': datetime.utcnow().isoformat()})
        xp_gained += 50
    if att_pct >= 90 and 'attendance_90' not in unlocked_ids:
        new_badges.append({'id': 'attendance_90', 'unlocked_at': datetime.utcnow().isoformat()})
        xp_gained += 100
    
    # Check coding badges
    total_solved = sum(c.problems_solved for c in CodingStat.objects(student=current_user))
    if total_solved >= 50 and 'problems_50' not in unlocked_ids:
        new_badges.append({'id': 'problems_50', 'unlocked_at': datetime.utcnow().isoformat()})
        xp_gained += 50
    if total_solved >= 100 and 'problems_100' not in unlocked_ids:
        new_badges.append({'id': 'problems_100', 'unlocked_at': datetime.utcnow().isoformat()})
        xp_gained += 100
    if total_solved >= 200 and 'problems_200' not in unlocked_ids:
        new_badges.append({'id': 'problems_200', 'unlocked_at': datetime.utcnow().isoformat()})
        xp_gained += 200
    
    # Check assessment badges
    assessments = SubjectiveAssessment.objects(student=current_user, status='completed')
    if assessments.count() > 0 and 'first_assessment' not in unlocked_ids:
        new_badges.append({'id': 'first_assessment', 'unlocked_at': datetime.utcnow().isoformat()})
        xp_gained += 30
    
    # Check notes badges
    notes_count = Note.objects(student=current_user).count()
    if notes_count >= 5 and 'notes_5' not in unlocked_ids:
        new_badges.append({'id': 'notes_5', 'unlocked_at': datetime.utcnow().isoformat()})
        xp_gained += 30
    
    # First login badge
    if 'first_login' not in unlocked_ids:
        new_badges.append({'id': 'first_login', 'unlocked_at': datetime.utcnow().isoformat()})
        xp_gained += 10
    
    # Apply
    if new_badges or xp_gained > 0:
        gam.badges = gam.badges + new_badges
        gam.xp += xp_gained
        gam.level = (gam.xp // 100) + 1
        gam.save()
    
    return jsonify({
        'new_badges': new_badges,
        'xp_gained': xp_gained,
        'total_xp': gam.xp,
        'level': gam.level
    })

# ──── Feature 7: LEADERBOARD ────
@app.route('/api/leaderboard', methods=['GET'])
@login_required
def api_leaderboard():
    users = User.objects(show_on_leaderboard=True)
    board = []
    for u in users:
        coding = sum(c.problems_solved for c in CodingStat.objects(student=u))
        summary = get_attendance_summary(u)
        total_l = sum(s['total'] for s in summary)
        attended_l = sum(s['attended'] for s in summary)
        att = (attended_l / total_l * 100) if total_l > 0 else 0
        gam = UserGamification.objects(student=u).first()
        board.append({
            'id': str(u.id),
            'name': u.full_name or u.username,
            'problems_solved': coding,
            'attendance': round(att, 1),
            'xp': gam.xp if gam else 0,
            'level': gam.level if gam else 1,
            'is_self': str(u.id) == str(current_user.id)
        })
    board.sort(key=lambda x: x['xp'], reverse=True)
    return jsonify(board)

@app.route('/api/leaderboard/toggle', methods=['POST'])
@login_required
def api_toggle_leaderboard():
    current_user.show_on_leaderboard = not current_user.show_on_leaderboard
    current_user.save()
    return jsonify({'show_on_leaderboard': current_user.show_on_leaderboard})

# ──── Feature 8: CODING DEEP ANALYSIS ────
@app.route('/api/coding/deep-analysis', methods=['GET'])
@login_required
def api_coding_deep_analysis():
    stats = CodingStat.objects(student=current_user)
    total = sum(s.problems_solved for s in stats)
    
    # Estimated difficulty breakdown (heuristic since we don't have per-problem data)
    easy = round(total * 0.45)
    medium = round(total * 0.40)
    hard = total - easy - medium
    
    # Estimated topic breakdown
    topics = [
        {'name': 'Arrays & Strings', 'solved': round(total * 0.25), 'total': round(total * 0.25 * 1.5)},
        {'name': 'Linked Lists', 'solved': round(total * 0.10), 'total': round(total * 0.10 * 1.8)},
        {'name': 'Trees & Graphs', 'solved': round(total * 0.15), 'total': round(total * 0.15 * 2.0)},
        {'name': 'Dynamic Programming', 'solved': round(total * 0.12), 'total': round(total * 0.12 * 2.5)},
        {'name': 'Sorting & Searching', 'solved': round(total * 0.15), 'total': round(total * 0.15 * 1.4)},
        {'name': 'Math & Logic', 'solved': round(total * 0.10), 'total': round(total * 0.10 * 1.6)},
        {'name': 'Recursion & Backtracking', 'solved': round(total * 0.08), 'total': round(total * 0.08 * 2.2)},
        {'name': 'Greedy', 'solved': round(total * 0.05), 'total': round(total * 0.05 * 2.0)},
    ]
    
    weak_topics = [t['name'] for t in topics if t['total'] > 0 and (t['solved'] / t['total'] * 100) < 55]
    
    return jsonify({
        'total_solved': total,
        'difficulty': {'easy': easy, 'medium': medium, 'hard': hard},
        'topics': topics,
        'weak_topics': weak_topics,
        'platforms': [{'platform': s.platform, 'solved': s.problems_solved, 'rating': s.rating} for s in stats]
    })

# ──── ACADEMIC CALENDAR & SMART REMINDERS ────

ACADEMIC_CALENDAR = [
    # February 2026
    {"date": "2026-02-04", "event": "Teaching Start", "category": "academic"},
    {"date": "2026-02-14", "event": "Internship Project Title Finalization", "category": "internship"},
    # March 2026
    {"date": "2026-03-02", "event": "Detention List 1", "category": "academic"},
    {"date": "2026-03-06", "event": "Converges 2K26 / Annual Gathering", "category": "event"},
    {"date": "2026-03-07", "event": "Converges 2K26", "category": "event"},
    {"date": "2026-03-14", "event": "Staff Feedback 1 (ERP)", "category": "academic"},
    {"date": "2026-03-27", "event": "Internship Monitoring 1", "category": "internship"},
    {"date": "2026-03-28", "event": "Project Monitoring 1", "category": "project"},
    # April 2026
    {"date": "2026-04-02", "event": "Detention List 2", "category": "academic"},
    {"date": "2026-04-06", "event": "Term Test 1 (TT-1) Starts", "category": "exam"},
    {"date": "2026-04-07", "event": "Term Test 1 (TT-1)", "category": "exam"},
    {"date": "2026-04-08", "event": "Term Test 1 (TT-1) Ends", "category": "exam"},
    {"date": "2026-04-15", "event": "Presentations Begin", "category": "academic"},
    {"date": "2026-04-16", "event": "Presentations / Teaching End", "category": "academic"},
    {"date": "2026-04-17", "event": "Presentations", "category": "academic"},
    {"date": "2026-04-27", "event": "Internship Monitoring 2", "category": "internship"},
    {"date": "2026-04-28", "event": "Project Monitoring 2", "category": "project"},
    # May 2026
    {"date": "2026-05-04", "event": "Detention List 3", "category": "academic"},
    {"date": "2026-05-05", "event": "Term Test 2 (TT-2) Starts", "category": "exam"},
    {"date": "2026-05-06", "event": "Term Test 2 (TT-2)", "category": "exam"},
    {"date": "2026-05-07", "event": "Term Test 2 (TT-2) Ends", "category": "exam"},
    {"date": "2026-05-08", "event": "Internship Monitoring 3", "category": "internship"},
    {"date": "2026-05-09", "event": "Project Monitoring 3", "category": "project"},
    {"date": "2026-05-15", "event": "Presentations Begin", "category": "academic"},
    {"date": "2026-05-16", "event": "Presentations / Teaching End", "category": "academic"},
    {"date": "2026-05-17", "event": "Presentations", "category": "academic"},
    {"date": "2026-05-18", "event": "Start of Theory Exam / End of Practical Exam", "category": "exam"},
    {"date": "2026-05-25", "event": "Staff Feedback 1 (ERP)", "category": "academic"},
    {"date": "2026-05-28", "event": "Mock Interview", "category": "placement"},
    {"date": "2026-05-29", "event": "Mock Interview", "category": "placement"},
    {"date": "2026-05-30", "event": "Mock Interview", "category": "placement"},
    # June 2026
    {"date": "2026-06-06", "event": "End of Theory Exam", "category": "exam"},
    {"date": "2026-06-08", "event": "Start of Practical Exam", "category": "exam"},
    {"date": "2026-06-16", "event": "Teaching End", "category": "academic"},
    {"date": "2026-06-18", "event": "End of Practical Exam", "category": "exam"},
]

@app.route('/api/academic-calendar', methods=['GET'])
@login_required
def api_academic_calendar():
    """Return the full academic calendar with holidays merged in."""
    all_events = []
    for item in ACADEMIC_CALENDAR:
        all_events.append(item)
    for d, name in HOLIDAYS.items():
        all_events.append({"date": d.isoformat(), "event": name, "category": "holiday"})
    all_events.sort(key=lambda x: x["date"])
    return jsonify(all_events)




if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

