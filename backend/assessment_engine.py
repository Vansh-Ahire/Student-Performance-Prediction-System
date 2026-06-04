import os
import requests
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import json
import re
import google.generativeai as genai

load_dotenv()

# Gemini Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '').strip().strip('"').strip("'")

if GEMINI_API_KEY:
    print(f"Configuring Gemini API...")
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY is empty or not set")

# Path to the university Data folder (relative to backend dir)
DATA_DIR = os.getenv('DATA_DIR', os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Data"))

# Subject keyword mappings for robust search
SUBJECT_KEYWORDS = {
    'AI': ['AI ', ' AI', 'ARTIFICIAL INTELLIGENCE'],
    'DBMS': ['DBMS', 'DATABASE MANAGEMENT'],
    'DAA': ['DAA', 'DESIGN AND ANALYSIS', 'ALGORITHM'],
    'PSI': ['PSI', 'STATISTICS', 'PROBABILITY'],
    'DTL': ['DTL', 'DESIGN THINKING'],
    'UHV': ['UHV', 'HUMAN VALUES', 'UNIVERSAL HUMAN'],
    'PL': ['PL', 'PROGRAMMING LANGUAGE', 'HTML', 'CSS', 'REACT', 'JAVASCRIPT']
}

# Full subject names and codes for official QB headers
SUBJECT_INFO = {
    'PSI': {'name': 'Probability and Statistical Inference', 'code': 'RCP23APC251'},
    'DAA': {'name': 'Design and Analysis of Algorithms', 'code': 'RCP23APC252'},
    'AI':  {'name': 'Artificial Intelligence', 'code': 'RCP23APC253'},
    'DBMS': {'name': 'Database Management Systems', 'code': 'RCP23AMD255'},
    'UHV': {'name': 'Universal Human Values', 'code': 'RCP23XHS284'},
    'DTL': {'name': 'Design Thinking Laboratory', 'code': 'RCP23XHS283L'},
    'PL': {'name': 'Programming Languages (HTML, CSS, React, JS)', 'code': 'RCP23APC256L'},
}

def call_model(prompt, system_prompt="You are a helpful university professor for AIML branch. Generate exam questions and solutions."):
    """Call Gemini API with the given prompt."""
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY not found")
        return None
    
    try:
        print(f"Calling Gemini API (using gemini-2.0-flash due to rate limits)...")
        # Switching to gemini-2.0-flash because gemini-2.5-flash quota was exceeded
        model = genai.GenerativeModel('gemini-2.0-flash', system_instruction=system_prompt)
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
            )
        )
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {type(e).__name__}: {e}")
        
        # Fallback to gemini-flash-latest if flash fails
        try:
            print("Trying fallback to gemini-flash-latest...")
            model = genai.GenerativeModel('gemini-flash-latest', system_instruction=system_prompt)
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                )
            )
            return response.text
        except Exception as e2:
            print(f"Gemini API Error (Fallback): {type(e2).__name__}: {e2}")
            return None

def find_answer_keys(subject_code):
    """Dynamically scans all files in the Data folder to find all PYQs/Answer Keys strictly for SY AIML."""
    if not os.path.exists(DATA_DIR):
        return []

    keywords = SUBJECT_KEYWORDS.get(subject_code, [subject_code])
    matched_paths = []

    for root, dirs, files in os.walk(DATA_DIR):
        for file in files:
            file_upper = file.upper()
            path_upper = root.upper()
            
            # Strict SY AIML filtering
            is_aiml = 'AIML' in path_upper or 'AI&ML' in path_upper or 'AIML' in file_upper
            is_sy = 'SEM 4' in path_upper or 'SEM-4' in path_upper or 'SEM-IV' in path_upper or 'SY' in path_upper or 'SYBTECH' in path_upper
            
            if is_aiml and is_sy:
                if any(kw in file_upper for kw in keywords) and file.endswith('.pdf'):
                    matched_paths.append(os.path.join(root, file))

    return matched_paths

def extract_file_text(file_path):
    ext = file_path.lower().split('.')[-1]
    text = ""
    try:
        if ext == 'pdf':
            reader = PdfReader(file_path)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        elif ext in ['docx', 'doc']:
            import docx
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif ext in ['pptx', 'ppt']:
            from pptx import Presentation
            prs = Presentation(file_path)
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        text += shape.text + "\n"
        else:
            # Fallback or plain text
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
    except Exception as e:
        print(f"Failed to read file {file_path}: {e}")
    return text

def extract_pdf_text(pdf_path):
    # Wrapper for backwards compatibility
    return extract_file_text(pdf_path)

def generate_questions(subject, unit):
    """
    Generates questions for a specific subject and unit using Gemini.
    Returns questions in official college Question Bank format with CO and Blooms Level.
    """
    print(f"Generating QB-format questions for {subject}, Unit {unit}")
    
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY not found")
        return None

    syllabus_path = os.path.join(DATA_DIR, "0. SY_AIML_2526_Sem_4_Structure&Syllabus.pdf")
    pyq_paths = find_answer_keys(subject)
    
    # Also scan the QB folder for additional question bank PDFs
    qb_dir = os.path.join(os.path.dirname(DATA_DIR), "QB")
    if os.path.exists(qb_dir):
        for f in os.listdir(qb_dir):
            if f.endswith('.pdf'):
                qb_path = os.path.join(qb_dir, f)
                if qb_path not in pyq_paths:
                    pyq_paths.append(qb_path)
    
    print(f"Syllabus path: {syllabus_path}, exists: {os.path.exists(syllabus_path)}")
    print(f"PYQ/QB paths found: {len(pyq_paths)}")
    
    context_parts = []
    if os.path.exists(syllabus_path):
        syllabus_text = extract_pdf_text(syllabus_path)
        truncated = syllabus_text[:150000] if len(syllabus_text) > 150000 else syllabus_text
        context_parts.append(f"SYLLABUS CONTEXT:\n{truncated}\n")
        
    pyq_combined_text = ""
    for path in pyq_paths:
        if os.path.exists(path):
            pyq_combined_text += f"\n--- SOURCE FILE: {os.path.basename(path)} ---\n" + extract_pdf_text(path)
            
    if pyq_combined_text:
        truncated_pyq = pyq_combined_text[:150000] if len(pyq_combined_text) > 150000 else pyq_combined_text
        context_parts.append(f"PREVIOUS YEAR PAPERS & QUESTION BANKS:\n{truncated_pyq}\n")
    
    context = "\n".join(context_parts)

    # Get subject info for the prompt
    subj_info = SUBJECT_INFO.get(subject, {'name': subject, 'code': ''})

    prompt = f"""ACT AS A UNIVERSITY EXAM QUESTION BANK CREATOR for R. C. Patel Institute of Technology, Shirpur.
BRANCH: Artificial Intelligence and Machine Learning (AIML)
YEAR: Second Year (SY) B.Tech
SEMESTER: IV (Even Semester)
SUBJECT: {subj_info['name']} [{subj_info['code']}]
UNIT: {unit}

{context}

TASK:
You are creating an OFFICIAL QUESTION BANK exactly like the ones provided by the college for Term Tests and End Semester Exams.

1. Extract ALL questions from the PREVIOUS YEAR PAPERS & QUESTION BANKS that belong to {subj_info['name']} Unit {unit}.
2. CROSS-VERIFY every question against the SYLLABUS CONTEXT. ONLY include questions within the syllabus scope for Unit {unit}.
3. Also GENERATE additional important questions that are likely to appear in exams based on the syllabus topics for Unit {unit}.
4. For each question, assign:
   - **marks**: 5 or 10 (based on question depth)
   - **co**: The Course Outcome it maps to (e.g., "CO1", "CO2", "CO3", "CO4") based on the syllabus CO mapping
   - **blooms**: Bloom's Taxonomy Level (e.g., "L1" for Remember, "L2" for Understand, "L3" for Apply, "L4" for Analyze, "L5" for Evaluate, "L6" for Create)
   - **model_solution**: A comprehensive model answer

5. IMPORTANT RULES FOR QUESTIONS:
   - If the original question references a diagram, figure or table that cannot be extracted from PDF text, REWRITE the question to be self-contained. Add "[Draw appropriate diagram]" or describe the diagram context in words so the question makes complete sense.
   - Include a good MIX of 5-mark and 10-mark questions (aim for at least 4 of each).
   - Questions with sub-parts (a, b, c) are encouraged for 10-mark questions.
   - Mathematical formulas should be written clearly using plain text notation.

RESPONSE FORMAT (strictly JSON ONLY, no markdown, no code blocks):
[{{"id":"q1","text":"...","marks":5,"co":"CO1","blooms":"L2","model_solution":"..."}},{{"id":"q2","text":"...","marks":10,"co":"CO2","blooms":"L3","model_solution":"..."}}]"""

    print("Sending request to Gemini...")
    response_text = call_model(prompt, "You are a precise university exam paper setter and curriculum expert for the AIML department.")
    
    if not response_text:
        print("ERROR: No response from Gemini")
        return None
    
    print(f"Response received: {response_text[:200]}...")
    
    # Extract JSON from response
    text = response_text.strip()
    # Remove markdown code block if present
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    
    # Try to find JSON array
    json_match = re.search(r'\[.*\]', text, re.DOTALL)
    if json_match:
        try:
            result = json.loads(json_match.group(0))
            print(f"Successfully parsed {len(result)} questions")
            return result
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Response text: {text}")
            return None
    else:
        print("ERROR: Could not extract JSON from response")
        print(f"Response text: {text}")
        return None

def evaluate_text_answer(question, student_answer):
    """
    Evaluates a single text-based answer using Gemini.
    """
    if not GEMINI_API_KEY:
        return {"score": 0, "feedback": "API Key missing"}

    prompt = f"""
ACT AS A UNIVERSITY EXAMINER.

QUESTION: {question['text']}
MAX MARKS: {question['marks']}
MODEL SOLUTION: {question['model_solution']}

STUDENT ANSWER: {student_answer}

TASK: Evaluate the student's answer against the model solution.
Assign marks out of {question['marks']} based on concepts, keywords, and accuracy.
Provide brief constructive feedback.

RESPONSE FORMAT (JSON ONLY):
{{"score": <integer>, "feedback": "Your feedback here..."}}
"""

    response_text = call_model(prompt, "You are a strict university examiner.")
    
    if not response_text:
        return {"score": 0, "feedback": "Failed to evaluate - API error"}
    
    # Extract JSON
    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except:
            return {"score": 0, "feedback": "Failed to parse evaluation"}
    return {"score": 0, "feedback": "Failed to evaluate"}

def evaluate_submission(pdf_path, subject, questions):
    """
    Evaluates a handwritten PDF submission using Gemini.
    """
    if not GEMINI_API_KEY:
        return {
            "score": 0,
            "feedback": "Gemini API Key missing. Please add GEMINI_API_KEY to your .env file."
        }

    # Read PDF text
    student_text = extract_pdf_text(pdf_path)
    if not student_text:
        return {"score": 0, "feedback": "Could not extract text from PDF"}

    questions_summary = "\n".join([f"Q{i+1} ({q['marks']}m): {q['text']}" for i, q in enumerate(questions)])

    prompt = f"""
ACT AS A STRICT UNIVERSITY EXAMINER FOR {subject}.

STUDENT SUBMISSION (extracted text):
{student_text[:5000]}

QUESTIONS TO EVALUATE:
{questions_summary}

TASK: Evaluate the student's submission against each question.
Assign marks for each question and provide total score.
Provide detailed constructive feedback.

RESPONSE FORMAT:
[TOTAL_SCORE]: <Integer out of total marks>
[DETAILED_FEEDBACK]: <Markdown feedback with marks per question>
"""

    response_text = call_model(prompt, "You are a strict university examiner for AIML branch.")
    
    if not response_text:
        return {"score": 0, "feedback": "Failed to evaluate submission"}

    # Parse the structured response
    score = 0
    feedback = response_text
    score_match = re.search(r'\[TOTAL_SCORE\]:\s*(\d+)', response_text)
    if score_match:
        score = int(score_match.group(1))
        feedback = response_text.replace(score_match.group(0), "").replace('[DETAILED_FEEDBACK]:', '').strip()

    return {"score": score, "feedback": feedback}
