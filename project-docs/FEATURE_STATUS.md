# FEATURE STATUS — SafeNet AI Recruitment Tool

Inferred from direct codebase inspection of `recruitment/views.py`, `recruitment/urls.py`, and all frontend HTML pages.

---

## ✅ Completed Features

### Authentication System
- [x] Login API with session creation (`POST /login/`)
- [x] Logout API with session flush (`POST /api/logout/`)
- [x] Session-based role checking on all protected endpoints
- [x] Password hashing with Django's `make_password` / `check_password`
- [x] Role-based redirect on login (Manager/HR/Candidate)
- [x] Login UI with animated background (`index.html`)

### User Management (Admin)
- [x] Create new user (`POST /api/register/`)
- [x] List all users with filter by role/status (`GET /api/get-users/`)
- [x] View user by ID (`GET /api/get-user-by-id/<userid>/`)
- [x] View user by username (`GET /api/get-user-by-username/<username>/`)
- [x] Update user profile (`PUT /api/update-user-by-username/<username>/`)
- [x] Delete user (`DELETE /api/delete-user/<userid>/`)
- [x] All Users page UI (`pages/allusers.html`)
- [x] Add User page UI (`pages/addinfo.html`)

### Job Requirement System (Manager)
- [x] Fetch available positions (`GET /api/get_positions/`)
- [x] Auto-recommend skills/education per position (`POST /api/get_recommendations_for_position/`)
- [x] Create job requirement with skills, education, soft skills (`POST /api/submit_job/`)
- [x] List all recent job requirements (`GET /api/get-recent-jobs/`)
- [x] List all job requirements for HR dropdown (`GET /api/list_job_requirements/`)
- [x] Get detailed view of a job requirement (`GET /api/get_job_requirement_detail/<id>/`)
- [x] Manager Job Creation UI with skill pills, dynamic form (`pages/manager_job_creation.html`)
- [x] Manager Dashboard UI (`pages/manager_dashboard.html`)

### Resume Management (HR)
- [x] Resume file upload (PDF, DOC) with validation (`POST /api/hr/upload/`)
- [x] File storage in `/media/resumes/`
- [x] View recently uploaded resumes (`GET /api/hr/recent-resumes/`)
- [x] HR Resume Upload UI (`pages/hr_resumeupload.html`)

### AI Evaluation Flow (HR)
- [x] Trigger AI evaluation for a batch of resumes (`POST /api/evaluate/`)
- [x] Fetch ranked evaluated resumes (`GET /api/hr/resumes/<requirement_id>/`)
- [x] Shortlist selected resumes / reject others (`POST /api/hr/shortlist/`)
- [x] HR Filter Resume UI with animated evaluate button (`pages/hr_filterresume.html`)
- [x] Resume score display cards with checkboxes
- [x] "Send Selected to Manager" button

### Manager Shortlist & Approval
- [x] View positions with shortlisted candidates (`GET /api/manager/positions-in-shortlisted/`)
- [x] View shortlisted candidates for a requirement (`GET /api/manager/shortlist-details/<id>/`)
- [x] Approve/reject shortlisted candidates (`POST /api/manager/approve-shortlist/`)
- [x] Manager Shortlist UI (`pages/manager_shortlist.html`)

### Interview Scheduling (HR)
- [x] List candidates ready for interview (`GET /api/hr/interview-candidates/`)
- [x] Schedule interview for a candidate (`POST /api/hr/schedule-interview/`)
- [x] List all scheduled interviews (`GET /api/hr/scheduled-interviews/`)
- [x] Interview Scheduling UI (`pages/hr_interview_scheduling.html`)

### Candidate Performance (Manager)
- [x] List candidates with exam scores per requirement (`GET /api/manager/performance/<id>/`)
- [x] View detailed exam answers for a candidate (`GET /api/manager/exam-answers/<map_id>/`)
- [x] Update/score exam answers (`POST /api/manager/update-exam-scores/`)
- [x] Manager Candidate Performance UI (`pages/manager_candidate_performance.html`)

### HR Finalised Candidates
- [x] List candidates with 'finalised' status (`GET /api/hr/finalised-candidates/`)
- [x] Update finalised candidates to 'joined' or 'rejected' (`POST /api/hr/update-finalised-status/`)
- [x] Finalised Candidate UI (`pages/hr_finalised_candidate.html`)

### Candidate Exam Portal
- [x] Start exam session (`POST /api/candidate/start-exam/`)
- [x] Submit answers (`POST /api/candidate/submit-answers/`)
- [x] View exam status (`GET /api/candidate/exam-status/<session_id>/`)
- [x] Candidate Dashboard UI (`pages/candidate_dashboard.html`)

### Infrastructure
- [x] Django CORS configuration (`django-cors-headers`)
- [x] Session authentication
- [x] Multi-database support (local / company via `.env`)
- [x] Media file serving (`/media/`)
- [x] API config with environment detection (`config/config.js`)
- [x] `requirements.txt` with core packages

---

## ⚠️ In Progress / Partially Implemented

### AI Score Generation
- [x] Framework and DB insertion logic exists
- [x] `resume_job_map` table structure correct
- ❌ Actual AI logic missing — currently `random.uniform(40, 100)` placeholder
- ❌ No resume text parsing
- ❌ No skill extraction from resume content
- ❌ No actual comparison against job requirements

### Exam / Assessment System
- [x] `exam_session`, `exam_answer`, `exam_question` DB tables scaffolded
- [x] APIs to start exam, submit answers, view status
- [x] Manager scoring APIs
- ❌ No API to create/manage `exam_question` records (must be pre-seeded in DB)
- ❌ Candidate exam UI is minimal — no actual question rendering flow
- ❌ Questions are not linked to specific job requirements automatically

### Update Job Endpoint
- [x] `update_job` view exists in `views.py`
- ❌ Uses inconsistent table names (`job_skills`, `job_softskills` vs `job_skill`, `job_softskill`)
- ❌ Route exists in imports but URL pattern is ambiguous
- ❌ No dedicated "Edit Job" UI

### User Profile
- [x] `GET /api/user-profile/` endpoint works
- ❌ No profile editing endpoint
- ❌ Dynamic profile display not fully wired in all sidebar components (some show hardcoded "Mark Green" / "HR Manager")

---

## ❌ Missing / Not Yet Built

### Resume Parsing
- No PDF/DOCX text extraction library integrated
- No `parsed_text` column in `resume` table
- No parsing step in upload or evaluation flow

### Skill Extraction
- No NLP-based entity recognition
- No matching of resume text against `skill_master`

### Interview Question Generation
- `pages/generate.html` is a **completely static prototype** — all data is hardcoded
- No backend API: `POST /api/hr/generate-interview-questions/`
- No integration with any AI (Gemini, GPT, etc.)
- No connection to `exam_question` table

### Email Notification System
- Email settings in `settings.py` are **commented out**
- No email sending views or endpoints
- No selection email template
- No rejection email template
- No batch email API: `POST /api/hr/send-batch-emails/`

### Admin Dashboard
- No analytics/statistics endpoints
- No aggregate data views (total resumes processed, total hires, etc.)

### Candidate Ranking Dashboard
- HR sees a raw list; no visual ranking dashboard with filters
- No "top 10 candidates" summary view

### Notifications / Alerts System
- No real-time notifications
- No in-app notification history

### Password Reset
- "Forgot password?" link exists on login page but points to `#` — not implemented

### Audit / Activity Log
- No log table or logging of actions
- `interview_questions.log` file at root is essentially empty (152 bytes)

### Role-Based Access Control (Backend Enforcement)
- Some endpoints like `/api/register/` and `/api/get-users/` have **no role check**
- Admin role (roleid=1) has no enforced restrictions on what it can access

---

## Summary Table

| Feature Area | Status |
|-------------|--------|
| Authentication | ✅ Complete |
| User Management (CRUD) | ✅ Complete |
| Job Creation | ✅ Complete |
| Resume Upload | ✅ Complete |
| AI Evaluation (scaffold) | ⚠️ Placeholder AI |
| Resume Ranking | ✅ Complete |
| HR Shortlisting | ✅ Complete |
| Manager Approval | ✅ Complete |
| Interview Scheduling | ✅ Complete |
| Candidate Exam APIs | ✅ Complete (backend) |
| Exam Question Management | ❌ Missing |
| Manager Scoring | ✅ Complete |
| HR Finalisation | ✅ Complete |
| Resume Parsing | ❌ Missing |
| Skill Extraction | ❌ Missing |
| Actual AI Matching | ❌ Missing |
| Interview Question Generation | ❌ Missing (UI prototype only) |
| Email Notification | ❌ Missing |
| Admin Dashboard/Analytics | ❌ Missing |
| Candidate Exam UI (full) | ⚠️ Minimal |
| Password Reset | ❌ Missing |
| Audit Logging | ❌ Missing |
