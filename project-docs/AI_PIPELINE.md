# AI PIPELINE — SafeNet AI Recruitment Tool

## Current State Summary

> ⚠️ **The AI pipeline is currently a placeholder.** The `evaluate_with_ai` endpoint assigns random scores (`random.uniform(40, 100)`) rather than performing any actual resume analysis, skill extraction, or matching. The interview question generation page (`generate.html`) is a completely static UI prototype with no backend integration.

---

## Target AI Pipeline (Full Vision)

The intended end-to-end AI workflow for the recruitment tool:

```
1. Resume Upload (HR)
       ↓
2. Resume Parsing (text extraction from PDF/DOC)
       ↓
3. Skill Extraction (NLP-based entity extraction)
       ↓
4. Job Matching (compare extracted skills vs. job_requirement)
       ↓
5. AI Score Generation (0–100 numeric match score)
       ↓
6. Candidate Ranking (ORDER BY score DESC in resume_job_map)
       ↓
7. Shortlisting (HR selects, status → 'shortlisted')
       ↓
8. Manager Approval (status → 'approved')
       ↓
9. Resume-based Interview Question Generation
       ↓
10. Interview Scheduling (HR schedules)
       ↓
11. Exam / Assessment (Candidate takes exam online)
       ↓
12. Batch Result Processing (Manager scores exam)
       ↓
13. Email Notification (Selection / Rejection emails)
       ↓
14. Finalisation (HR marks joined / rejected)
```

---

## Step-by-Step Analysis

### Step 1: Resume Upload ✅ Implemented
**Location:** `recruitment/views.py` → `upload_candidate_resume`  
**Endpoint:** `POST /api/hr/upload/`

- Accepts multipart form: `name`, `email`, `phone`, `resume` (file)
- Saves to `/media/resumes/<filename>` via `FileSystemStorage`
- Inserts into `resume` table: `resume_name`, `email`, `phone_number`, `file_location`, `created_by`, `uploaded_at`
- Sets `is_active=TRUE` (default)

**Gap:** No file format validation beyond basic frontend check. No duplicate detection.

---

### Step 2: Resume Parsing ❌ Not Implemented
**What's needed:**
- Extract text content from uploaded PDF/DOCX files
- Libraries: `pdfminer.six`, `python-docx`, or `PyMuPDF`

**Where to add:** Inside `upload_candidate_resume` (immediate) or in a separate `parse_resume` task called by `evaluate_with_ai`.

**Recommended:**
```python
import pdfminer.high_level as pdf

def parse_resume_text(file_path):
    """Extract raw text from PDF resume"""
    return pdf.extract_text(file_path)
```

**DB storage needed:** Add `parsed_text TEXT` column to `resume` table.

---

### Step 3: Skill Extraction ❌ Not Implemented
**What's needed:**
- Extract skill names from parsed resume text
- Match against known skills in `skill_master` table
- Options: Regex matching, spaCy NER, or Gemini AI API

**Where to add:** As part of the AI evaluation pipeline.

**Example approach:**
```python
def extract_skills(text, known_skills):
    """Match known skills against resume text"""
    found = []
    for skill in known_skills:
        if skill.lower() in text.lower():
            found.append(skill)
    return found
```

**DB storage needed:** Add `extracted_skills JSON` column to `resume` table.

---

### Step 4: Job Matching ❌ Not Implemented (Placeholder)
**What's needed:**
- Compare extracted resume skills against `job_requirement` → `job_skill` list
- Calculate match percentage: `matched_skills / required_skills * 100`
- Optionally weight by soft skills and education

**Current placeholder in** `views.py` line 773:
```python
score = round(random.uniform(40, 100), 2)  # placeholder for real AI
```

**Replacement logic (example):**
```python
def calculate_match_score(resume_skills, required_skills, resume_education, required_education):
    skill_match = len(set(resume_skills) & set(required_skills)) / len(required_skills)
    edu_match = 1.0 if resume_education in required_education else 0.5
    score = (skill_match * 0.7 + edu_match * 0.3) * 100
    return round(score, 2)
```

---

### Step 5: AI Score Generation ⚠️ Partial (Placeholder)
**Location:** `recruitment/views.py` → `evaluate_with_ai` (lines 751–789)  
**Endpoint:** `POST /api/evaluate/`

**Current flow:**
```python
for resume_id in resume_ids:
    score = round(random.uniform(40, 100), 2)  # ← PLACEHOLDER
    cursor.execute("""
        INSERT INTO resume_job_map (resume_id, requirement_id, score, status, evaluated_by)
        VALUES (%s, %s, %s, %s, %s)
    """, [resume_id, requirement_id, score, 'evaluated', user_id])
    cursor.execute("UPDATE resume SET is_active = FALSE WHERE resume_id = %s", [resume_id])
```

**What needs to change:**
1. Load the resume file from `file_location`
2. Parse it to text
3. Extract skills
4. Compare against job_requirement skills
5. Calculate actual score
6. Use Gemini API or similar for semantic matching (optional advanced step)

---

### Step 6: Candidate Ranking ✅ Implemented
**Location:** `views.py` → `get_resumes_with_scores`  
**Endpoint:** `GET /api/hr/resumes/<requirement_id>/`

- Returns resumes ordered by `score DESC`
- Status filter: `status = 'evaluated'`
- Frontend displays as ranked cards with score badges

---

### Step 7: Shortlisting ✅ Implemented
**Location:** `views.py` → `shortlist_resumes`  
**Endpoint:** `POST /api/hr/shortlist/`

- HR selects resumes (checkbox UI in `hr_filterresume.html`)
- Selected → `status='shortlisted'`, others → `status='rejected'`

---

### Step 8: Manager Approval ✅ Implemented
**Location:** `views.py` → `approve_shortlisted_candidates`  
**Endpoint:** `POST /api/manager/approve-shortlist/`

- Manager selects from shortlisted → `status='approved'`, others → `status='rejected'`

---

### Step 9: Resume-based Interview Question Generation ❌ Not Implemented
**Frontend:** `pages/generate.html` — static prototype (no API calls)  
**Backend:** No endpoint exists

**What's needed:**
- A new API endpoint: `POST /api/hr/generate-interview-questions/`
- Input: `resume_id`, `requirement_id`, `question_count`, `difficulty`
- Output: List of generated questions with category (Technical, Behavioral, etc.)

**Implementation approach (using Gemini API):**
```python
import google.generativeai as genai

def generate_interview_questions(resume_text, job_skills, position, difficulty):
    prompt = f"""
    You are a technical recruiter. Generate {question_count} interview questions for:
    - Position: {position}
    - Required Skills: {', '.join(job_skills)}
    - Candidate Resume Summary: {resume_text[:500]}
    - Difficulty: {difficulty}/5
    
    Format as JSON with: question_text, category, difficulty, estimated_time_minutes
    """
    response = genai.GenerativeModel('gemini-pro').generate_content(prompt)
    return json.loads(response.text)
```

**DB storage needed:** 
- `exam_question` table already exists for storing questions
- Add `generated_from_resume_id`, `generated_for_requirement_id` columns to `exam_question`

---

### Step 10: Interview Scheduling ✅ Implemented
**Location:** `views.py` → `hr_schedule_interview`  
**Endpoint:** `POST /api/hr/schedule-interview/`

- Creates `interview_schedule` record
- Updates `resume_job_map.status = 'interview_scheduled'`

---

### Step 11: Exam / Assessment ✅ Implemented (Backend APIs exist)
**Endpoints:**
- `POST /api/candidate/start-exam/` → creates `exam_session`
- `POST /api/candidate/submit-answers/` → creates `exam_answer` records
- `GET /api/candidate/exam-status/<session_id>/`

**Gap:** `exam_question` table must be pre-populated with questions. No API to create questions. The candidate exam UI is minimal in `candidate_dashboard.html`.

---

### Step 12: Batch Result Processing ✅ Implemented (Backend)
**Location:** `views.py` → `manager_update_exam_scores`  
**Endpoint:** `POST /api/manager/update-exam-scores/`

- Manager reviews answers, assigns scores
- Aggregates total score to `resume_job_map.exam_score`
- Updates `exam_session.status = 'scored'`
- Updates `resume_job_map.status = 'exam_scored'`

---

### Step 13: Email Notification ❌ Not Implemented

**Settings.py shows commented-out email config:**
```python
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = 'smtp.example.com'
# EMAIL_PORT = 587
# EMAIL_USE_TLS = True
# EMAIL_HOST_USER = 'your_email@example.com'
# EMAIL_HOST_PASSWORD = 'your_email_password'
```

**What's needed:**
1. Uncomment and configure email settings in `settings.py` (use `.env` variables)
2. Create endpoint: `POST /api/hr/send-batch-emails/`
3. Logic:
   - For `status='approved'` → send selection email
   - For `status='rejected'` → send rejection email
4. Template design for each email type

**Example implementation:**
```python
from django.core.mail import send_mail

@api_view(['POST'])
def send_batch_emails(request):
    requirement_id = request.data.get('requirement_id')
    # Fetch approved candidates
    # Fetch rejected candidates
    # Send emails using Django's send_mail()
    pass
```

---

### Step 14: Finalisation ✅ Implemented
**Location:** `views.py` → `hr_update_finalised_status`  
**Endpoint:** `POST /api/hr/update-finalised-status/`

- HR updates candidates to `joined` or `rejected`

---

## AI Pipeline Status Matrix

| Step | Description | Status | Location |
|------|-------------|--------|---------|
| 1 | Resume Upload | ✅ Complete | `upload_candidate_resume` |
| 2 | Resume Parsing | ❌ Missing | — |
| 3 | Skill Extraction | ❌ Missing | — |
| 4 | Job Matching | ❌ Missing (placeholder) | `evaluate_with_ai` |
| 5 | AI Score Generation | ⚠️ Placeholder | `evaluate_with_ai` (random) |
| 6 | Candidate Ranking | ✅ Complete | `get_resumes_with_scores` |
| 7 | Shortlisting | ✅ Complete | `shortlist_resumes` |
| 8 | Manager Approval | ✅ Complete | `approve_shortlisted_candidates` |
| 9 | Interview Question Gen | ❌ Missing | — (UI only in `generate.html`) |
| 10 | Interview Scheduling | ✅ Complete | `hr_schedule_interview` |
| 11 | Exam/Assessment | ⚠️ Partial | APIs exist, no question creation UI |
| 12 | Batch Result Processing | ✅ Complete | `manager_update_exam_scores` |
| 13 | Email Notification | ❌ Missing | — (settings commented out) |
| 14 | Finalisation | ✅ Complete | `hr_update_finalised_status` |

---

## Dependencies Needed for Full AI Pipeline

```txt
# Resume parsing
pdfminer.six>=20221105
python-docx>=0.8.11

# NLP / Skill Extraction (optional)
spacy>=3.7.0

# Google Gemini AI (for question generation and semantic matching)
google-generativeai>=0.3.0

# Email (already in Django, just needs config)
# django.core.mail (built-in)

# Async task queue (for batch processing - optional but recommended)
celery>=5.3.0
redis>=5.0.0
```

> Currently `requirements.txt` lists only: Django, djangorestframework, django-cors-headers, mysqlclient, python-dotenv
