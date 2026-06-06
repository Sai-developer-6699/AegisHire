-- ============================================================
-- SafeNet AI Recruitment — Migration 0004
-- Security Hardening & Performance Indexes
-- ============================================================

-- 1. Add exam expiration column
ALTER TABLE exam_session ADD COLUMN expires_at DATETIME NULL;

-- 2. Index for activity timeline audit lookups
CREATE INDEX idx_audit_log_target ON audit_log (target_type, target_id, created_at DESC);

-- 3. Index for candidate session queries
CREATE INDEX idx_exam_session_user_status ON exam_session (user_id, status);

-- 4. Index for candidate exam grading
CREATE INDEX idx_exam_answer_session ON exam_answer (session_id);

-- 5. Index for question bank statuses
CREATE INDEX idx_question_bank_req_status ON question_bank (requirement_id, status);

-- 6. Index for resume job map candidate associations
CREATE INDEX idx_resume_job_map_user ON resume_job_map (user_account_id);

SELECT 'Migration 0004 completed successfully' AS status;
