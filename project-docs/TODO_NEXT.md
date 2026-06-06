# TODO NEXT — SafeNet AI Recruitment Tool

Recommended implementation order based on repository analysis. Items are prioritized logically — each builds on the previous.

---

## Priority 1 — Fix Critical Gaps (Do First)

These are foundational issues that block or degrade the current system.

### 1.1 Fix `update_job` View Inconsistency
**Problem:** `update_job` view uses `job_skills` and `job_softskills` (plural) but actual table names are `job_skill` and `job_softskill` (singular).  
**Fix:** Update table names in `update_job` view OR verify actual MySQL table names and align everywhere.  
**File:** `recruitment/views.py` lines 456–472  
**Risk:** Low — isolated fix

### 1.2 Fix Hardcoded User Names in Sidebars
**Problem:** Several pages show "Mark Green / Manager" or "HR Manager / Online" as hardcoded HTML instead of fetching from `GET /api/user-profile/`.  
**Files:** `pages/manager_job_creation.html`, `pages/generate.html`, `pages/hr_filterresume.html` sidebar  
**Fix:** Add `fetch('/api/user-profile/')` call on page load and inject `username` and `role` into sidebar DOM  
**Risk:** Low

### 1.3 Fix Broken Sidebar Links
**Problem:** `hr_filterresume.html` → Interview Scheduling link = `#`; `generate.html` → all sidebar links = `#`  
**Fix:** Wire correct relative paths  
**Risk:** Low

### 1.4 Add Backend Role Check on `/api/register/` and `/api/get-users/`
**Problem:** These endpoints have no role enforcement — any logged-in user can register new users or see all users.  
**Fix:** Add `if roleid != 1: return Response({'error': 'Unauthorized'}, status=401)` check  
**Files:** `recruitment/views.py`  
**Risk:** Low

---

## Priority 2 — Real AI Evaluation Engine

This is the core value-add of the entire tool. Without real AI scoring, the system is manually managed.

### 2.1 Install Resume Parsing Dependencies
```
pip install pdfminer.six python-docx
```
Add to `requirements.txt`.

### 2.2 Add `parsed_text` and `extracted_skills` Columns to `resume` Table
```sql
ALTER TABLE resume ADD COLUMN parsed_text LONGTEXT;
ALTER TABLE resume ADD COLUMN extracted_skills JSON;
```

### 2.3 Implement Resume Text Extraction
**File:** `recruitment/views.py` → add `parse_resume(file_path)` helper  
**Logic:**
- `.pdf` → use `pdfminer.six`
- `.docx` → use `python-docx`
- Call from `upload_candidate_resume` after saving file, or lazily in `evaluate_with_ai`

### 2.4 Implement Skill Extraction
**File:** `recruitment/views.py` → add `extract_skills_from_text(text, skill_master_list)` helper  
**Logic:** Keyword matching against `skill_master` table entries

### 2.5 Implement Real Scoring in `evaluate_with_ai`
**File:** `recruitment/views.py` → replace `random.uniform(40, 100)` with:
- Fetch job requirement's required skills from `job_skill` + `skill_master`
- Fetch resume's extracted skills
- Calculate: `(matched / required) * 100`
- Optional: Weight soft skills (10%), education (20%), tech skills (70%)

**Location:** Lines 772–779 in `views.py`

### 2.6 (Optional Advanced) Integrate Gemini AI for Semantic Matching
**What it adds:** Ability to match "Python experience" even if resume says "built APIs with Flask" without "Python" keyword  
**Library:** `google-generativeai`  
**New endpoint or replace placeholder:** `evaluate_with_ai`

---

## Priority 3 — Interview Question Generation

Currently a completely static UI prototype. This is a key differentiating feature.

### 3.1 Create Backend Endpoint
**New endpoint:** `POST /api/hr/generate-interview-questions/`  
**Request:**
```json
{ "resume_id": 1, "requirement_id": 5, "question_count": 10, "difficulty": 3 }
```
**Response:**
```json
{
  "questions": [
    { "text": "...", "category": "Technical", "difficulty": "Medium", "estimated_time": 5 }
  ]
}
```

### 3.2 Implementation Steps
1. Fetch resume `parsed_text` (requires Priority 2 to be done first)
2. Fetch job requirement's skills list
3. Build Gemini AI prompt combining resume summary + required skills + position
4. Parse JSON response from Gemini
5. Insert into `exam_question` table with `generated_from_resume_id` and `generated_for_requirement_id` references

### 3.3 Wire `generate.html` to Real API
- Replace hardcoded candidate list with `GET /api/manager/shortlist-details/<req_id>/`
- Replace hardcoded question cards with API response from `POST /api/hr/generate-interview-questions/`
- Add "Save as Exam" button that writes questions to `exam_question` table

### 3.4 Add Exam Question Management API
**New endpoints:**
- `GET /api/exam/questions/<requirement_id>/` — list questions for a requirement
- `POST /api/exam/questions/` — create questions manually
- `DELETE /api/exam/questions/<question_id>/` — delete a question

---

## Priority 4 — Candidate Exam UI (Full Flow)

Backend APIs exist. The candidate UI needs to be built out.

### 4.1 Build Full Exam Page in `candidate_dashboard.html`
**Flow:**
1. Candidate logs in → sees their available exam (based on `resume_job_map.status='approved'`)
2. Click "Start Exam" → calls `POST /api/candidate/start-exam/`
3. Questions displayed one by one (fetch from `GET /api/exam/questions/<requirement_id>/`)
4. Candidate answers → calls `POST /api/candidate/submit-answers/`
5. Shows "Exam Submitted" confirmation

### 4.2 Add Timer Component
- Track elapsed time per question
- Auto-submit if time runs out

---

## Priority 5 — Batch Email Notification System

Post-evaluation email automation for shortlisted/rejected candidates.

### 5.1 Configure Email Settings
**File:** `backend/settings.py`  
Uncomment and configure using `.env` variables:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL')
```

**Add to `.env.example`:**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your@email.com
EMAIL_HOST_PASSWORD=your_password
DEFAULT_FROM_EMAIL=recruitment@safenet.com
```

### 5.2 Create Email Templates
Two HTML email templates:
- **Selection Email:** Congratulations + next steps (interview date, location)
- **Rejection Email:** Thank you for applying + encouragement

### 5.3 Implement Batch Email Endpoint
**New endpoint:** `POST /api/hr/send-batch-emails/`  
**Request:**
```json
{ "requirement_id": 5, "email_type": "post_shortlist" }
```
**Logic:**
- For `status='shortlisted'` → send selection email
- For `status='rejected'` → send rejection email
- Log emails sent (new `email_log` table or update `resume_job_map`)

### 5.4 Add Email Log Table
```sql
CREATE TABLE email_log (
    log_id       INT AUTO_INCREMENT PRIMARY KEY,
    resume_id    INT NOT NULL,
    email_type   VARCHAR(50),           -- 'selection', 'rejection', 'interview_invite'
    sent_at      DATETIME,
    sent_by      INT,
    status       VARCHAR(20),           -- 'sent', 'failed'
    FOREIGN KEY (resume_id) REFERENCES resume(resume_id)
);
```

---

## Priority 6 — Candidate Ranking Dashboard

Visual analytics dashboard for HR/Manager.

### 6.1 New API: Candidate Analytics
**New endpoint:** `GET /api/analytics/requirement/<requirement_id>/`  
Returns:
- Total resumes uploaded
- Evaluated count
- Shortlisted count
- Approved count
- Rejected count
- Score distribution (histogram data)
- Top 5 candidates

### 6.2 Dashboard Widget in `hr_filterresume.html`
Add a "Results Summary" card at the top of the results section showing:
- Score distribution chart (use Chart.js CDN)
- Top 3 candidates highlighted
- Counts by status

---

## Priority 7 — Admin Analytics & Audit

### 7.1 Admin Dashboard Stats
**New endpoints:**
- `GET /api/admin/stats/` — total users, jobs, resumes, evaluations

### 7.2 Audit Log
Track all significant actions:
- Job created
- Resume evaluated
- Candidate shortlisted
- Approval granted
- Email sent

**New table:** `audit_log(log_id, action, performed_by, entity_type, entity_id, timestamp)`

---

## Priority 8 — Quality & Production Readiness

### 8.1 CSRF Protection
- Currently many views use `@csrf_exempt` — remove this after adding proper CSRF token handling in frontend JS
- Frontend needs to include `X-CSRFToken` header from cookie

### 8.2 Error Handling & Validation
- Standardize error response format across all endpoints
- Add input validation (pydantic or manual checks) for all POST bodies

### 8.3 Password Reset Flow
- Implement "Forgot Password?" link (token-based reset via email)

### 8.4 Production Deployment
- Set `DEBUG=False` in production `.env`
- Configure `ALLOWED_HOSTS` properly
- Add `gunicorn` to `requirements.txt`
- Serve media files via nginx

---

## Implementation Order Summary

```
Week 1:  Priority 1 (bug fixes) + Priority 2.1–2.4 (resume parsing + extraction)
Week 2:  Priority 2.5 (real AI scoring) + Priority 3.1–3.3 (question generation)
Week 3:  Priority 4 (candidate exam UI) + Priority 5.1–5.3 (email system)
Week 4:  Priority 5.4 + Priority 6 (ranking dashboard) + Priority 7 (analytics)
Week 5+: Priority 8 (quality + production)
```

---

## Quick Win Tasks (1–2 hours each)

| Task | File | Effort |
|------|------|--------|
| Fix broken sidebar links in `hr_filterresume.html` and `generate.html` | HTML files | 30 min |
| Wire user profile to sidebar in all pages | HTML files + inline JS | 1 hr |
| Fix `update_job` table name inconsistency | `views.py` | 30 min |
| Add role check to `/api/register/` | `views.py` | 15 min |
| Uncomment email settings in `settings.py` | `settings.py` + `.env` | 30 min |
| Add `parsed_text` column to `resume` table | MySQL migration | 15 min |
