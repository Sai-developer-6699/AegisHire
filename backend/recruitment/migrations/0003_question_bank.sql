-- ============================================================
-- SafeNet AI Recruitment — Migration 0003
-- Question Bank + Weighting Support
-- ============================================================

-- 1. Create question_bank table
CREATE TABLE IF NOT EXISTS question_bank (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    requirement_id INT NULL,
    text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'open_ended',
    options JSON NULL,
    correct_answer TEXT NULL,
    skill VARCHAR(100) NULL,
    difficulty VARCHAR(50) NOT NULL DEFAULT 'medium',
    category VARCHAR(100) NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'AI',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_by INT NULL,
    approved_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requirement_id) REFERENCES job_requirement(requirement_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(userid) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(userid) ON DELETE SET NULL
);

-- 2. Modify exam_question to reference question_bank
ALTER TABLE exam_question ADD COLUMN bank_question_id INT NULL;
ALTER TABLE exam_question ADD FOREIGN KEY (bank_question_id) REFERENCES question_bank(question_id) ON DELETE SET NULL;

-- 3. Add weighting columns to job_requirement
ALTER TABLE job_requirement ADD COLUMN resume_weight INT NOT NULL DEFAULT 50;
ALTER TABLE job_requirement ADD COLUMN exam_weight INT NOT NULL DEFAULT 50;

SELECT 'Migration 0003 completed successfully' AS status;
