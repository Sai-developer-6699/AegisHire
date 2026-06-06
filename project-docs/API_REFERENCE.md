# API REFERENCE — SafeNet AI Recruitment Tool

**Base URL (Development):** `http://127.0.0.1:8000`  
**Base URL (Production):** `/api` (relative)  
**Auth:** Session-based (Django sessions, cookie `sessionid`)  
**All endpoints prefix:** Defined in `backend/urls.py` → includes `recruitment/urls.py`

---

## Authentication & Session

### POST `/login/`
Login a user and create a session.

- **Auth Required:** No
- **Request:**
  ```json
  { "username": "string", "password": "string" }
  ```
- **Response (200):**
  ```json
  { "message": "Login successful!", "roleid": 2, "userid": 5 }
  ```
- **Response (401):**
  ```json
  { "message": "Invalid username or password" }
  ```
- **DB Table:** `users`, `rolemaster`
- **Frontend:** `frontend/index.html` → `assets/js/login.js`

---

### POST `/api/logout/`
Logs out the current user by flushing the session.

- **Auth Required:** Yes (session)
- **Response (200):**
  ```json
  { "message": "Logged out successfully", "redirect": "../index.html" }
  ```
- **DB Table:** None (session flush)
- **Frontend:** All pages → logout button

---

### GET `/api/check_session/`
Returns current session user and role info.

- **Auth Required:** No (returns null if not logged in)
- **Response:**
  ```json
  { "userid": 5, "roleid": 3 }
  ```
- **DB Table:** None
- **Frontend:** Debugging / session validation

---

### GET `/api/user-profile/`
Fetches the logged-in user's name, email, and role.

- **Auth Required:** Yes (session)
- **Response:**
  ```json
  { "username": "John Doe", "email": "john@example.com", "role": "HR" }
  ```
- **DB Tables:** `users`, `rolemaster`
- **Frontend:** All dashboards (sidebar profile display)

---

## User Management (Admin)

### POST `/api/register/`
Create a new user account.

- **Auth Required:** No (or Admin — currently no role check)
- **Request:**
  ```json
  {
    "first_name": "Jane", "last_name": "Smith",
    "username": "jsmith", "password": "secret123",
    "role": "HR", "email": "jane@example.com",
    "phone_number": "9876543210",
    "department": "Recruitment", "status": "active"
  }
  ```
- **Response:** `{ "message": "User created successfully" }`
- **DB Tables:** `users`, `rolemaster` (role name → ID lookup)
- **Frontend:** `pages/addinfo.html`

---

### GET `/api/get-users/?role=HR&status=active`
Fetch all users with optional role/status filter.

- **Auth Required:** No (no role check currently)
- **Query Params:** `role` (optional), `status` (optional)
- **Response:**
  ```json
  [
    { "id": 1, "name": "John Doe", "email": "...", "role": "HR", "status": "active", "initials": "JD", "color": "text-green-400" }
  ]
  ```
- **DB Table:** Calls stored proc `get_users(role, status)`
- **Frontend:** `pages/allusers.html`

---

### GET `/api/get-user-by-username/<username>/`
Fetch a user's ID by username.

- **Response:** `{ "userid": 5 }`
- **DB Table:** `users`
- **Frontend:** `pages/allusers.html` (check if user exists)

---

### PUT `/api/update-user-by-username/<username>/`
Update user profile fields.

- **Request:**
  ```json
  {
    "first_name": "Jane", "last_name": "Smith",
    "email": "...", "phone_number": "...",
    "department": "...", "status": "active", "role": "HR"
  }
  ```
- **Response:** `{ "message": "User updated successfully" }`
- **DB Tables:** `users`, `rolemaster`
- **Frontend:** `pages/allusers.html` (edit user modal)

---

### DELETE `/api/delete-user/<userid>/`
Delete a user by ID.

- **Response:** `{ "message": "User deleted successfully" }`
- **DB Table:** `users`
- **Frontend:** `pages/allusers.html`

---

### GET `/api/get-user-by-id/<userid>/`
Fetch full user profile including role name.

- **Response:**
  ```json
  {
    "first_name": "Jane", "last_name": "Smith", "username": "jsmith",
    "email": "...", "phone_number": "...", "status": "active",
    "department": "HR", "role": "HR"
  }
  ```
- **DB Tables:** `users`, `rolemaster` (JOIN)
- **Frontend:** `pages/allusers.html` (view user details)

---

## Job Management (Manager)

### GET `/api/get_positions/`
Get all available job positions.

- **Response:** `["Software Engineer", "Data Analyst", ...]`
- **DB Table:** `position_master`
- **Frontend:** `pages/manager_job_creation.html` (populate dropdown)

---

### POST `/api/get_recommendations_for_position/`
Get auto-recommended skills, soft skills, education for a position.

- **Request:** `{ "position": "Software Engineer" }`
- **Response:**
  ```json
  {
    "technical_skills": ["Python", "Django"],
    "soft_skills": ["Communication"],
    "education": ["B.Tech"]
  }
  ```
- **DB Tables:** `position_master`, `job_requirement_skills`, `job_requirement_softskills`, `job_requirement_education`, `skill_master`, `soft_skill_master`, `education_master`
- **Frontend:** `pages/manager_job_creation.html` (auto-fill form when position selected)

---

### POST `/api/submit_job/`
Submit a new job requirement. **Manager only (roleid=2).**

- **Auth Required:** Yes (session, roleid=2)
- **Request:**
  ```json
  {
    "position": "Software Engineer",
    "experience": "1-3",
    "technical_skills": ["Python", "Django"],
    "education": ["B.Tech"],
    "soft_skills": ["Communication"]
  }
  ```
- **Response:** `{ "status": "Job created successfully", "requirement_id": 12 }`
- **DB Tables:** `position_master`, `job_requirement`, `job_skill`, `job_education`, `job_softskill`, `skill_master`, `education_master`, `soft_skill_master`
- **Frontend:** `pages/manager_job_creation.html`

---

### PUT `/api/submit_job/` → `update_job`
> ⚠️ This uses a separate view `update_job` but is mapped incorrectly — the route does not clearly expose this. May be dead code.

---

### GET `/api/get-recent-jobs/?user_id=5&limit=5`
Get recent job posts (optionally filtered by manager).

- **Query Params:** `user_id` (optional), `limit` (default 5)
- **Response:**
  ```json
  {
    "jobs": [
      { "requirement_id": 12, "position": "...", "experience": "1-3", "created_at": "...", "created_by": "admin" }
    ]
  }
  ```
- **DB Tables:** `job_requirement`, `position_master`, `users`
- **Frontend:** `pages/manager_job_creation.html` (Recent Jobs section)

---

### GET `/api/list_job_requirements/`
List all job requirements (for HR dropdown).

- **Response:**
  ```json
  [
    { "requirement_id": 1, "position": "...", "created_by": "manager1", "experience_range": "1-3", "created_at": "..." }
  ]
  ```
- **DB Tables:** `job_requirement`, `position_master`, `users`
- **Frontend:** `pages/hr_filterresume.html` (requirement selector dropdown)

---

### GET `/api/get_job_requirement_detail/<requirement_id>/`
Get full detail of a job requirement including skills, soft skills, and education.

- **Response:**
  ```json
  {
    "requirement": { "requirement_id": 1, "position": "...", "created_by": "...", "experience": "1-3", "created_at": "..." },
    "skills": ["Python", "Django"],
    "soft_skills": ["Communication"],
    "education": ["B.Tech"]
  }
  ```
- **DB Tables:** `job_requirement`, `position_master`, `users`, `job_skill`, `skill_master`, `job_softskill`, `soft_skill_master`, `job_education`, `education_master`
- **Frontend:** `pages/hr_filterresume.html` (display requirement details)

---

## Resume Management (HR)

### POST `/api/hr/upload/`
Upload a candidate resume file with metadata.

- **Auth Required:** Yes (session)
- **Content-Type:** `multipart/form-data`
- **Form Fields:** `name`, `email`, `phone`, `resume` (file)
- **Response:** `{ "message": "Resume uploaded successfully!" }`
- **DB Table:** `resume`
- **File Storage:** `/media/resumes/<filename>`
- **Frontend:** `pages/hr_resumeupload.html`

---

### GET `/api/hr/recent-resumes/?limit=6`
Get recently uploaded resumes with their current status.

- **Response:**
  ```json
  {
    "resumes": [
      { "id": 1, "name": "John", "email": "...", "uploaded_at": "...", "file_url": "http://...media/resumes/...", "status": "evaluated" }
    ]
  }
  ```
- **DB Tables:** `resume`, `resume_job_map` (LEFT JOIN)
- **Frontend:** `pages/hr_resumeupload.html`, `pages/dashboard.html`

---

## AI Evaluation (HR)

### POST `/api/evaluate/`
Run AI evaluation on unprocessed resumes for a given job requirement.

- **Auth Required:** Yes (session)
- **Request:** `{ "requirement_id": 5, "limit": 10 }`
- **Response:**
  ```json
  { "message": "Evaluated new resumes.", "evaluated_count": 8 }
  ```
- **DB Tables:** `resume` (read + update `is_active`), `resume_job_map` (INSERT)
- **Side Effect:** Inserts rows into `resume_job_map` with status='evaluated'; sets `resume.is_active=FALSE`
- **AI:** Currently `random.uniform(40, 100)` — placeholder
- **Frontend:** `pages/hr_filterresume.html` → "Evaluate with AI" button

---

### GET `/api/hr/resumes/<requirement_id>/`
Get evaluated resumes ranked by AI score for a requirement.

- **Response:**
  ```json
  {
    "resumes": [
      { "resume_id": 1, "name": "...", "email": "...", "file_location": "...", "uploaded_at": "...", "score": 87.5, "resume_url": "http://..." }
    ]
  }
  ```
- **DB Tables:** `resume_job_map`, `resume`
- **Filter:** `status='evaluated'`, ordered by `score DESC`
- **Frontend:** `pages/hr_filterresume.html` (resume cards)

---

### POST `/api/hr/shortlist/`
Shortlist selected resumes; reject others for the same requirement.

- **Auth Required:** Yes (session)
- **Request:**
  ```json
  [
    { "resume_id": 1, "requirement_id": 5 },
    { "resume_id": 3, "requirement_id": 5 }
  ]
  ```
- **Response:** `{ "message": "Shortlisted selected resumes and rejected others.", "shortlisted_count": 2 }`
- **DB Table:** `resume_job_map` (UPDATE status)
- **Frontend:** `pages/hr_filterresume.html` → "Send Selected to Manager" button

---

## Manager Shortlist & Approval

### GET `/api/manager/positions-in-shortlisted/`
Get all positions that have shortlisted candidates for the current manager.

- **Auth Required:** Yes (session, roleid=2)
- **Response:**
  ```json
  [
    { "requirement_id": 5, "position_name": "Software Engineer", "shortlisted_count": 4 }
  ]
  ```
- **DB Tables:** `job_requirement`, `position_master`, `resume_job_map`
- **Frontend:** `pages/manager_shortlist.html`

---

### GET `/api/manager/shortlist-details/<requirement_id>/`
Get shortlisted candidates for a specific job requirement.

- **Auth Required:** Yes (session, roleid=2)
- **Response:**
  ```json
  [
    { "resume_id": 1, "name": "...", "email": "...", "resume_url": "...", "ai_score": 87.5, "position_name": "..." }
  ]
  ```
- **DB Tables:** `resume_job_map`, `resume`, `job_requirement`, `position_master`
- **Frontend:** `pages/manager_shortlist.html`

---

### POST `/api/manager/approve-shortlist/`
Approve selected candidates; reject remaining shortlisted ones.

- **Auth Required:** Yes (session, roleid=2)
- **Request:**
  ```json
  { "candidate_ids": ["1", "3"], "requirement_id": "5" }
  ```
- **Response:** `{ "message": "Shortlisted candidates approved and others rejected.", "approved_count": 2 }`
- **DB Table:** `resume_job_map` (UPDATE status 'shortlisted' → 'approved'/'rejected')
- **Frontend:** `pages/manager_shortlist.html`

---

## HR Interview Scheduling

### GET `/api/hr/interview-candidates/`
List candidates with status `approved` or `exam_scored` ready for interview scheduling.

- **Auth Required:** Yes (session, roleid=3)
- **Response:**
  ```json
  {
    "candidates": [
      { "map_id": 10, "resume_id": 1, "name": "...", "email": "...", "phone": "...", "status": "approved", "exam_score": null }
    ]
  }
  ```
- **DB Tables:** `resume_job_map`, `resume`
- **Frontend:** `pages/hr_interview_scheduling.html`

---

### POST `/api/hr/schedule-interview/`
Schedule an interview for a candidate.

- **Auth Required:** Yes (session, roleid=3)
- **Request:**
  ```json
  { "map_id": 10, "interview_datetime": "2025-06-15T10:00:00", "interviewer": "Sarah Jones" }
  ```
- **Response:** `{ "message": "Interview scheduled successfully" }`
- **DB Tables:** `resume_job_map` (UPDATE status), `interview_schedule` (INSERT)
- **Frontend:** `pages/hr_interview_scheduling.html`

---

### GET `/api/hr/scheduled-interviews/`
List all scheduled interviews.

- **Auth Required:** Yes (session, roleid=3)
- **Response:**
  ```json
  {
    "interviews": [
      { "schedule_id": 1, "map_id": 10, "candidate_name": "...", "interview_datetime": "...", "interviewer": "...", "created_at": "..." }
    ]
  }
  ```
- **DB Tables:** `interview_schedule`, `resume_job_map`, `resume`
- **Frontend:** `pages/hr_interview_scheduling.html`

---

## Manager Candidate Performance

### GET `/api/manager/performance/<requirement_id>/`
List all candidates for a requirement with exam scores.

- **Auth Required:** Yes (session, roleid=2)
- **Response:**
  ```json
  {
    "candidates": [
      { "map_id": 10, "resume_id": 1, "name": "...", "email": "...", "status": "exam_scored", "exam_score": 85.0 }
    ]
  }
  ```
- **DB Tables:** `resume_job_map`, `resume`
- **Frontend:** `pages/manager_candidate_performance.html`

---

### GET `/api/manager/exam-answers/<map_id>/`
Get detailed exam answers for a candidate.

- **Auth Required:** Yes (session, roleid=2)
- **Response:**
  ```json
  {
    "session_id": 5,
    "answers": [
      { "answer_id": 1, "question_id": 3, "question_text": "...", "question_type": "mcq", "options": "...", "answer_text": "A", "score_awarded": 5.0, "is_correct": true }
    ]
  }
  ```
- **DB Tables:** `exam_session`, `resume_job_map`, `exam_answer`, `exam_question`
- **Frontend:** `pages/manager_candidate_performance.html`

---

### POST `/api/manager/update-exam-scores/`
Update exam answer scores; aggregate total to resume_job_map.

- **Auth Required:** Yes (session, roleid=2)
- **Request:**
  ```json
  {
    "session_id": 5,
    "answers": [
      { "answer_id": 1, "score_awarded": 5.0, "is_correct": true }
    ]
  }
  ```
- **Response:** `{ "message": "Scores updated", "total_score": 75.0 }`
- **DB Tables:** `exam_answer` (UPDATE), `exam_session` (UPDATE status), `resume_job_map` (UPDATE exam_score, status)
- **Frontend:** `pages/manager_candidate_performance.html`

---

## HR Finalised Candidates

### GET `/api/hr/finalised-candidates/`
List all candidates with status `finalised`.

- **Auth Required:** Yes (session, roleid=3)
- **Response:**
  ```json
  {
    "candidates": [
      { "map_id": 10, "resume_id": 1, "name": "...", "email": "...", "status": "finalised", "finalised_at": "..." }
    ]
  }
  ```
- **DB Tables:** `resume_job_map`, `resume`
- **Frontend:** `pages/hr_finalised_candidate.html`

---

### POST `/api/hr/update-finalised-status/`
Update finalised candidates to `joined` or `rejected`.

- **Auth Required:** Yes (session, roleid=3)
- **Request:**
  ```json
  { "updates": [{ "map_id": 10, "new_status": "joined" }] }
  ```
- **Response:** `{ "message": "Statuses updated" }`
- **DB Table:** `resume_job_map` (UPDATE status)
- **Frontend:** `pages/hr_finalised_candidate.html`

---

## Candidate Exam APIs

### POST `/api/candidate/start-exam/`
Candidate starts an exam session.

- **Auth Required:** Yes (session, roleid=4)
- **Request:** `{ "resume_id": 1, "requirement_id": 5 }`
- **Response:** `{ "session_id": 8, "status": "in_progress" }`
- **DB Table:** `exam_session`
- **Frontend:** `pages/candidate_dashboard.html`

---

### POST `/api/candidate/submit-answers/`
Candidate submits exam answers.

- **Auth Required:** Yes (session, roleid=4)
- **Request:**
  ```json
  {
    "session_id": 8,
    "answers": [{ "question_id": 3, "answer_text": "A" }]
  }
  ```
- **Response:** `{ "message": "Answers submitted" }`
- **DB Tables:** `exam_answer` (INSERT), `exam_session` (UPDATE status='submitted')
- **Frontend:** `pages/candidate_dashboard.html`

---

### GET `/api/candidate/exam-status/<session_id>/`
Candidate views their exam session status.

- **Auth Required:** Yes (session, roleid=4)
- **Response:** `{ "status": "submitted", "started_at": "...", "completed_at": "..." }`
- **DB Table:** `exam_session`
- **Frontend:** `pages/candidate_dashboard.html`

---

## Missing / Not Yet Implemented Endpoints

| Endpoint | Description | Status |
|----------|-------------|--------|
| `POST /api/hr/generate-interview-questions/` | Generate questions based on resume + job | ❌ Missing |
| `POST /api/hr/send-email/` | Send selection/rejection emails | ❌ Missing |
| `GET /api/admin/dashboard/` | Admin statistics dashboard | ❌ Missing |
| `POST /api/exam/questions/` | Create exam questions | ❌ Missing |
| `GET /api/exam/questions/<requirement_id>/` | List questions for a requirement | ❌ Missing |
| `PUT /api/update_job/` | Update existing job requirement | ⚠️ Exists in views but routing unclear |
