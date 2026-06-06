# PROJECT OVERVIEW — SafeNet AI Recruitment Tool

## 1. Project Goal & Purpose

**SafeNet** is a cybersecurity company (branding: "Securing Your Digital Future") that has built an **internal AI-powered recruitment management system**. Its primary purpose is to streamline the end-to-end hiring process:

- Managers post job requirements with required skills, education, and experience.
- HR uploads candidate resumes into the system.
- AI evaluates and scores resumes against job requirements.
- HR shortlists candidates based on AI scores.
- Managers approve final shortlists.
- HR schedules interviews for approved candidates.
- Managers evaluate exam/interview performance.
- HR finalises candidate outcomes (joined / rejected).
- Candidates interact with an exam portal to take assessments.

---

## 2. System Architecture (End-to-End)

```
┌────────────────────────────────────────────────────────────┐
│                     FRONTEND (HTML/JS)                     │
│  Served as static files from /frontend/                    │
│  Uses Tailwind CSS + vanilla JS fetch API                  │
└────────────────────────────────────────────────────────────┘
                             │
              HTTP REST API calls (fetch, credentials: include)
                             │
┌────────────────────────────────────────────────────────────┐
│              BACKEND (Django 5.2 + DRF)                    │
│  Project: backend/  │  App: recruitment/                  │
│  All API endpoints defined in recruitment/urls.py          │
│  All business logic in recruitment/views.py                │
└────────────────────────────────────────────────────────────┘
                             │
                     Raw SQL (cursor.execute)
                             │
┌────────────────────────────────────────────────────────────┐
│                  DATABASE (MySQL)                          │
│  Local DB: recruitment (default)                           │
│  Company DB: company_recruitment (switchable via .env)     │
└────────────────────────────────────────────────────────────┘
```

### Stack Summary

| Layer     | Technology |
|-----------|-----------|
| Frontend  | HTML5, Tailwind CSS (CDN), Vanilla JS, Anime.js |
| Backend   | Python 3.x, Django 5.2.3, Django REST Framework |
| Database  | MySQL (via `django.db.backends.mysql`) |
| Auth      | Django session-based authentication |
| File Storage | Local filesystem (`/media/resumes/`) |
| CORS      | `django-cors-headers` |
| AI Eval   | Currently: `random.uniform(40, 100)` (placeholder) |

---

## 3. Frontend Flow

```
index.html (Login Page)
    │── POST /login/
    │       ├── roleid=1 → (Admin) → pages/allusers.html, pages/addinfo.html
    │       ├── roleid=2 → (Manager) → pages/manager_dashboard.html
    │       ├── roleid=3 → (HR) → pages/dashboard.html (HR)
    │       └── roleid=4 → (Candidate) → pages/candidate_dashboard.html
```

### Frontend Page Flow by Role

#### Admin (roleid=1)
```
addinfo.html (Register User)
allusers.html (Manage All Users)
usergroup.html (User Groups)
```

#### Manager (roleid=2)
```
manager_dashboard.html
    ├── manager_job_creation.html  (Create job requirements)
    ├── manager_shortlist.html     (Review/approve shortlisted candidates)
    └── manager_candidate_performance.html (View exam scores & performance)
```

#### HR (roleid=3)
```
dashboard.html (HR Dashboard)
    ├── hr_resumeupload.html          (Upload candidate resumes)
    ├── hr_filterresume.html          (Run AI evaluation + shortlist)
    ├── hr_interview_scheduling.html  (Schedule interviews)
    ├── hr_finalised_candidate.html   (Manage final outcomes)
    └── generate.html                 (Generate interview questions - UI only)
```

#### Candidate (roleid=4)
```
candidate_dashboard.html   (View exam status)
    └── Exam portal         (Start exam, submit answers)
```

---

## 4. Backend Flow

All backend code is in `recruitment/views.py`. Routes are defined in `recruitment/urls.py`.

Key flow:

1. **Auth** → `login_api` creates a server-side session (`request.session['userid']`, `request.session['roleid']`).
2. **All protected endpoints** check `request.session.get('userid')` and `request.session.get('roleid')`.
3. **All DB access** is via raw SQL (`connection.cursor()`) — no Django ORM models are used for business data.
4. **File uploads** use Django's `FileSystemStorage` to save to `/media/resumes/`.

---

## 5. Database Flow

The system uses **raw SQL** queries exclusively. Tables are pre-created in MySQL (DDL in `Tables for job_creation.txt`).

Key data flow:
```
users (authentication base)
    ├── rolemaster (role_id lookup)
    ├── job_requirement (manager creates)
    │       ├── job_skill → skill_master
    │       ├── job_education → education_master
    │       └── job_softskill → soft_skill_master
    ├── resume (HR uploads)
    │       └── resume_job_map (AI evaluation result + candidate lifecycle)
    │               ├── interview_schedule
    │               └── exam_session → exam_answer, exam_question
    └── position_master (position/job category reference)
```

---

## 6. AI Evaluation Workflow

> **Current state**: The AI evaluation is a **placeholder** — it generates a `random.uniform(40, 100)` score. No real resume parsing, skill extraction, or matching has been implemented yet.

**Intended workflow** (partially scaffolded):

```
Resume Upload (HR)
    → resume table (file_location, name, email, phone)
    
AI Evaluation (POST /api/evaluate/)
    → Fetches unprocessed resumes (is_active=TRUE, not in resume_job_map for this requirement)
    → Generates score (currently random)
    → Inserts into resume_job_map with status='evaluated'
    → Sets resume.is_active = FALSE

HR Reviews Scores (GET /api/hr/resumes/<requirement_id>/)
    → Shows ranked list by score

HR Shortlists (POST /api/hr/shortlist/)
    → Updates selected: status='shortlisted'
    → Rejects others: status='rejected'

Manager Reviews Shortlist (GET /api/manager/shortlist-details/<requirement_id>/)
    → Approves selected: status='approved'
    → Rejects others: status='rejected'

HR Schedules Interview (POST /api/hr/schedule-interview/)
    → Creates interview_schedule record
    → Updates resume_job_map status='interview_scheduled'

Candidate Takes Exam
    → POST /api/candidate/start-exam/ → creates exam_session
    → POST /api/candidate/submit-answers/ → creates exam_answer records
    → PUT exam_session.status='submitted'

Manager Scores Exam (POST /api/manager/update-exam-scores/)
    → Updates exam_answer records
    → Aggregates total_score → resume_job_map.exam_score
    → Updates resume_job_map.status='exam_scored'

HR Finalises Candidates
    → Status transitions: 'finalised' → 'joined' / 'rejected'
```

---

## 7. Key Modules and Connections

| Module | Files | DB Tables | Role |
|--------|-------|-----------|------|
| Auth | views.py: login_api, register_api, logout_api | users, rolemaster | All |
| User Mgmt | views.py: get_all_users, get_user_by_id, update_user_by_username, delete_user | users, rolemaster | Admin |
| Job Creation | views.py: submit_job, get_positions, get_recommendations_for_position | job_requirement, position_master, job_skill, job_education, job_softskill | Manager |
| Resume Upload | views.py: upload_candidate_resume | resume | HR |
| AI Evaluation | views.py: evaluate_with_ai, get_resumes_with_scores | resume, resume_job_map | HR |
| Shortlisting | views.py: shortlist_resumes | resume_job_map | HR |
| Manager Approval | views.py: positions_with_shortlisted, get_shortlisted_candidates, approve_shortlisted_candidates | resume_job_map, job_requirement | Manager |
| Interview | views.py: hr_schedule_interview, hr_list_candidates_for_interview, hr_list_scheduled_interviews | interview_schedule, resume_job_map | HR |
| Exam | views.py: candidate_start_exam_session, candidate_submit_exam_answers, candidate_exam_status | exam_session, exam_answer, exam_question | Candidate |
| Scoring | views.py: manager_get_exam_answers, manager_update_exam_scores, manager_list_candidates_performance | exam_session, exam_answer, resume_job_map | Manager |
| Finalisation | views.py: hr_list_finalised_candidates, hr_update_finalised_status | resume_job_map | HR |
| Question Gen | frontend: generate.html | None (UI prototype only — no backend API) | HR |
