from django.test import TransactionTestCase
from django.db import connection
from django.urls import reverse
import json

class SecurityTestBase(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with connection.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `rolemaster` (
                  `role_id` int NOT NULL AUTO_INCREMENT,
                  `role` varchar(30) DEFAULT NULL,
                  PRIMARY KEY (`role_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `users` (
                  `userid` int NOT NULL AUTO_INCREMENT,
                  `first_name` varchar(50) NOT NULL,
                  `last_name` varchar(50) NOT NULL,
                  `username` varchar(50) NOT NULL,
                  `password` varchar(255) NOT NULL,
                  `roleid` int NOT NULL,
                  `email` varchar(100) NOT NULL,
                  `phone_number` varchar(15) DEFAULT NULL,
                  `department` varchar(50) DEFAULT NULL,
                  `status` varchar(20) DEFAULT 'active',
                  PRIMARY KEY (`userid`),
                  UNIQUE KEY `username` (`username`),
                  UNIQUE KEY `email` (`email`),
                  KEY `roleid` (`roleid`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `position_master` (
                  `position_id` int NOT NULL AUTO_INCREMENT,
                  `position_name` varchar(100) NOT NULL,
                  PRIMARY KEY (`position_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `job_requirement` (
                  `requirement_id` int NOT NULL AUTO_INCREMENT,
                  `position_id` int DEFAULT NULL,
                  `experience_range` varchar(50) DEFAULT NULL,
                  `created_by` int DEFAULT NULL,
                  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                  `assigned_to` int DEFAULT NULL,
                  `resume_weight` int NOT NULL DEFAULT 50,
                  `exam_weight` int NOT NULL DEFAULT 50,
                  `exam_duration_minutes` int NOT NULL DEFAULT 60,
                  `status` enum('ACTIVE', 'CLOSED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
                  `closed_at` datetime DEFAULT NULL,
                  `closed_by` int DEFAULT NULL,
                  `deleted_at` datetime DEFAULT NULL,
                  `deleted_by` int DEFAULT NULL,
                  PRIMARY KEY (`requirement_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `resume` (
                  `resume_id` int NOT NULL AUTO_INCREMENT,
                  `resume_name` varchar(255) NOT NULL,
                  `file_location` varchar(255) NOT NULL,
                  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  `email` varchar(255) NOT NULL,
                  `phone_number` varchar(20) DEFAULT NULL,
                  `created_by` int NOT NULL,
                  `is_active` tinyint(1) NOT NULL DEFAULT '1',
                  `parsed_text` longtext,
                  `extracted_skills` json DEFAULT NULL,
                  `education_detected` varchar(200) DEFAULT NULL,
                  `experience_years` decimal(4,1) DEFAULT NULL,
                  `certifications` json DEFAULT NULL,
                  `projects` json DEFAULT NULL,
                  `content_hash` varchar(64) DEFAULT NULL,
                  `parse_status` enum('pending','done','failed') NOT NULL DEFAULT 'pending',
                  PRIMARY KEY (`resume_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `resume_job_map` (
                  `map_id` int NOT NULL AUTO_INCREMENT,
                  `resume_id` int NOT NULL,
                  `requirement_id` int NOT NULL,
                  `status` enum('new','evaluated','shortlisted','approved','exam_pending','exam_started','exam_submitted','exam_scored','finalised','joined','rejected') NOT NULL DEFAULT 'new',
                  `user_account_id` int DEFAULT NULL,
                  `exam_score` decimal(5,2) DEFAULT NULL,
                  `finalised_at` datetime DEFAULT NULL,
                  `score` decimal(5,2) DEFAULT NULL,
                  `evaluated_by` int DEFAULT NULL,
                  `evaluated_at` datetime DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  `ai_summary` text,
                  `matched_skills` json DEFAULT NULL,
                  `missing_skills` json DEFAULT NULL,
                  `skill_match_data` json DEFAULT NULL,
                  PRIMARY KEY (`map_id`),
                  UNIQUE KEY `uq_resume_requirement` (`resume_id`,`requirement_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `audit_log` (
                  `log_id` int NOT NULL AUTO_INCREMENT,
                  `action` varchar(100) NOT NULL,
                  `actor_id` int NOT NULL,
                  `target_type` varchar(50) DEFAULT NULL,
                  `target_id` int DEFAULT NULL,
                  `details` json DEFAULT NULL,
                  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`log_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `question_bank` (
                  `question_id` int NOT NULL AUTO_INCREMENT,
                  `requirement_id` int DEFAULT NULL,
                  `text` text NOT NULL,
                  `type` varchar(50) NOT NULL DEFAULT 'open_ended',
                  `options` json DEFAULT NULL,
                  `correct_answer` text,
                  `skill` varchar(100) DEFAULT NULL,
                  `difficulty` varchar(50) NOT NULL DEFAULT 'medium',
                  `category` varchar(100) DEFAULT NULL,
                  `source` varchar(50) NOT NULL DEFAULT 'AI',
                  `status` varchar(50) NOT NULL DEFAULT 'draft',
                  `created_by` int DEFAULT NULL,
                  `approved_by` int DEFAULT NULL,
                  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (`question_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `exam_question` (
                  `question_id` int NOT NULL AUTO_INCREMENT,
                  `requirement_id` int NOT NULL,
                  `bank_question_id` int DEFAULT NULL,
                  `text` text NOT NULL,
                  `type` varchar(50) NOT NULL,
                  `options` json DEFAULT NULL,
                  `correct_answer` text,
                  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`question_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `exam_session` (
                  `session_id` int NOT NULL AUTO_INCREMENT,
                  `user_id` int NOT NULL,
                  `resume_id` int NOT NULL,
                  `requirement_id` int NOT NULL,
                  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                  `completed_at` datetime DEFAULT NULL,
                  `expires_at` datetime DEFAULT NULL,
                  `status` varchar(50) DEFAULT 'in_progress',
                  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  `exam_score` decimal(5,2) DEFAULT NULL,
                  PRIMARY KEY (`session_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `exam_answer` (
                  `answer_id` int NOT NULL AUTO_INCREMENT,
                  `session_id` int NOT NULL,
                  `question_id` int NOT NULL,
                  `answer_text` text,
                  `score_awarded` decimal(5,2) DEFAULT NULL,
                  `is_correct` tinyint(1) DEFAULT NULL,
                  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (`answer_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `skill_master` (
                  `skill_id` int NOT NULL AUTO_INCREMENT,
                  `skill_name` varchar(100) NOT NULL UNIQUE,
                  PRIMARY KEY (`skill_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `job_skill` (
                  `id` int NOT NULL AUTO_INCREMENT,
                  `requirement_id` int NOT NULL,
                  `skill_id` int NOT NULL,
                  PRIMARY KEY (`id`),
                  FOREIGN KEY (`requirement_id`) REFERENCES `job_requirement` (`requirement_id`) ON DELETE CASCADE,
                  FOREIGN KEY (`skill_id`) REFERENCES `skill_master` (`skill_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

    def setUp(self):
        super().setUp()
        with connection.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
            cursor.execute("TRUNCATE TABLE resume_job_map;")
            cursor.execute("TRUNCATE TABLE resume;")
            cursor.execute("TRUNCATE TABLE job_requirement;")
            cursor.execute("TRUNCATE TABLE position_master;")
            cursor.execute("TRUNCATE TABLE users;")
            cursor.execute("TRUNCATE TABLE rolemaster;")
            cursor.execute("TRUNCATE TABLE audit_log;")
            cursor.execute("TRUNCATE TABLE question_bank;")
            cursor.execute("TRUNCATE TABLE exam_question;")
            cursor.execute("TRUNCATE TABLE exam_session;")
            cursor.execute("TRUNCATE TABLE exam_answer;")
            cursor.execute("TRUNCATE TABLE skill_master;")
            cursor.execute("TRUNCATE TABLE job_skill;")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

            # Insert roles
            cursor.executemany(
                "INSERT INTO rolemaster (role_id, role) VALUES (%s, %s)",
                [
                    (1, 'Admin'),
                    (2, 'Manager'),
                    (3, 'HR'),
                    (4, 'Candidate'),
                ]
            )

            # Insert users
            cursor.executemany(
                "INSERT INTO users (userid, first_name, last_name, username, password, roleid, email) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                [
                    (1, 'Admin', 'User', 'admin', 'password_hash', 1, 'admin@safenet.ai'),
                    (2, 'Manager', 'A', 'manager_a', 'password_hash', 2, 'manager_a@safenet.ai'),
                    (3, 'Manager', 'B', 'manager_b', 'password_hash', 2, 'manager_b@safenet.ai'),
                    (4, 'HR', 'A', 'hr_a', 'password_hash', 3, 'hr_a@safenet.ai'),
                    (5, 'HR', 'B', 'hr_b', 'password_hash', 3, 'hr_b@safenet.ai'),
                    (6, 'Candidate', 'A', 'candidate_a', 'password_hash', 4, 'candidate_a@safenet.ai'),
                ]
            )

            # Insert positions
            cursor.executemany(
                "INSERT INTO position_master (position_id, position_name) VALUES (%s, %s)",
                [
                    (1, 'Software Engineer'),
                    (2, 'Product Manager'),
                ]
            )

            # Insert job requirements
            cursor.executemany(
                "INSERT INTO job_requirement (requirement_id, position_id, experience_range, created_by, assigned_to, resume_weight, exam_weight, exam_duration_minutes) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                [
                    (1, 1, '3-5 years', 2, 4, 60, 40, 60), # Software Engineer created by Manager A, assigned to HR A (user 4)
                    (2, 2, '5+ years', 3, 5, 50, 50, 60),  # Product Manager created by Manager B, assigned to HR B (user 5)
                    (3, 1, '1-3 years', 2, None, 50, 50, 60), # Software Engineer created by Manager A, unassigned
                ]
            )

            # Insert skills
            cursor.executemany(
                "INSERT INTO skill_master (skill_id, skill_name) VALUES (%s, %s)",
                [
                    (1, 'Python'),
                    (2, 'SQL'),
                    (3, 'Product Management'),
                ]
            )

            # Map skills to requirements
            cursor.executemany(
                "INSERT INTO job_skill (id, requirement_id, skill_id) VALUES (%s, %s, %s)",
                [
                    (1, 1, 1),
                    (2, 1, 2),
                    (3, 2, 3),
                ]
            )

            # Insert resume
            cursor.executemany(
                "INSERT INTO resume (resume_id, resume_name, file_location, email, created_by, extracted_skills) VALUES (%s, %s, %s, %s, %s, %s)",
                [
                    (1, 'Alice Resume', '/files/alice.pdf', 'alice@example.com', 4, '["Python", "FastAPI"]'),
                    (2, 'Bob Resume', '/files/bob.pdf', 'bob@example.com', 5, '["Product Management"]'),
                ]
            )

            # Map resumes to requirements
            cursor.executemany(
                "INSERT INTO resume_job_map (map_id, resume_id, requirement_id, status, score, matched_skills, missing_skills, exam_score) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                [
                    (1, 1, 1, 'new', 80.0, '["Python"]', '["SQL"]', 90.0),       # Alice mapped to Job 1 (HR A)
                    (2, 2, 2, 'shortlisted', 75.0, '["Product Management"]', '[]', None), # Bob mapped to Job 2 (HR B)
                ]
            )

    def login_as(self, username, role_id, user_id):
        session = self.client.session
        session['userid'] = user_id
        session['roleid'] = role_id
        session['username'] = username
        session.save()

class TestUnauthenticatedAccess(SecurityTestBase):
    def test_get_users_requires_auth(self):
        response = self.client.get('/api/get-users/')
        self.assertEqual(response.status_code, 401)

    def test_list_job_requirements_requires_auth(self):
        response = self.client.get('/api/list_job_requirements/')
        self.assertEqual(response.status_code, 401)

class TestRoleEnforcement(SecurityTestBase):
    def test_hr_cannot_access_admin_endpoints(self):
        self.login_as('hr_a', 3, 4)
        response = self.client.get('/api/get-users/')
        self.assertEqual(response.status_code, 403)

    def test_manager_cannot_access_hr_endpoints(self):
        self.login_as('manager_a', 2, 2)
        response = self.client.get('/api/hr/recent-resumes/')
        self.assertEqual(response.status_code, 403)

class TestHorizontalPrivilegeEscalation(SecurityTestBase):
    def test_hr_a_cannot_view_hr_b_requirement_details(self):
        self.login_as('hr_a', 3, 4)
        response = self.client.get('/api/get_job_requirement_detail/2/')
        self.assertEqual(response.status_code, 403)

    def test_hr_a_cannot_evaluate_hr_b_requirement(self):
        self.login_as('hr_a', 3, 4)
        response = self.client.post('/api/evaluate/', json.dumps({'requirement_id': 2}), content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_hr_a_cannot_schedule_hr_b_interviews(self):
        self.login_as('hr_a', 3, 4)
        response = self.client.post('/api/hr/schedule-interview/', json.dumps({
            'map_id': 2,
            'interview_datetime': '2026-06-10T14:00:00',
            'interviewer': 'HR A'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 403)

class TestPipelineTransitions(SecurityTestBase):
    def test_illegal_transition_rejected(self):
        self.login_as('hr_a', 3, 4)
        response = self.client.post('/api/pipeline/move/', json.dumps({
            'map_id': 1,
            'new_status': 'joined'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_legal_transition_succeeds(self):
        self.login_as('hr_a', 3, 4)
        response = self.client.post('/api/pipeline/move/', json.dumps({
            'map_id': 1,
            'new_status': 'evaluated'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)

class TestAuditLogging(SecurityTestBase):
    def test_403_is_logged(self):
        self.login_as('hr_a', 3, 4)
        self.client.get('/api/get-users/')
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT action, actor_id FROM audit_log WHERE action = 'auth_failure_403'")
            row = cursor.fetchone()
            self.assertIsNotNone(row)
            self.assertEqual(row[1], 4)

class TestQuestionBankWorkflow(SecurityTestBase):
    def test_create_question_bank_item(self):
        self.login_as('hr_a', 3, 4)
        response = self.client.post('/api/hr/question-bank/create/', json.dumps({
            'requirement_id': 1,
            'text': 'What is FastAPI?',
            'type': 'open_ended',
            'options': None,
            'correct_answer': None,
            'skill': 'FastAPI',
            'category': 'Technical'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('question_id', response.json())

    def test_update_draft_question_in_place(self):
        self.login_as('hr_a', 3, 4)
        # 1. Create a draft question
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO question_bank (requirement_id, text, type, skill, category, status)
                VALUES (1, 'What is Python?', 'open_ended', 'Python', 'Technical', 'draft')
            """)
            cursor.execute("SELECT LAST_INSERT_ID()")
            q_id = cursor.fetchone()[0]

        # 2. Update it
        response = self.client.put(f'/api/hr/question-bank/{q_id}/', json.dumps({
            'text': 'What is Python 3?',
            'type': 'open_ended',
            'skill': 'Python',
            'category': 'Technical'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json().get('cloned'))

        # Check in DB
        with connection.cursor() as cursor:
            cursor.execute("SELECT text FROM question_bank WHERE question_id = %s", [q_id])
            self.assertEqual(cursor.fetchone()[0], 'What is Python 3?')

    def test_update_approved_question_clones_to_draft(self):
        self.login_as('hr_a', 3, 4)
        # 1. Create an approved question
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO question_bank (requirement_id, text, type, skill, category, status)
                VALUES (1, 'What is React?', 'open_ended', 'React', 'Technical', 'approved')
            """)
            cursor.execute("SELECT LAST_INSERT_ID()")
            q_id = cursor.fetchone()[0]

        # 2. Update it (triggers cloning version freeze)
        response = self.client.put(f'/api/hr/question-bank/{q_id}/', json.dumps({
            'text': 'What is React 18?',
            'type': 'open_ended',
            'skill': 'React',
            'category': 'Technical'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get('cloned'))
        new_q_id = response.json().get('question_id')
        self.assertNotEqual(q_id, new_q_id)

        # Check DB that original approved question is untouched, and new draft exists
        with connection.cursor() as cursor:
            cursor.execute("SELECT text, status FROM question_bank WHERE question_id = %s", [q_id])
            orig = cursor.fetchone()
            self.assertEqual(orig[0], 'What is React?')
            self.assertEqual(orig[1], 'approved')

            cursor.execute("SELECT text, status FROM question_bank WHERE question_id = %s", [new_q_id])
            cloned = cursor.fetchone()
            self.assertEqual(cloned[0], 'What is React 18?')
            self.assertEqual(cloned[1], 'draft')

    def test_approve_and_publish_exam_flow(self):
        self.login_as('hr_a', 3, 4)
        # Create 5 approved questions (3 Technical, 1 Behavioral, 1 Problem Solving) in the DB
        with connection.cursor() as cursor:
            # 3 Technical
            for i in range(3):
                cursor.execute("""
                    INSERT INTO question_bank (requirement_id, text, type, skill, category, status)
                    VALUES (1, %s, 'open_ended', 'General', 'Technical', 'approved')
                """, [f'Tech question {i}'])
            # 1 Behavioral
            cursor.execute("""
                INSERT INTO question_bank (requirement_id, text, type, skill, category, status)
                VALUES (1, 'Behavioral question', 'open_ended', 'General', 'Behavioral', 'approved')
            """)
            # 1 Problem Solving
            cursor.execute("""
                INSERT INTO question_bank (requirement_id, text, type, skill, category, status)
                VALUES (1, 'Problem Solving question', 'open_ended', 'General', 'Problem Solving', 'approved')
            """)
            
            cursor.execute("SELECT question_id FROM question_bank WHERE requirement_id = 1 AND status = 'approved'")
            question_ids = [r[0] for r in cursor.fetchall()]

        # 3. Publish them
        publish_resp = self.client.post('/api/hr/question-bank/publish/', json.dumps({
            'requirement_id': 1,
            'question_ids': question_ids
        }), content_type='application/json')
        self.assertEqual(publish_resp.status_code, 200)

        # Verify mapping was created in exam_question with frozen snapshot text
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM exam_question WHERE requirement_id = 1")
            self.assertEqual(cursor.fetchone()[0], 5)

    def test_publish_validation_failure_insufficient_questions(self):
        self.login_as('hr_a', 3, 4)
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO question_bank (requirement_id, text, type, skill, category, status)
                VALUES (1, 'Tech question', 'open_ended', 'General', 'Technical', 'approved')
            """)
            cursor.execute("SELECT LAST_INSERT_ID()")
            q_id = cursor.fetchone()[0]

        # Publish only 1 question -> expect 400 Bad Request
        publish_resp = self.client.post('/api/hr/question-bank/publish/', json.dumps({
            'requirement_id': 1,
            'question_ids': [q_id]
        }), content_type='application/json')
        self.assertEqual(publish_resp.status_code, 400)
        self.assertIn("at least 5 questions", publish_resp.json().get('error', ''))

    def test_publish_validation_failure_insufficient_technical(self):
        self.login_as('hr_a', 3, 4)
        with connection.cursor() as cursor:
            # 2 Technical
            for i in range(2):
                cursor.execute("""
                    INSERT INTO question_bank (requirement_id, text, type, skill, category, status)
                    VALUES (1, %s, 'open_ended', 'General', 'Technical', 'approved')
                """, [f'Tech question {i}'])
            # 2 Behavioral
            for i in range(2):
                cursor.execute("""
                    INSERT INTO question_bank (requirement_id, text, type, skill, category, status)
                    VALUES (1, %s, 'open_ended', 'General', 'Behavioral', 'approved')
                """, [f'Behavioral question {i}'])
            # 1 Problem Solving
            cursor.execute("""
                INSERT INTO question_bank (requirement_id, text, type, skill, category, status)
                VALUES (1, 'Problem Solving question', 'open_ended', 'General', 'Problem Solving', 'approved')
            """)
            
            cursor.execute("SELECT question_id FROM question_bank WHERE requirement_id = 1 AND status = 'approved'")
            question_ids = [r[0] for r in cursor.fetchall()]

        # Publish 5 questions but only 2 Technical -> expect 400 Bad Request
        publish_resp = self.client.post('/api/hr/question-bank/publish/', json.dumps({
            'requirement_id': 1,
            'question_ids': question_ids
        }), content_type='application/json')
        self.assertEqual(publish_resp.status_code, 400)
        self.assertIn("minimum Technical questions requirement", publish_resp.json().get('error', ''))

class TestCandidateExamValidation(SecurityTestBase):
    def test_candidate_exam_fetching_validation(self):
        # 1. Create a session for candidate (user 6)
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO exam_session (session_id, user_id, resume_id, requirement_id, status)
                VALUES (10, 6, 1, 1, 'in_progress')
            """)
            cursor.execute("""
                INSERT INTO exam_question (requirement_id, text, type)
                VALUES (1, 'What is FastAPI?', 'open_ended')
            """)

        # 2. Fetch with wrong candidate (user 4 - HR) -> Expect 403 Forbidden
        self.login_as('hr_a', 3, 4)
        resp = self.client.get('/api/candidate/exam-questions/10/')
        self.assertEqual(resp.status_code, 403)

        # 3. Fetch with correct candidate -> Expect 200 OK
        self.login_as('candidate_a', 4, 6)
        resp_ok = self.client.get('/api/candidate/exam-questions/10/')
        self.assertEqual(resp_ok.status_code, 200)
        self.assertEqual(len(resp_ok.json().get('questions')), 1)

        # 4. Update session status to 'submitted'
        with connection.cursor() as cursor:
            cursor.execute("UPDATE exam_session SET status='submitted' WHERE session_id=10")

        # 5. Fetch again on submitted session -> Expect 400 Bad Request
        resp_done = self.client.get('/api/candidate/exam-questions/10/')
        self.assertEqual(resp_done.status_code, 400)

    def test_candidate_exam_expiration(self):
        # Create an expired session for candidate (user 6)
        import datetime
        from django.utils import timezone
        now = timezone.now()
        past = now - datetime.timedelta(minutes=10)
        
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO exam_session (session_id, user_id, resume_id, requirement_id, started_at, expires_at, status)
                VALUES (11, 6, 1, 1, %s, %s, 'in_progress')
            """, [past - datetime.timedelta(minutes=60), past])

        self.login_as('candidate_a', 4, 6)
        
        # Submit answers to expired session -> Expect 400 Bad Request & exam_timeout log
        resp = self.client.post('/api/candidate/submit-answers/', json.dumps({
            'session_id': 11,
            'answers': [{'question_id': 1, 'answer_text': 'Too late'}]
        }), content_type='application/json')
        self.assertEqual(resp.status_code, 400)
        
        # Check that session status was updated to submitted and audit logged
        with connection.cursor() as cursor:
            cursor.execute("SELECT status FROM exam_session WHERE session_id = 11")
            self.assertEqual(cursor.fetchone()[0], 'submitted')
            
            cursor.execute("SELECT action FROM audit_log WHERE action = 'exam_timeout'")
            self.assertIsNotNone(cursor.fetchone())

    def test_candidate_start_exam_already_exists(self):
        # 1. Candidate is approved/exam_pending in resume_job_map
        with connection.cursor() as cursor:
            cursor.execute("UPDATE resume_job_map SET status = 'approved', user_account_id = 6 WHERE resume_id = 1 AND requirement_id = 1")

        self.login_as('candidate_a', 4, 6)

        # 2. Start exam -> creates session
        resp1 = self.client.post('/api/candidate/start-exam/', json.dumps({
            'resume_id': 1,
            'requirement_id': 1
        }), content_type='application/json')
        self.assertEqual(resp1.status_code, 200)
        session_id = resp1.json().get('session_id')
        self.assertIsNotNone(session_id)

        # 3. Start exam again -> returns existing session
        resp2 = self.client.post('/api/candidate/start-exam/', json.dumps({
            'resume_id': 1,
            'requirement_id': 1
        }), content_type='application/json')
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.json().get('session_id'), session_id)
        self.assertEqual(resp2.json().get('message'), 'Session already exists')

class TestRecommendationEngine(SecurityTestBase):
    def test_weighted_recommendation_factors(self):
        self.login_as('hr_a', 3, 4)
        
        # Job 1 has weights: resume_weight=60, exam_weight=40
        # Candidate 1 has match score=80.0, exam_score=90.0
        # Weighted score = (80 * 60 + 90 * 40)/100 = (4800 + 3600)/100 = 84.0%
        # Threshold 84.0 >= 80 -> Strong Hire
        
        response = self.client.get('/api/hr/candidates/1/ai-details/?requirement_id=1')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        rec_data = data.get('hiring_recommendation')
        self.assertIsNotNone(rec_data)
        self.assertEqual(rec_data.get('recommendation'), 'Strong Hire')
        
        factors = rec_data.get('factors')
        self.assertIn("Combined weighted score of 84.0% meets target", factors[0])

    def test_recommendation_suspended_without_exam_score(self):
        self.login_as('hr_a', 3, 4)
        
        # Candidate 1 mapped to Job 1, set exam_score to NULL in DB
        with connection.cursor() as cursor:
            cursor.execute("UPDATE resume_job_map SET exam_score = NULL WHERE resume_id = 1 AND requirement_id = 1")
            
        response = self.client.get('/api/hr/candidates/1/ai-details/?requirement_id=1')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        rec_data = data.get('hiring_recommendation')
        self.assertIsNotNone(rec_data)
        self.assertEqual(rec_data.get('recommendation'), 'Interview Pending')
        self.assertEqual(rec_data.get('confidence'), 'N/A')
        self.assertIn("Hiring recommendation is suspended until the exam is completed and scored.", rec_data.get('factors')[2])

class TestWorkflowHardening(SecurityTestBase):
    def test_finalized_candidate_locking_enforced(self):
        self.login_as('hr_a', 3, 4)
        
        # Set candidate status to joined
        with connection.cursor() as cursor:
            cursor.execute("UPDATE resume_job_map SET status = 'joined' WHERE map_id = 1")

        # Non-admin (HR recruiter) attempts to move status back to shortlisted -> Expect 403 Forbidden
        response = self.client.post('/api/pipeline/move/', json.dumps({
            'map_id': 1,
            'new_status': 'shortlisted'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 403)
        self.assertIn("Finalized records cannot be modified", response.json().get('error', ''))

        # Admin attempts same transition -> succeeds
        self.login_as('admin', 1, 1)
        response_admin = self.client.post('/api/pipeline/move/', json.dumps({
            'map_id': 1,
            'new_status': 'shortlisted'
        }), content_type='application/json')
        self.assertEqual(response_admin.status_code, 200)

    def test_manager_search_isolation(self):
        # Manager A (userid 2) created Job 1. Manager B (userid 3) created Job 2.
        # Candidate A (resume 1) is mapped to Job 1. Candidate B (resume 2) is mapped to Job 2.
        
        # Both candidates must be 'done' parse status to show up in search
        with connection.cursor() as cursor:
            cursor.execute("UPDATE resume SET parse_status = 'done' WHERE resume_id = 1")
            cursor.execute("UPDATE resume SET parse_status = 'done' WHERE resume_id = 2")
            cursor.execute("UPDATE resume_job_map SET status = 'evaluated' WHERE resume_id = 2 AND requirement_id = 2")

        # Manager A search -> should ONLY see Candidate A (from Job 1) and NOT Candidate B (from Job 2)
        self.login_as('manager_a', 2, 2)
        response = self.client.get('/api/search/candidates/')
        self.assertEqual(response.status_code, 200)
        results = response.json().get('results', [])
        
        # Make sure they only see Candidate A (resume_id = 1)
        resume_ids = [r['resume_id'] for r in results]
        self.assertIn(1, resume_ids)
        self.assertNotIn(2, resume_ids)

    def test_stale_exam_cleanup_task(self):
        # Create an expired session with 0 answers (abandoned)
        # and another expired session with >= 1 answer (timeout)
        import datetime
        from django.utils import timezone
        now = timezone.now()
        past = now - datetime.timedelta(minutes=10)
        
        with connection.cursor() as cursor:
            # Session 20: 0 answers (abandoned)
            cursor.execute("""
                INSERT INTO exam_session (session_id, user_id, resume_id, requirement_id, started_at, expires_at, status)
                VALUES (20, 6, 1, 1, %s, %s, 'in_progress')
            """, [past - datetime.timedelta(minutes=60), past])
            
            # Session 21: 1 answer (timeout)
            cursor.execute("""
                INSERT INTO exam_session (session_id, user_id, resume_id, requirement_id, started_at, expires_at, status)
                VALUES (21, 6, 2, 2, %s, %s, 'in_progress')
            """, [past - datetime.timedelta(minutes=60), past])
            cursor.execute("""
                INSERT INTO exam_answer (session_id, question_id, answer_text)
                VALUES (21, 1, 'My answer')
            """)

        from recruitment.tasks import cleanup_abandoned_exams
        result = cleanup_abandoned_exams()
        self.assertEqual(result.get('cleaned_count'), 2)

        # Verify session states and audit logs
        with connection.cursor() as cursor:
            # Both should be marked submitted
            cursor.execute("SELECT status FROM exam_session WHERE session_id IN (20, 21)")
            statuses = [r[0] for r in cursor.fetchall()]
            self.assertEqual(statuses, ['submitted', 'submitted'])

            # Log table should have both timeout and abandoned actions
            cursor.execute("SELECT action FROM audit_log WHERE action IN ('exam_abandoned', 'exam_timeout')")
            actions = [r[0] for r in cursor.fetchall()]
            self.assertIn('exam_abandoned', actions)
            self.assertIn('exam_timeout', actions)


class TestJobStatusWorkflowAndGuards(SecurityTestBase):
    def test_job_status_update_permissions(self):
        # 1. Manager A (userid 2) closes Job 1 (created by Manager A) -> 200 OK
        self.login_as('manager_a', 2, 2)
        response = self.client.post('/api/jobs/1/status/', json.dumps({
            'status': 'CLOSED'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Verify in DB
        with connection.cursor() as cursor:
            cursor.execute("SELECT status, closed_by FROM job_requirement WHERE requirement_id = 1")
            row = cursor.fetchone()
            self.assertEqual(row[0], 'CLOSED')
            self.assertEqual(row[1], 2)

        # 2. Manager A attempts to close Job 2 (created by Manager B, userid 3) -> 403 Forbidden
        response = self.client.post('/api/jobs/2/status/', json.dumps({
            'status': 'CLOSED'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 403)

        # 3. Manager A attempts to delete Job 1 -> 403 Forbidden (Only Admin can delete)
        response = self.client.post('/api/jobs/1/status/', json.dumps({
            'status': 'DELETED'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 403)

        # 4. HR A (userid 4) attempts to close Job 1 -> 403 Forbidden
        self.login_as('hr_a', 3, 4)
        response = self.client.post('/api/jobs/1/status/', json.dumps({
            'status': 'CLOSED'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 403)

        # 5. Admin (userid 1) closes Job 2 -> 200 OK
        self.login_as('admin', 1, 1)
        response = self.client.post('/api/jobs/2/status/', json.dumps({
            'status': 'CLOSED'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # 6. Admin deletes Job 1 -> 200 OK
        response = self.client.post('/api/jobs/1/status/', json.dumps({
            'status': 'DELETED'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Verify in DB
        with connection.cursor() as cursor:
            cursor.execute("SELECT status, deleted_by FROM job_requirement WHERE requirement_id = 1")
            row = cursor.fetchone()
            self.assertEqual(row[0], 'DELETED')
            self.assertEqual(row[1], 1)

        # 7. Admin reopens Job 2 (currently CLOSED) -> 200 OK
        response = self.client.post('/api/jobs/2/status/', json.dumps({
            'status': 'ACTIVE'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Verify in DB
        with connection.cursor() as cursor:
            cursor.execute("SELECT status, closed_at, closed_by FROM job_requirement WHERE requirement_id = 2")
            row = cursor.fetchone()
            self.assertEqual(row[0], 'ACTIVE')
            self.assertIsNone(row[1])
            self.assertIsNone(row[2])

    def test_job_list_filtering(self):
        # 1. Admin soft-deletes Job 3 (created by Manager A)
        self.login_as('admin', 1, 1)
        response = self.client.post('/api/jobs/3/status/', json.dumps({
            'status': 'DELETED'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # 2. Manager A (userid 2) lists job requirements -> should NOT see Job 3
        self.login_as('manager_a', 2, 2)
        response = self.client.get('/api/list_job_requirements/')
        self.assertEqual(response.status_code, 200)
        jobs = response.json()
        req_ids = [j['requirement_id'] for j in jobs]
        self.assertNotIn(3, req_ids)

        # 3. Admin lists job requirements (default) -> should NOT see Job 3
        self.login_as('admin', 1, 1)
        response = self.client.get('/api/list_job_requirements/')
        self.assertEqual(response.status_code, 200)
        jobs = response.json()
        req_ids = [j['requirement_id'] for j in jobs]
        self.assertNotIn(3, req_ids)

        # 4. Admin lists job requirements with show_deleted=true -> should see Job 3
        response = self.client.get('/api/list_job_requirements/?show_deleted=true')
        self.assertEqual(response.status_code, 200)
        jobs = response.json()
        req_ids = [j['requirement_id'] for j in jobs]
        self.assertIn(3, req_ids)

    def test_job_status_guards(self):
        # Set Job 1 status to CLOSED in the DB
        with connection.cursor() as cursor:
            cursor.execute("UPDATE job_requirement SET status = 'CLOSED' WHERE requirement_id = 1")

        # 1. Upload Resume Guard: should fail with 400 Bad Request
        self.login_as('hr_a', 3, 4)
        response = self.client.post('/api/hr/upload/', {
            'requirement_id': 1
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn("not ACTIVE", response.json().get('error', ''))

        # 2. AI Evaluation Guard: should fail with 400
        response = self.client.post('/api/evaluate/', json.dumps({
            'requirement_id': 1
        }), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("not ACTIVE", response.json().get('error', ''))

        # 3. Shortlisting Guard: should fail with 400
        response = self.client.post('/api/hr/shortlist/', json.dumps([
            {'requirement_id': 1, 'resume_id': 1}
        ]), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("not ACTIVE", response.json().get('error', ''))

        # 4. Approve Shortlist Guard: should fail with 400
        self.login_as('manager_a', 2, 2)
        response = self.client.post('/api/manager/approve-shortlist/', json.dumps({
            'requirement_id': 1,
            'candidate_ids': [1]
        }), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("not ACTIVE", response.json().get('error', ''))

        # 5. Schedule Interview Guard: should fail with 400
        self.login_as('hr_a', 3, 4)
        response = self.client.post('/api/hr/schedule-interview/', json.dumps({
            'map_id': 1,
            'interview_datetime': '2026-06-10T14:00:00',
            'interviewer': 'HR A'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("not ACTIVE", response.json().get('error', ''))

        # 6. Start Exam Guard: should fail with 400
        # Map candidate 6 to Job 1, set status to approved
        with connection.cursor() as cursor:
            cursor.execute("UPDATE resume_job_map SET status = 'approved', user_account_id = 6 WHERE map_id = 1")
        self.login_as('candidate_a', 4, 6)
        response = self.client.post('/api/candidate/start-exam/', json.dumps({
            'resume_id': 1,
            'requirement_id': 1
        }), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("not ACTIVE", response.json().get('error', ''))


