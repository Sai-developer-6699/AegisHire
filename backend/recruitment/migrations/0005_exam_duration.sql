-- ============================================================
-- SafeNet AI Recruitment — Migration 0005
-- Add exam duration to job requirement
-- ============================================================

ALTER TABLE job_requirement ADD COLUMN exam_duration_minutes INT NOT NULL DEFAULT 60;

SELECT 'Migration 0005 completed successfully' AS status;
