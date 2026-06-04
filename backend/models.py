"""
Database Models for Student Performance System
Defines the schema for MongoDB using MongoEngine.
"""
from mongoengine import Document, StringField, IntField, ReferenceField, DateTimeField, BooleanField, ListField, DictField, CASCADE
from flask_login import UserMixin
from datetime import datetime, date

class Branch(Document):
    name = StringField(max_length=50, required=True)
    full_name = StringField(max_length=200)
    year = StringField(max_length=50)

    def __unicode__(self):
        return self.name

class User(Document, UserMixin):
    username = StringField(max_length=150, unique=True, required=True)
    password = StringField(max_length=300, required=True)
    full_name = StringField(max_length=200)
    roll_no = StringField(max_length=50)
    prn = StringField(max_length=50)
    email = StringField(max_length=200)
    photo = StringField(max_length=300)
    branch = ReferenceField(Branch)
    section = StringField(max_length=5)
    leetcode = StringField(max_length=500)
    hackerrank = StringField(max_length=500)
    codechef = StringField(max_length=500)
    github = StringField(max_length=500)
    university = StringField(max_length=200)
    semester = StringField(max_length=50)
    cgpa_target = StringField(max_length=10)
    total_semesters = IntField(default=8)
    semesters_completed = IntField(default=0)
    sem_gpas = ListField(StringField())
    role = StringField(max_length=20, default='student')
    show_on_leaderboard = BooleanField(default=False)
    
    def get_id(self):
        return str(self.id)

class TimetableSlot(Document):
    branch = ReferenceField(Branch, required=True)
    day = StringField(max_length=10, required=True)
    slot_number = IntField(required=True)
    start_time = StringField(max_length=10, required=True)
    end_time = StringField(max_length=10, required=True)
    subject_name = StringField(max_length=50, required=True)
    subject_type = StringField(max_length=5, required=True)
    section = StringField(max_length=5)
    professor = StringField(max_length=100)

class LectureAttendance(Document):
    student = ReferenceField(User, required=True)
    date = DateTimeField(default=date.today, required=True)
    timetable_slot = ReferenceField(TimetableSlot, required=True)
    status = StringField(max_length=10, required=True)
    
    meta = {
        'indexes': [
            {'fields': ('student', 'date', 'timetable_slot'), 'unique': True}
        ]
    }

class Todo(Document):
    student = ReferenceField(User, required=True)
    task = StringField(max_length=250, required=True)
    completed = BooleanField(default=False)
    date_added = DateTimeField(default=datetime.utcnow)
    type = StringField(max_length=50)

class CodingStat(Document):
    student = ReferenceField(User, required=True)
    platform = StringField(max_length=100, required=True)
    problems_solved = IntField(default=0)
    rating = IntField(default=0)

class Notification(Document):
    student = ReferenceField(User, required=True)
    title = StringField(max_length=200, required=True)
    desc = StringField(max_length=1000, required=True)
    type = StringField(max_length=50, default='info') # danger, warning, success, info
    read = BooleanField(default=False)
    date_added = DateTimeField(default=datetime.utcnow)

class SubjectiveAssessment(Document):
    student = ReferenceField(User, required=True)
    branch = ReferenceField(Branch, required=True)
    subject = StringField(max_length=100, required=True)
    unit = IntField(required=True)
    questions = ListField(DictField()) # [{id: str, text: str, marks: int, model_solution: str}]
    answers = ListField(DictField()) # [{question_id: str, student_answer: str, score: int, feedback: str}]
    total_score = IntField()
    max_score = IntField()
    status = StringField(max_length=20, default='pending') # pending, completed
    date_created = DateTimeField(default=datetime.utcnow)
    date_completed = DateTimeField()
    
class SubjectRecommendation(Document):
    subject_name = StringField(max_length=100, required=True)
    unit = IntField()
    topic = StringField(max_length=200)
    problem_name = StringField(max_length=200, required=True)
    problem_url = StringField(max_length=500, required=True)
    platform = StringField(max_length=50) # LeetCode, etc.
    difficulty = StringField(max_length=20) # Easy, Medium, Hard

class AssignedTrack(Document):
    student = ReferenceField(User, required=True)
    name = StringField(max_length=200, required=True)
    platform = StringField(max_length=50, required=True)
    url = StringField(max_length=500, required=True)
    progress = IntField(default=0)

class StudyPlan(Document):
    student = ReferenceField(User, required=True)
    date = DateTimeField(required=True)
    blocks = ListField(DictField())
    ai_generated = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.utcnow)

class Note(Document):
    student = ReferenceField(User, required=True)
    title = StringField(max_length=200, required=True)
    subject = StringField(max_length=100)
    unit = IntField()
    filename = StringField(max_length=300, required=True)
    ai_summary = StringField()
    uploaded_at = DateTimeField(default=datetime.utcnow)

class Certification(Document):
    student = ReferenceField(User, required=True)
    title = StringField(max_length=200, required=True)
    organization = StringField(max_length=200, required=True)
    date_issued = DateTimeField()
    filename = StringField(max_length=300, required=True)
    uploaded_at = DateTimeField(default=datetime.utcnow)

class UserGamification(Document):
    student = ReferenceField(User, unique=True, required=True)
    xp = IntField(default=0)
    level = IntField(default=1)
    badges = ListField(DictField())
    study_streak = IntField(default=0)
    attendance_streak = IntField(default=0)
    coding_streak = IntField(default=0)
    last_study_date = DateTimeField()
    last_coding_date = DateTimeField()

