-- ============================================================
-- SafeNet AI Recruitment — Migration 0002
-- Resume Intelligence Store + Audit Log
--
-- Run this once against your MySQL database:
--   Get-Content recruitment/migrations/0002_resume_intelligence.sql | mysql -u root -p recruitment
--
-- Compatible with MySQL 5.7+ and MySQL 8.x
-- ============================================================

-- ─── Resume Intelligence Store ────────────────────────────────────────────
-- Parse once at upload time. Never re-parse on scoring/search.

ALTER TABLE resume
  ADD COLUMN parsed_text        LONGTEXT         NULL            COMMENT 'Full extracted text from PDF/DOCX',
  ADD COLUMN extracted_skills   JSON             NULL            COMMENT 'Skills matched against skill_master',
  ADD COLUMN education_detected VARCHAR(200)     NULL            COMMENT 'Highest detected education level',
  ADD COLUMN experience_years   DECIMAL(4,1)     NULL            COMMENT 'Estimated years of experience',
  ADD COLUMN certifications     JSON             NULL            COMMENT 'Detected certification keywords',
  ADD COLUMN projects           JSON             NULL            COMMENT 'Detected project section data',
  ADD COLUMN content_hash       VARCHAR(64)      NULL            COMMENT 'SHA-256 of file bytes for duplicate detection',
  ADD COLUMN parse_status       ENUM('pending','done','failed') NOT NULL DEFAULT 'pending' COMMENT 'Parsing pipeline status';

-- Index for fast duplicate detection and parse status filtering
ALTER TABLE resume
  ADD INDEX idx_content_hash (content_hash),
  ADD INDEX idx_parse_status (parse_status);

-- ─── AI Explanation Columns (on resume_job_map) ───────────────────────────
-- Populated by the async evaluation task.
-- The deterministic score column already exists.

ALTER TABLE resume_job_map
  ADD COLUMN ai_summary       TEXT             NULL            COMMENT 'Gemini 2-sentence candidate summary',
  ADD COLUMN matched_skills   JSON             NULL            COMMENT 'Skills matched during this evaluation',
  ADD COLUMN missing_skills   JSON             NULL            COMMENT 'Required skills not found in resume',
  ADD COLUMN skill_match_data JSON             NULL            COMMENT 'Full scoring breakdown from ScoringEngine';

-- ─── Audit Log Table ──────────────────────────────────────────────────────
-- Powers the activity timeline in the Candidate Intelligence Drawer.

CREATE TABLE IF NOT EXISTS audit_log (
  log_id       INT           NOT NULL AUTO_INCREMENT,
  action       VARCHAR(100)  NOT NULL                  COMMENT 'e.g. evaluate, shortlist, approve, reject',
  actor_id     INT           NOT NULL                  COMMENT 'userid of the person who performed the action',
  target_type  VARCHAR(50)   NULL                      COMMENT 'e.g. resume, job_requirement, interview',
  target_id    INT           NULL                      COMMENT 'PK of the target entity',
  details      JSON          NULL                      COMMENT 'Extra structured data',
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (log_id),
  INDEX idx_target (target_type, target_id),
  INDEX idx_actor  (actor_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Immutable audit trail for all significant actions';

-- ─── Verify ───────────────────────────────────────────────────────────────
SELECT 'Migration 0002 completed successfully' AS status;
