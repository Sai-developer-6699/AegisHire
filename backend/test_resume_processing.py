"""
test_resume_processing.py

Testing script to verify PDF resume text extraction, skill profiling,
and deterministic scoring + AI generation on Windows.
"""
import os
import sys
import django
import shutil
import hashlib
from django.conf import settings

# Initialize Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection
from recruitment.repositories.resume_repo import resume_repo
from recruitment.repositories.candidate_repo import candidate_repo
from recruitment.services.resume_parser import resume_parser
from recruitment.services.scoring_engine import scoring_engine
from recruitment.services.ai_service import get_ai_service
from recruitment.tasks import parse_and_profile_resume, run_ai_evaluation

def setup_mock_data():
    """Sets up a mock user, positions, and job requirement if not present."""
    with connection.cursor() as cursor:
        # 1. Ensure user 'admin' exists or create one
        cursor.execute("SELECT userid FROM users WHERE username = 'admin'")
        user_row = cursor.fetchone()
        if user_row:
            userid = user_row[0]
        else:
            print("Creating mock HR user...")
            from django.contrib.auth.hashers import make_password
            cursor.execute("""
                INSERT INTO users (first_name, last_name, username, password, roleid, email, phone_number, department, status)
                VALUES ('System', 'Admin', 'admin', %s, 1, 'admin@safenet.com', '1234567890', 'HR', 'active')
            """, [make_password('admin@123')])
            cursor.execute("SELECT LAST_INSERT_ID()")
            userid = cursor.fetchone()[0]
        
        # 2. Ensure position_master has at least one entry
        cursor.execute("SELECT position_id, position_name FROM position_master LIMIT 1")
        pos_row = cursor.fetchone()
        if pos_row:
            position_id, position_name = pos_row
        else:
            print("Creating mock Software Engineer position in position_master...")
            cursor.execute("INSERT INTO position_master (position_name) VALUES ('Software Engineer')")
            cursor.execute("SELECT LAST_INSERT_ID()")
            position_id = cursor.fetchone()[0]
            position_name = 'Software Engineer'

        # 3. Ensure skill_master has some standard skills
        skills_to_seed = ["Python", "Django", "React", "SQL", "Git", "Celery", "JavaScript", "HTML", "CSS", "C++"]
        for skill in skills_to_seed:
            cursor.execute("SELECT skill_id FROM skill_master WHERE LOWER(skill_name) = LOWER(%s)", [skill])
            if not cursor.fetchone():
                cursor.execute("INSERT INTO skill_master (skill_name) VALUES (%s)", [skill])

        # 4. Ensure job_requirement exists for this position
        cursor.execute("SELECT requirement_id FROM job_requirement WHERE position_id = %s", [position_id])
        req_row = cursor.fetchone()
        if req_row:
            requirement_id = req_row[0]
        else:
            print("Creating job requirement for Software Engineer...")
            cursor.execute("""
                INSERT INTO job_requirement (position_id, experience_range, created_by)
                VALUES (%s, %s, %s)
            """, [position_id, '2-5', userid])
            cursor.execute("SELECT LAST_INSERT_ID()")
            requirement_id = cursor.fetchone()[0]

            # Seed education requirement (e.g. B.Tech / Bachelors)
            cursor.execute("SELECT education_id FROM education_master WHERE LOWER(education_name) LIKE '%bachelor%' OR LOWER(education_name) LIKE '%b.tech%' LIMIT 1")
            edu_row = cursor.fetchone()
            if not edu_row:
                cursor.execute("INSERT INTO education_master (education_name) VALUES ('B.Tech')")
                cursor.execute("SELECT LAST_INSERT_ID()")
                edu_id = cursor.fetchone()[0]
            else:
                edu_id = edu_row[0]
            cursor.execute("INSERT INTO job_education (requirement_id, education_id) VALUES (%s, %s)", [requirement_id, edu_id])

            # Link job to skills
            cursor.execute("SELECT skill_id, skill_name FROM skill_master")
            all_skills = cursor.fetchall()
            for sid, sname in all_skills:
                if sname in ["Python", "Django", "React", "SQL"]:
                    cursor.execute("INSERT INTO job_skill (requirement_id, skill_id) VALUES (%s, %s)", [requirement_id, sid])

        return userid, requirement_id

def test_resume_import_and_parse():
    print("--- Setting up Database Mock Data ---")
    userid, requirement_id = setup_mock_data()
    print(f"Using Admin ID: {userid}, Job Requirement ID: {requirement_id}")

    ai_dir = os.path.join(os.path.dirname(settings.BASE_DIR), 'AI')
    resumes_dir = os.path.join(settings.MEDIA_ROOT, 'resumes')
    os.makedirs(resumes_dir, exist_ok=True)

    if not os.path.exists(ai_dir):
        print(f"AI directory not found at: {ai_dir}")
        return

    # Find PDF resumes
    pdf_resumes = [f for f in os.listdir(ai_dir) if f.lower().endswith('.pdf')]
    if not pdf_resumes:
        print("No PDF resumes found in AI directory to import.")
        return

    print(f"Found {len(pdf_resumes)} resumes to process: {pdf_resumes}")

    for idx, filename in enumerate(pdf_resumes):
        src_path = os.path.join(ai_dir, filename)
        dest_path = os.path.join(resumes_dir, filename)

        # 1. Copy file
        shutil.copy2(src_path, dest_path)
        
        # 2. Compute SHA-256
        with open(dest_path, 'rb') as f:
            content_hash = hashlib.sha256(f.read()).hexdigest()

        # Check if already exists in DB
        with connection.cursor() as cursor:
            cursor.execute("SELECT resume_id, parse_status FROM resume WHERE content_hash = %s", [content_hash])
            exists = cursor.fetchone()
            
            if exists:
                resume_id = exists[0]
                parse_status = exists[1]
                print(f"\n[{idx+1}/{len(pdf_resumes)}] {filename} already exists (ID: {resume_id}, Status: {parse_status})")
            else:
                candidate_name = os.path.splitext(filename)[0].replace('_', ' ')
                email = f"candidate{idx+1}@example.com"
                phone = f"987654321{idx % 10}"
                file_location = f"resumes/{filename}"
                
                cursor.execute("""
                    INSERT INTO resume (resume_name, email, phone_number, file_location, created_by, content_hash, parse_status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                """, [candidate_name, email, phone, file_location, userid, content_hash])
                cursor.execute("SELECT LAST_INSERT_ID()")
                resume_id = cursor.fetchone()[0]
                print(f"\n[{idx+1}/{len(pdf_resumes)}] Imported {filename} as ID: {resume_id}")

        # 3. Run Parser task synchronously
        print(f"   Parsing resume ID {resume_id}...")
        parse_result = parse_and_profile_resume(resume_id)
        print(f"   Parser Result: {parse_result}")

        # 4. Run AI evaluation task synchronously
        print(f"   Evaluating resume ID {resume_id} against job requirement {requirement_id}...")
        eval_result = run_ai_evaluation(resume_id, requirement_id, userid)
        print(f"   Evaluation Result: {eval_result}")

        # Fetch score and summary from DB
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT score, ai_summary, matched_skills 
                FROM resume_job_map 
                WHERE resume_id = %s AND requirement_id = %s
            """, [resume_id, requirement_id])
            map_row = cursor.fetchone()
            if map_row:
                print(f"   Matched Score: {map_row[0]}%")
                print(f"   Summary: {map_row[1]}")
                print(f"   Matched Skills: {map_row[2]}")
            else:
                print("   Error: resume_job_map record not found!")

if __name__ == '__main__':
    test_resume_import_and_parse()
