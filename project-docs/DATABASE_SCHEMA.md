# DATABASE SCHEMA — SafeNet AI Recruitment Tool

**Database Engine:** MySQL  
**Database Name:** `recruitment` (local) / `company_recruitment` (company env)  
**Access:** Raw SQL via `django.db.connection.cursor()`  
**No Django ORM models** are used for business data (`recruitment/models.py` is empty).

---

## Table Index

| # | Table Name | Purpose |
|---|-----------|---------|
| 1 | `users` | System users (all roles) |
| 2 | `rolemaster` | Role definitions |
| 3 | `position_master` | Job position reference data |
| 4 | `skill_master` | Technical skill reference |
| 5 | `soft_skill_master` | Soft skill reference |
| 6 | `education_master` | Education level reference |
| 7 | `job_requirement_skills` | Position-to-skill mapping (recommendations) |
| 8 | `job_requirement_softskills` | Position-to-soft-skill mapping (recommendations) |
| 9 | `job_requirement_education` | Position-to-education mapping (recommendations) |
| 10 | `job_requirement` | Job postings created by managers |
| 11 | `job_skill` | Skills required per job requirement |
| 12 | `job_education` | Education required per job requirement |
| 13 | `job_softskill` | Soft skills required per job requirement |
| 14 | `resume` | Candidate resume records |
| 15 | `resume_job_map` | AI score + candidate lifecycle state machine |
| 16 | `interview_schedule` | Scheduled interviews |
| 17 | `exam_session` | Candidate exam sessions |
| 18 | `exam_question` | Exam questions |
| 19 | `exam_answer` | Candidate answers to exam questions |

---

## Table Definitions

### 1. `users`
Stores all system users across all roles.

```sql
CREATE TABLE users (
    userid         INT AUTO_INCREMENT PRIMARY KEY,
    first_name     VARCHAR(100),
    last_name      VARCHAR(100),
    username       VARCHAR(150) UNIQUE NOT NULL,
    password       VARCHAR(255) NOT NULL,          -- Django hashed password
    roleid         INT NOT NULL,
    email          VARCHAR(255),
    phone_number   VARCHAR(20),
    department     VARCHAR(100),
    status         VARCHAR(50)                    -- e.g. 'active', 'inactive'
);
```

**FK:** `roleid` → `rolemaster(role_id)`  
**Used by:** login_api, register_api, get_all_users, get_user_by_id, update_user_by_username, delete_user, user_profile, all session-protected views

---

### 2. `rolemaster`
Defines system roles.

```sql
CREATE TABLE rolemaster (
    role_id   INT AUTO_INCREMENT PRIMARY KEY,
    role      VARCHAR(100) NOT NULL               -- e.g. 'admin', 'manager', 'hr', 'candidate'
);
```

**Known Role IDs (inferred from code):**
| role_id | Role |
|---------|------|
| 1 | Admin |
| 2 | Manager |
| 3 | HR |
| 4 | Candidate |

**Used by:** get_role_id(), get_user_by_id, user_profile, all role-based authorization checks

---

### 3. `position_master`
Reference table of job positions.

```sql
CREATE TABLE position_master (
    position_id    INT AUTO_INCREMENT PRIMARY KEY,
    position_name  VARCHAR(200) NOT NULL
);
```

**Used by:** get_positions, get_recommendations_for_position, submit_job, get_recent_jobs, list_job_requirements, get_job_requirement_detail, positions_with_shortlisted, get_shortlisted_candidates

---

### 4. `skill_master`
Reference table of technical skills.

```sql
CREATE TABLE skill_master (
    skill_id    INT AUTO_INCREMENT PRIMARY KEY,
    skill_name  VARCHAR(200) NOT NULL
);
```

**Used by:** submit_job (name→ID lookup), get_job_requirement_detail (skill list), job_requirement_skills (recommendations)

---

### 5. `soft_skill_master`
Reference table of soft skills.

```sql
CREATE TABLE soft_skill_master (
    soft_skill_id    INT AUTO_INCREMENT PRIMARY KEY,
    soft_skill_name  VARCHAR(200) NOT NULL
);
```

**Used by:** submit_job, get_job_requirement_detail, job_requirement_softskills

---

### 6. `education_master`
Reference table of education qualifications.

```sql
CREATE TABLE education_master (
    education_id    INT AUTO_INCREMENT PRIMARY KEY,
    education_name  VARCHAR(200) NOT NULL       -- e.g. 'B.Tech', 'M.Tech', 'MBA'
);
```

**Used by:** submit_job, get_job_requirement_detail, job_requirement_education

---

### 7. `job_requirement_skills`
Pre-defined skill recommendations per position (used for auto-populating form).

```sql
CREATE TABLE job_requirement_skills (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    position_id  INT NOT NULL,
    skill_id     INT NOT NULL,
    FOREIGN KEY (position_id) REFERENCES position_master(position_id),
    FOREIGN KEY (skill_id) REFERENCES skill_master(skill_id)
);
```

**Used by:** get_recommendations_for_position (to prefill manager job creation form)

---

### 8. `job_requirement_softskills`
Pre-defined soft skill recommendations per position.

```sql
CREATE TABLE job_requirement_softskills (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    position_id     INT NOT NULL,
    soft_skill_id   INT NOT NULL,
    FOREIGN KEY (position_id) REFERENCES position_master(position_id),
    FOREIGN KEY (soft_skill_id) REFERENCES soft_skill_master(soft_skill_id)
);
```

**Used by:** get_recommendations_for_position

---

### 9. `job_requirement_education`
Pre-defined education recommendations per position.

```sql
CREATE TABLE job_requirement_education (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    position_id   INT NOT NULL,
    education_id  INT NOT NULL,
    FOREIGN KEY (position_id) REFERENCES position_master(position_id),
    FOREIGN KEY (education_id) REFERENCES education_master(education_id)
);
```

**Used by:** get_recommendations_for_position

---

### 10. `job_requirement`
The core job posting created by a manager. This is the central entity for a recruitment cycle.

```sql
CREATE TABLE job_requirement (
    requirement_id   INT AUTO_INCREMENT PRIMARY KEY,
    position_id      INT NOT NULL,
    experience_range VARCHAR(50) NOT NULL,           -- e.g. 'fresher', '1-3', '3+'
    created_by       INT NOT NULL,                   -- userid of Manager
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES position_master(position_id),
    FOREIGN KEY (created_by) REFERENCES users(userid)
);
```

**Used by:** submit_job, update_job, get_recent_jobs, list_job_requirements, get_job_requirement_detail, evaluate_with_ai, get_resumes_with_scores, shortlist_resumes, positions_with_shortlisted, get_shortlisted_candidates, approve_shortlisted_candidates, manager_list_candidates_performance

---

### 11. `job_skill`
Specific skills required for a particular job requirement.

```sql
CREATE TABLE job_skill (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    requirement_id   INT NOT NULL,
    skill_id         INT NOT NULL,
    FOREIGN KEY (requirement_id) REFERENCES job_requirement(requirement_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skill_master(skill_id)
);
```

**Used by:** submit_job (INSERT), get_job_requirement_detail (SELECT)

---

### 12. `job_education`
Education levels required for a job requirement.

```sql
CREATE TABLE job_education (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    requirement_id   INT NOT NULL,
    education_id     INT NOT NULL,
    FOREIGN KEY (requirement_id) REFERENCES job_requirement(requirement_id) ON DELETE CASCADE,
    FOREIGN KEY (education_id) REFERENCES education_master(education_id)
);
```

**Used by:** submit_job (INSERT), get_job_requirement_detail (SELECT)

---

### 13. `job_softskill`
Soft skills required for a job requirement.

```sql
CREATE TABLE job_softskill (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    requirement_id   INT NOT NULL,
    soft_skill_id    INT NOT NULL,
    FOREIGN KEY (requirement_id) REFERENCES job_requirement(requirement_id) ON DELETE CASCADE,
    FOREIGN KEY (soft_skill_id) REFERENCES soft_skill_master(soft_skill_id)
);
```

> ⚠️ **Note:** `update_job` view uses table name `job_softskills` (plural) and `job_skills` (plural) which may be inconsistent with the DDL above. Verify actual table names in MySQL.

**Used by:** submit_job (INSERT), get_job_requirement_detail (SELECT)

---

### 14. `resume`
Candidate resume records uploaded by HR.

```sql
CREATE TABLE resume (
    resume_id      INT AUTO_INCREMENT PRIMARY KEY,
    resume_name    VARCHAR(200) NOT NULL,            -- candidate full name
    email          VARCHAR(255),
    phone_number   VARCHAR(20),
    file_location  VARCHAR(500),                     -- path like 'resumes/filename.pdf'
    created_by     INT,                              -- userid of HR who uploaded
    uploaded_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active      BOOLEAN DEFAULT TRUE              -- FALSE after evaluation
);
```

**Used by:** upload_candidate_resume, get_recent_resumes, evaluate_with_ai, get_resumes_with_scores, shortlist_resumes, get_shortlisted_candidates, hr_list_candidates_for_interview, manager_list_candidates_performance, hr_list_finalised_candidates

---

### 15. `resume_job_map`
The **central state machine** table. Maps a resume to a job requirement and tracks the entire candidate lifecycle.

```sql
CREATE TABLE resume_job_map (
    map_id          INT AUTO_INCREMENT PRIMARY KEY,
    resume_id       INT NOT NULL,
    requirement_id  INT NOT NULL,
    score           DECIMAL(5,2),                   -- AI score (0-100)
    exam_score      DECIMAL(7,2),                   -- Score from exam assessment
    status          VARCHAR(50),                    -- lifecycle status (see below)
    evaluated_by    INT,                            -- userid who evaluated/approved
    finalised_at    DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME,
    FOREIGN KEY (resume_id) REFERENCES resume(resume_id),
    FOREIGN KEY (requirement_id) REFERENCES job_requirement(requirement_id)
);
```

**Status Lifecycle:**
```
evaluated → shortlisted → approved → interview_scheduled → exam_scored → finalised → joined
                       ↘ rejected              ↘ rejected                          ↘ rejected
```

**Used by:** evaluate_with_ai, get_resumes_with_scores, get_recent_resumes, shortlist_resumes, positions_with_shortlisted, get_shortlisted_candidates, approve_shortlisted_candidates, hr_list_candidates_for_interview, hr_schedule_interview, manager_list_candidates_performance, manager_get_exam_answers, manager_update_exam_scores, hr_list_finalised_candidates, hr_update_finalised_status

---

### 16. `interview_schedule`
Records scheduled interviews for candidates.

```sql
CREATE TABLE interview_schedule (
    schedule_id          INT AUTO_INCREMENT PRIMARY KEY,
    map_id               INT NOT NULL,              -- FK to resume_job_map
    interview_datetime   DATETIME NOT NULL,
    interviewer          VARCHAR(200),
    created_by           INT,                       -- userid of HR
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (map_id) REFERENCES resume_job_map(map_id)
);
```

**Used by:** hr_schedule_interview (INSERT), hr_list_scheduled_interviews (SELECT JOIN)

---

### 17. `exam_session`
Tracks an active exam session for a candidate.

```sql
CREATE TABLE exam_session (
    session_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,                   -- Candidate's userid
    resume_id       INT NOT NULL,
    requirement_id  INT NOT NULL,
    started_at      DATETIME,
    completed_at    DATETIME,
    status          VARCHAR(50),                    -- 'in_progress', 'submitted', 'scored'
    updated_at      DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(userid),
    FOREIGN KEY (resume_id) REFERENCES resume(resume_id),
    FOREIGN KEY (requirement_id) REFERENCES job_requirement(requirement_id)
);
```

**Used by:** candidate_start_exam_session, candidate_submit_exam_answers, candidate_exam_status, manager_get_exam_answers, manager_update_exam_scores

---

### 18. `exam_question`
Questions used in assessments.

```sql
CREATE TABLE exam_question (
    question_id  INT AUTO_INCREMENT PRIMARY KEY,
    text         TEXT NOT NULL,
    type         VARCHAR(50),                       -- 'mcq', 'text', etc.
    options      TEXT,                              -- JSON string for MCQ options
    correct_ans  TEXT
);
```

**Used by:** manager_get_exam_answers (JOIN to get question details)  
> ⚠️ **Note:** No API exists to create/manage exam questions. This table must be pre-populated manually or via a missing admin API.

---

### 19. `exam_answer`
Candidate responses to exam questions within a session.

```sql
CREATE TABLE exam_answer (
    answer_id      INT AUTO_INCREMENT PRIMARY KEY,
    session_id     INT NOT NULL,
    question_id    INT NOT NULL,
    answer_text    TEXT,
    score_awarded  DECIMAL(5,2),
    is_correct     BOOLEAN,
    created_at     DATETIME,
    updated_at     DATETIME,
    FOREIGN KEY (session_id) REFERENCES exam_session(session_id),
    FOREIGN KEY (question_id) REFERENCES exam_question(question_id)
);
```

**Used by:** candidate_submit_exam_answers (INSERT), manager_get_exam_answers (SELECT), manager_update_exam_scores (UPDATE)

---

## Foreign Key Relationship Map

```
rolemaster (role_id)
    └── users.roleid

users (userid)
    ├── job_requirement.created_by
    ├── resume.created_by
    ├── resume_job_map.evaluated_by
    ├── interview_schedule.created_by
    └── exam_session.user_id

position_master (position_id)
    ├── job_requirement.position_id
    ├── job_requirement_skills.position_id
    ├── job_requirement_softskills.position_id
    └── job_requirement_education.position_id

job_requirement (requirement_id)
    ├── job_skill.requirement_id
    ├── job_education.requirement_id
    ├── job_softskill.requirement_id
    ├── resume_job_map.requirement_id
    └── exam_session.requirement_id

skill_master (skill_id)
    ├── job_skill.skill_id
    └── job_requirement_skills.skill_id

soft_skill_master (soft_skill_id)
    ├── job_softskill.soft_skill_id
    └── job_requirement_softskills.soft_skill_id

education_master (education_id)
    ├── job_education.education_id
    └── job_requirement_education.education_id

resume (resume_id)
    ├── resume_job_map.resume_id
    └── exam_session.resume_id

resume_job_map (map_id)
    └── interview_schedule.map_id

exam_session (session_id)
    └── exam_answer.session_id

exam_question (question_id)
    └── exam_answer.question_id
```

---

## Stored Procedures

### `get_users(role, status)`
Called by `get_all_users` view. Accepts optional `role` and `status` filter parameters.

```python
cursor.callproc('get_users', [role, status])
```

Returns columns: `userid, full_name, email, role, status`

> ⚠️ The procedure body is not visible in the codebase — it must exist in MySQL directly.

---

## Missing / Unconfirmed Columns

Some columns referenced in views but may not be explicitly in DDL files:

| Table | Column | Referenced In |
|-------|--------|--------------|
| `resume_job_map` | `finalised_at` | hr_list_finalised_candidates |
| `resume_job_map` | `exam_score` | manager_list_candidates_performance, manager_update_exam_scores |
| `resume_job_map` | `updated_at` | shortlist_resumes, approve_shortlisted_candidates |
| `resume` | `is_active` | evaluate_with_ai |
| `resume` | `phone_number` | upload_candidate_resume, hr_list_candidates_for_interview |
