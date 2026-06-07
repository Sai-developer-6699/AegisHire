import json
from django.core.management.base import BaseCommand
from django.db import connection
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = "Seeds the AegisHire database with sample roles, positions, skills, default users, and job posts."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting database seed process..."))

        try:
            with connection.cursor() as cursor:
                cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

                # 1. Seed Roles
                self.stdout.write("Seeding roles...")
                cursor.execute("TRUNCATE TABLE rolemaster;")
                cursor.executemany(
                    "INSERT INTO rolemaster (role_id, role) VALUES (%s, %s)",
                    [
                        (1, 'Admin'),
                        (2, 'Manager'),
                        (3, 'HR'),
                        (4, 'Candidate'),
                    ]
                )

                # 2. Seed Positions
                self.stdout.write("Seeding position masters...")
                cursor.execute("TRUNCATE TABLE position_master;")
                cursor.executemany(
                    "INSERT INTO position_master (position_id, position_name) VALUES (%s, %s)",
                    [
                        (1, 'Senior Software Engineer'),
                        (2, 'Technical Product Manager'),
                        (3, 'DevOps Specialist'),
                    ]
                )

                # 3. Seed Skills
                self.stdout.write("Seeding skills masters...")
                cursor.execute("TRUNCATE TABLE skill_master;")
                cursor.executemany(
                    "INSERT INTO skill_master (skill_id, skill_name) VALUES (%s, %s)",
                    [
                        (1, 'React'),
                        (2, 'TypeScript'),
                        (3, 'Python'),
                        (4, 'Docker'),
                        (5, 'Kubernetes'),
                        (6, 'FastAPI'),
                        (7, 'Celery'),
                        (8, 'Redis'),
                    ]
                )

                # 4. Seed Users
                self.stdout.write("Seeding default portfolio users (Admin, Managers, HRs, Candidates)...")
                cursor.execute("TRUNCATE TABLE users;")
                
                # Encrypt passwords using Django hashers
                pwd_hash = make_password('password123')

                cursor.executemany(
                    "INSERT INTO users (userid, first_name, last_name, username, password, roleid, email, department) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    [
                        (1, 'System', 'Admin', 'admin', pwd_hash, 1, 'admin@aegishire.ai', 'IT Operations'),
                        (2, 'Lisa', 'Vance', 'manager_lisa', pwd_hash, 2, 'lisa.vance@aegishire.ai', 'Engineering'),
                        (3, 'John', 'Doe', 'manager_john', pwd_hash, 2, 'john.doe@aegishire.ai', 'Product'),
                        (4, 'Sarah', 'Jenkins', 'hr_sarah', pwd_hash, 3, 'sarah.jenkins@aegishire.ai', 'Recruitment'),
                        (5, 'Michael', 'Smith', 'hr_michael', pwd_hash, 3, 'michael.smith@aegishire.ai', 'Recruitment'),
                        (6, 'Marcus', 'Chen', 'candidate_marcus', pwd_hash, 4, 'candidate_marcus@aegishire.ai', None),
                        (7, 'Jane', 'Doe', 'candidate_jane', pwd_hash, 4, 'candidate_jane@aegishire.ai', None),
                    ]
                )

                # 5. Seed Job Requirements
                self.stdout.write("Seeding job requirements...")
                cursor.execute("TRUNCATE TABLE job_requirement;")
                cursor.executemany(
                    "INSERT INTO job_requirement (requirement_id, position_id, experience_range, created_by, assigned_to, resume_weight, exam_weight, exam_duration_minutes) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    [
                        # Software Engineer, created by Lisa (Manager), assigned to Sarah (HR)
                        (1, 1, '3-5 years', 2, 4, 60, 40, 45), 
                        # DevOps Specialist, created by Lisa (Manager), unassigned (HR can claim it!)
                        (2, 3, '5+ years', 2, None, 50, 50, 60),  
                        # Product Manager, created by John (Manager), assigned to Michael (HR)
                        (3, 2, '4+ years', 3, 5, 50, 50, 60), 
                    ]
                )

                # 6. Map skills to job requirements
                self.stdout.write("Mapping skills to requirements...")
                cursor.execute("TRUNCATE TABLE job_skill;")
                cursor.executemany(
                    "INSERT INTO job_skill (requirement_id, skill_id) VALUES (%s, %s)",
                    [
                        (1, 1), (1, 2), (1, 3), (1, 7), (1, 8),  # React, TypeScript, Python, Celery, Redis
                        (2, 3), (2, 4), (2, 5),                  # Python, Docker, Kubernetes
                        (3, 6), (3, 8),                          # FastAPI, Redis
                    ]
                )

                cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
                cursor.connection.commit()

            self.style.SUCCESS("Database seeded successfully with portfolio users!")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error seeding database: {str(e)}"))
