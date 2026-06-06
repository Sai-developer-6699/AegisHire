# FRONTEND MAP — SafeNet AI Recruitment Tool

**Framework:** Vanilla HTML + Tailwind CSS (CDN) + Vanilla JavaScript  
**Location:** `frontend/`  
**Entry Point:** `frontend/index.html`

---

## Shared Infrastructure

### Config
| File | Purpose |
|------|---------|
| `frontend/config/config.js` | API base URL config. Auto-detects dev (`http://127.0.0.1:8000/api`) vs prod (`/api`). Exposes `window.apiConfig` globally. |

### Shared JS Libraries
| File | Purpose |
|------|---------|
| `frontend/assets/js/login.js` | Login form submission, error display, role-based redirect after login |
| `frontend/assets/js/simple-api.js` | Helper functions `simpleGet()`, `simplePost()` for API calls |
| `frontend/assets/js/script.js` | Animated background particles, mobile menu toggle |

### CSS
| File | Purpose |
|------|---------|
| `frontend/assets/css/styles.css` | Global base styles (login page, animations) |
| `frontend/assets/css/dashboard.css` | Dashboard-specific styles |

### Inline Tailwind Config
Most HTML pages configure Tailwind inline with a custom dark color palette:
- `darkblue`: `#0a1727` (bg), `#0d1b2a`, `#112240`
- `accent.green`: `#2ed573`
- Font: `Poppins` (Manager/HR pages), `Inter` (generate.html)

---

## Page Directory

### `frontend/index.html` — Login Page
**Purpose:** Entry point for all users. Authenticates and redirects based on role.

| Element | ID | Action |
|---------|----|----|
| Login Form | `login-form` | Submits to POST `/login/` |
| Username Input | `username` | — |
| Password Input | `password` | — |
| Error Message | `login-status` | Shown on invalid credentials |
| Loading Overlay | `loading-overlay` | Displayed during login |
| Response Message | `response-message` | Shows success messages |

**API Calls:**
- `POST /login/` — authenticates user

**Navigation After Login:**
- `roleid=1` → Admin pages (not explicitly redirected in code — see `login.js`)
- `roleid=2` → `pages/manager_dashboard.html`
- `roleid=3` → `pages/dashboard.html`
- `roleid=4` → `pages/candidate_dashboard.html`

**Scripts Loaded:**
- `config/config.js`
- `assets/js/simple-api.js`
- `assets/js/login.js`
- `assets/js/script.js`

---

### `frontend/pages/dashboard.html` — HR Dashboard
**Purpose:** Main dashboard for HR personnel with stats and quick navigation.

**Sidebar Navigation:**
- Upload Resume → `hr_resumeupload.html`
- Filter Resume → `hr_filterresume.html`
- Finalised Candidate → `hr_finalised_candidate.html`
- Interview Scheduling → `hr_interview_scheduling.html`

**API Calls:**
- `GET /api/hr/recent-resumes/` — recent resume upload widget
- `GET /api/user-profile/` — display logged-in user info

**Forms:** None (display only)

---

### `frontend/pages/hr_resumeupload.html` — HR Resume Upload
**Purpose:** HR uploads candidate resumes (PDF, DOC, DOCX) with basic candidate info.

**Form:**
- Candidate Name
- Email
- Phone
- Resume File (drag-and-drop + file picker)

**API Calls:**
- `POST /api/hr/upload/` — multipart form upload
- `GET /api/hr/recent-resumes/?limit=6` — display recently uploaded resumes

**Validation:** Email format, phone (10 digits), file type check (frontend)

**Sidebar:** Same as HR Dashboard

---

### `frontend/pages/hr_filterresume.html` — HR Filter/Evaluate Resume
**Purpose:** HR selects a job requirement, runs AI evaluation, views ranked resumes, selects and shortlists candidates.

**Key UI Elements:**
| Element | ID | Purpose |
|---------|----|---------|
| Requirement Dropdown | `requirementSelector` | Select job requirement |
| Requirements Title | `requirementTitle` | Shows selected requirement |
| Skills Display | `skillsContainer` | Shows required skills |
| Soft Skills | `SoftskillsContainer` | Shows required soft skills |
| Education | `educationContainer` | Shows required education |
| Experience | `experienceContainer` | Shows experience range |
| Evaluate Button | `evaluateBtn` | Triggers AI evaluation |
| Results Section | `resultsSection` | Shows ranked resume cards (hidden initially) |
| Resume Cards Container | `resumeCardsContainer` | Dynamic cards with checkboxes |
| Send to Manager Button | `sendToManagerBtn` | Shortlists selected, sends to manager |

**API Calls:**
1. `GET /api/list_job_requirements/` — populate requirement dropdown
2. `GET /api/get_job_requirement_detail/<req_id>/` — show selected requirement's details
3. `POST /api/evaluate/` — run AI evaluation
4. `GET /api/hr/resumes/<req_id>/` — load evaluated/ranked resumes
5. `POST /api/hr/shortlist/` — shortlist selected candidates

**Flow:**
```
Select Requirement → View Details → Click Evaluate → AI Evaluation → View Ranked Resumes → Select → Send to Manager
```

**Scripts:** Inline `<script>` block + `config/config.js`, `simple-api.js`

---

### `frontend/pages/hr_interview_scheduling.html` — HR Interview Scheduling
**Purpose:** HR schedules interviews for approved candidates.

**Sidebar:** Same as HR Dashboard

**API Calls:**
- `GET /api/hr/interview-candidates/` — list approved candidates
- `POST /api/hr/schedule-interview/` — schedule interview
- `GET /api/hr/scheduled-interviews/` — view scheduled interviews

**Form Fields:**
- `map_id` (from candidate selection)
- `interview_datetime`
- `interviewer` name

---

### `frontend/pages/hr_finalised_candidate.html` — HR Finalised Candidates
**Purpose:** HR views and manages candidates at the final stage (joined/rejected).

**Sidebar:** Same as HR Dashboard

**API Calls:**
- `GET /api/hr/finalised-candidates/` — list finalised candidates
- `POST /api/hr/update-finalised-status/` — update to 'joined' or 'rejected'

---

### `frontend/pages/manager_dashboard.html` — Manager Dashboard
**Purpose:** Main dashboard for managers. Shows stats, recent jobs, quick links.

**Sidebar Navigation:**
- Dashboard (active)
- Job Creation → `manager_job_creation.html`
- Shortlist Candidate → `manager_shortlist.html`
- Candidate Performance → `manager_candidate_performance.html`

**API Calls:**
- `GET /api/get-recent-jobs/?user_id=<uid>&limit=5` — recent jobs by this manager
- `GET /api/user-profile/` — show user info

---

### `frontend/pages/manager_job_creation.html` — Manager Job Creation
**Purpose:** Manager creates job requirements by selecting position, experience, skills, education.

**Form Fields:**
| Field | ID | Type |
|-------|----|------|
| Job Category | `jobCategory` | `<select>` — populated dynamically |
| Experience | `experience` | `<select>` — static options |
| Education | `education` | `<select>` — populated dynamically |
| Technical Skills | `technicalSkills` | Clickable skill pills (multi-select) |
| Soft Skills | `softSkills` | Clickable skill pills (multi-select) |

**API Calls:**
1. `GET /api/get_positions/` — populate job category dropdown
2. `POST /api/get_recommendations_for_position/` — auto-fill skills on category change
3. `POST /api/submit_job/` — submit the form
4. `GET /api/get-recent-jobs/?limit=5` — (My Jobs tab)
5. `GET /api/get-recent-jobs/` — (All Jobs tab)
6. `POST /api/logout/` — logout button

**Tabs:** "My Jobs" / "All Jobs" with search and sort controls

---

### `frontend/pages/manager_shortlist.html` — Manager Shortlist
**Purpose:** Manager views shortlisted candidates per job requirement, approves or rejects them.

**API Calls:**
- `GET /api/manager/positions-in-shortlisted/` — list positions with shortlisted count
- `GET /api/manager/shortlist-details/<req_id>/` — get candidates for a position
- `POST /api/manager/approve-shortlist/` — approve selected, reject others

**Sidebar:** Same as Manager Dashboard

---

### `frontend/pages/manager_candidate_performance.html` — Manager Candidate Performance
**Purpose:** Manager views exam scores and performance details for candidates per requirement.

**API Calls:**
- `GET /api/manager/performance/<requirement_id>/` — list candidates with scores
- `GET /api/manager/exam-answers/<map_id>/` — view detailed answers
- `POST /api/manager/update-exam-scores/` — score answers

**Sidebar:** Same as Manager Dashboard

---

### `frontend/pages/addinfo.html` — Add/Register User (Admin)
**Purpose:** Admin creates new user accounts.

**Form Fields:** first_name, last_name, username, password, role, email, phone_number, department, status

**API Calls:**
- `POST /api/register/` — create user

---

### `frontend/pages/allusers.html` — All Users (Admin)
**Purpose:** Admin views, edits, and deletes all system users.

**API Calls:**
- `GET /api/get-users/?role=&status=` — list users with filters
- `GET /api/get-user-by-id/<userid>/` — view user details
- `PUT /api/update-user-by-username/<username>/` — edit user
- `DELETE /api/delete-user/<userid>/` — delete user

---

### `frontend/pages/usergroup.html` — User Groups (Admin)
**Purpose:** Admin manages user role groups (currently UI only, backend unclear).

---

### `frontend/pages/candidate_dashboard.html` — Candidate Dashboard
**Purpose:** Candidate views their exam status and takes assessments.

**API Calls:**
- `POST /api/candidate/start-exam/` — start an exam session
- `POST /api/candidate/submit-answers/` — submit answers
- `GET /api/candidate/exam-status/<session_id>/` — view exam status

---

### `frontend/pages/generate.html` — Generate Interview Questions
**Purpose:** UI prototype for interview question generation based on candidate and position.

> ⚠️ **STATIC / PROTOTYPE ONLY** — All candidate and question data shown is **hardcoded HTML**. No API calls are made. No backend endpoint exists for question generation.

**UI Elements:**
- Candidate search + list (hardcoded: John Doe, Anna Smith, etc.)
- Position selector (hardcoded: Senior Frontend Developer, etc.)
- Experience level selector
- Required skills tags
- Difficulty slider
- Generated question cards (Technical, Behavioral, Problem Solving, Culture Fit tabs)

**Scripts:** Loads `config/config.js` but makes no actual API calls

---

### `frontend/pages/create_form.html`
**Purpose:** Empty placeholder file (45 bytes).

---

## Navigation Flow Diagram

```
index.html (Login)
├── roleid=3 (HR) ──────────────────────────────────┐
│                                                    ▼
│                                          pages/dashboard.html
│                                               ├── hr_resumeupload.html
│                                               ├── hr_filterresume.html
│                                               ├── hr_interview_scheduling.html
│                                               └── hr_finalised_candidate.html
│
├── roleid=2 (Manager) ─────────────────────────────┐
│                                                    ▼
│                                     pages/manager_dashboard.html
│                                          ├── manager_job_creation.html
│                                          ├── manager_shortlist.html
│                                          └── manager_candidate_performance.html
│
├── roleid=1 (Admin) ───────────────────────────────┐
│                                                    ▼
│                                         pages/addinfo.html
│                                         pages/allusers.html
│                                         pages/usergroup.html
│
└── roleid=4 (Candidate) ───────────────────────────┐
                                                     ▼
                                         pages/candidate_dashboard.html
```

---

## Broken / Incomplete Frontend Links

| Page | Broken Link | Notes |
|------|------------|-------|
| `hr_filterresume.html` | Interview Scheduling sidebar link = `#` | Should link to `hr_interview_scheduling.html` |
| `generate.html` | All sidebar links = `#` | No routing wired |
| `dashboard.html` | Exact API calls unclear without full read | Needs verification |
| `manager_shortlist.html` | Resume URL constructed as relative path | May break if media URL changes |

---

## Shared Component: Logout Button
Every page has a logout button that:
1. Calls `POST /api/logout/` with `credentials: 'include'`
2. On success → redirects to `../index.html` (or `../../index.html` depending on depth)
