import os
from django.conf import settings
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
import json
import logging
import re
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
import random

# Configure logging
logger = logging.getLogger(__name__)

def validate_email(email):
    try:
        django_validate_email(email)
        return True
    except ValidationError:
        return False

def home(request):
    return Response("Welcome to the AI Recruitment Tool Backend")



@csrf_exempt
@api_view(['POST'])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')

    with connection.cursor() as cursor:
        # Fetch userid, hashed password, and roleid from users table
        cursor.execute("SELECT userid, password, roleid FROM users WHERE username = %s", [username])
        user = cursor.fetchone()

    if user and check_password(password, user[1]):
        userid = user[0]
        roleid = user[2]

        # Store userid and roleid in the session
        request.session['userid'] = userid
        request.session['roleid'] = roleid
        print("Session after login:", request.session.items())
        # Optionally, send the session data to the client
        return Response({
            'message': 'Login successful!',
            'roleid': roleid,
            'userid': userid  # Frontend can save this in localStorage or sessionStorage
        })
    else:
        return Response({'message': 'Invalid username or password'}, status=401)


# View for the dashboard
@csrf_exempt
@api_view(['GET'])
def dashboard(request):
    userid = request.session.get('userid')
    roleid = request.session.get('roleid')

    if not userid:
        return Response({'message': 'Unauthorized'}, status=401)

    # Proceed with logic
    return Response({'message': f'Welcome user {userid} with role {roleid}'})


# View for logout
@csrf_exempt
@api_view(['POST'])
def logout_api(request):
    request.session.flush()  # Clears session data
    return Response({'message': 'Logged out successfully', 'redirect': '/index.html'})


# View for checking session



# View for getting role_id
def get_role_id(role_name, default_role_id=4):
    try:
        cursor = connection.cursor()
        cursor.execute("""
            SELECT role_id 
            FROM rolemaster 
            WHERE LOWER(role) = LOWER(%s)
        """, [role_name])  # 'role' is the column name in your table

        result = cursor.fetchone()

        if result:
            return result[0]
        else:
            return default_role_id
    except Exception as e:
        logger.error(f"Error fetching role ID for '{role_name}': {str(e)}")
        return default_role_id
    finally:
        if cursor:
            cursor.close()


# View for registering a new user
@csrf_exempt
@api_view(['POST'])
def register_api(request):
    data = request.data  # works with DRF

    hashed_pwd = make_password(data['password'])

    cursor = connection.cursor()
    cursor.execute("""
        INSERT INTO users (first_name, last_name, username, password, roleid, email, phone_number, department, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        data['first_name'], data['last_name'], data['username'],
        hashed_pwd, get_role_id(data['role']), data['email'],
        data['phone_number'], data['department'], data['status']
    ))

    return Response({'message': 'User created successfully'})


# view for getting all users
@csrf_exempt
@api_view(['GET'])
def get_all_users(request):
    role = request.GET.get('role') or None
    status = request.GET.get('status') or None

    cursor = connection.cursor()
    cursor.callproc('get_users', [role, status])
    result = cursor.fetchall()

    users = []
    for row in result:
        users.append({
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "role": row[3],
            "status": row[4],
            "initials": ''.join([n[0] for n in row[1].split()]).upper(),
            "color": "text-green-400"  # optionally set by role/status
        })

    return Response(users)


# View for getting user by username
@csrf_exempt
@api_view(['GET'])
def get_user_by_username(request, username):
    cursor = connection.cursor()
    cursor.execute("SELECT userid FROM users WHERE username = %s", [username])
    result = cursor.fetchone()
    
    if result:
        return Response({"userid": result[0]})
    else:
        return Response({"userid": None})  # Not found


# View for updating a user
@csrf_exempt
@api_view(['PUT'])
def update_user_by_username(request, username):
    data = request.data
    cursor = connection.cursor()

    roleid = get_role_id(data['role'])  # 💡 convert role name to ID

    cursor.execute("""
        UPDATE users
        SET first_name=%s, last_name=%s, email=%s,
            phone_number=%s, department=%s, status=%s, roleid=%s
        WHERE username = %s
    """, (
        data['first_name'], data['last_name'], data['email'],
        data['phone_number'], data['department'], data['status'], roleid, username
    ))

    return Response({"message": "User updated successfully"})


# View for deleting a user
@csrf_exempt
@api_view(['DELETE'])
def delete_user(request, userid):
    cursor = connection.cursor()
    cursor.execute("DELETE FROM users WHERE userid = %s", [userid])
    return Response({"message": "User deleted successfully"})


# View for getting user by id
@csrf_exempt
@api_view(['GET'])
def get_user_by_id(request, userid):
    cursor = connection.cursor()
    cursor.execute("""
        SELECT 
            u.first_name, 
            u.last_name, 
            u.username, 
            u.email, 
            u.phone_number, 
            u.status, 
            u.department,
            r.role
        FROM users u
        JOIN rolemaster r ON u.roleid = r.role_id
        WHERE u.userid = %s
    """, [userid])
    
    row = cursor.fetchone()

    if not row:
        return Response({"error": "User not found"}, status=404)

    return Response({
        "first_name": row[0],
        "last_name": row[1],
        "username": row[2],
        "email": row[3],
        "phone_number": row[4],
        "status": row[5],
        "department": row[6],        
        "role": row[7] 
    })


# Manager Section

## Job Creation


@csrf_exempt
@api_view(['GET'])
def get_positions(request):
    cursor = connection.cursor()
    cursor.execute("SELECT position_name FROM position_master")
    positions = [row[0] for row in cursor.fetchall()]
    return Response(positions)

@csrf_exempt
@api_view(['POST'])
def get_recommendations_for_position(request):
    try:
        position_name = request.data.get('position', '').strip()

        if not position_name:
            return Response({'error': 'Position name is required'}, status=400)

        def fetch_column(cursor, query, params):
            cursor.execute(query, params)
            return [row[0] for row in cursor.fetchall()]

        with connection.cursor() as cursor:
            # Get position_id
            cursor.execute(
                "SELECT position_id FROM position_master WHERE position_name = %s",
                [position_name]
            )
            row = cursor.fetchone()
            if not row:
                return Response({'error': 'Invalid position'}, status=400)

            position_id = row[0]

            # Fetch values using shared function
            technical_skills = fetch_column(cursor, """
                SELECT s.skill_name
                FROM job_requirement_skills psm
                JOIN skill_master s ON psm.skill_id = s.skill_id
                WHERE psm.position_id = %s
            """, [position_id])

            soft_skills = fetch_column(cursor, """
                SELECT ss.soft_skill_name
                FROM job_requirement_softskills pssm
                JOIN soft_skill_master ss ON pssm.soft_skill_id = ss.soft_skill_id
                WHERE pssm.position_id = %s
            """, [position_id])

            education = fetch_column(cursor, """
                SELECT e.education_name
                FROM job_requirement_education pem
                JOIN education_master e ON pem.education_id = e.education_id
                WHERE pem.position_id = %s
            """, [position_id])

        return Response({
            'technical_skills': technical_skills,
            'soft_skills': soft_skills,
            'education': education
        })

    except Exception as e:
        return Response({'error': str(e)}, status=500)


### Submit Job



@csrf_exempt
@api_view(['POST'])
def submit_job(request):
    try:
        userid = request.session.get('userid')
        roleid = request.session.get('roleid')

        # Authorization checks
        if not userid or not roleid or roleid != 2:
            return Response({'error': 'Unauthorized'}, status=401)

        # Input extraction
        position_name = request.data.get('position')
        experience_range = request.data.get('experience')
        selected_skills = request.data.get('technical_skills', [])
        selected_education = request.data.get('education', [])
        selected_soft_skills = request.data.get('soft_skills', [])

        # Basic validation
        if not position_name or not experience_range:
            return Response({'error': 'Position and experience are required'}, status=400)

        if not isinstance(selected_skills, list) or not isinstance(selected_education, list) or not isinstance(selected_soft_skills, list):
            return Response({'error': 'Skills, education, and soft skills must be lists'}, status=400)

        with connection.cursor() as cursor:
            # Get position_id
            cursor.execute("SELECT position_id FROM position_master WHERE position_name=%s", [position_name])
            pos_row = cursor.fetchone()
            if not pos_row:
                return Response({'error': 'Invalid position'}, status=400)
            position_id = pos_row[0]

            # Insert into job_requirement
            cursor.execute("""
                INSERT INTO job_requirement (position_id, experience_range, created_by)
                VALUES (%s, %s, %s)
            """, [position_id, experience_range, userid])
            cursor.execute("SELECT LAST_INSERT_ID()")
            requirement_id = cursor.fetchone()[0]

            # Insert into job_skill
            # Build skill name → ID map
            cursor.execute("SELECT skill_id, skill_name FROM skill_master")
            skill_map = {name.lower(): sid for sid, name in cursor.fetchall()}
            for skill_name in selected_skills:
                sid = skill_map.get(skill_name.lower())
                if sid:
                    cursor.execute("INSERT INTO job_skill (requirement_id, skill_id) VALUES (%s, %s)", [requirement_id, sid])
                else:
                    return Response({'error': f'Invalid skill: {skill_name}'}, status=400)


            # Insert into job_education
            # Get all education name-to-id mappings
            cursor.execute("SELECT education_id, education_name FROM education_master")
            education_map = {name.lower(): eid for eid, name in cursor.fetchall()}

            # Then in the loop
            for edu in selected_education:
                edu_id = education_map.get(edu.lower())  # Convert 'B.Tech' → 1
                if edu_id:
                    cursor.execute("""
                        INSERT INTO job_education (requirement_id, education_id)
                        VALUES (%s, %s)
                    """, [requirement_id, edu_id])
                else:
                    return Response({'error': f'Invalid education: {edu}'}, status=400)

            # Insert into job_softskill (note: table name should be singular as per your schema)
            cursor.execute("SELECT soft_skill_id, soft_skill_name FROM soft_skill_master")
            soft_skill_map = {name.lower(): sid for sid, name in cursor.fetchall()}
            for soft_skill in selected_soft_skills:
                if isinstance(soft_skill, str):
                    soft_skill_id = soft_skill_map.get(soft_skill.lower())
                else:
                    soft_skill_id = soft_skill  # assume it's already an ID

                if soft_skill_id:
                    cursor.execute("""
                        INSERT INTO job_softskill (requirement_id, soft_skill_id)
                        VALUES (%s, %s)
                    """, [requirement_id, soft_skill_id])
                else:
                    return Response({'error': f'Invalid soft skill: {soft_skill}'}, status=400)


            cursor.connection.commit()

        return Response({'status': 'Job created successfully', 'requirement_id': requirement_id})

    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

### Update Job
@csrf_exempt
@api_view(['PUT'])
def update_job(request):
    try:
        userid = request.session.get('userid')
        roleid = request.session.get('roleid')

        if not userid or not roleid:
            return Response({'error': 'Unauthorized'}, status=401)
        
        if roleid != 2:
            return Response({'error': 'Unauthorized'}, status=401)
        
        position_name = request.data.get('position')
        experience_range = request.data.get('experience')
        selected_skills = request.data.get('skills', [])
        selected_education = request.data.get('education', [])
        selected_soft_skills = request.data.get('soft_skills', [])

        # Validate list inputs
        if not isinstance(selected_skills, list) or not isinstance(selected_education, list) or not isinstance(selected_soft_skills, list):
            return Response({'error': 'Skills, education, and soft skills must be lists'}, status=400)

        if not position_name or not experience_range:
            return Response({'error': 'Position and experience are required'}, status=400)

        with connection.cursor() as cursor:
            # Get position_id
            cursor.execute("SELECT position_id FROM position_master WHERE position_name=%s", [position_name])
            pos_row = cursor.fetchone()
            if not pos_row:
                return Response({'error': 'Invalid position'}, status=400)
            position_id = pos_row[0]

            # Insert into job_requirement
            cursor.execute("""
                INSERT INTO job_requirement (position_id, experience_range, created_by)
                VALUES (%s, %s, %s)
            """, [position_id, experience_range, userid])
            cursor.execute("SELECT LAST_INSERT_ID()")
            requirement_id = cursor.fetchone()[0]

  
           # Insert into job_skills
            for skill_id in selected_skills:
                cursor.execute("""
                    INSERT INTO job_skills (requirement_id, skill_id) VALUES (%s, %s)
                """, [requirement_id, skill_id])

            # Insert into job_education
            for education_id in selected_education:
                cursor.execute("""
                    INSERT INTO job_education (requirement_id, education_id) VALUES (%s, %s)
                """, [requirement_id, education_id])

            # Insert into job_softskills
            for soft_skill_id in selected_soft_skills:
                cursor.execute("""
                    INSERT INTO job_softskills (requirement_id, soft_skill_id) VALUES (%s, %s)
                """, [requirement_id, soft_skill_id])

            cursor.connection.commit()

        return Response({'status': 'Job created successfully', 'requirement_id': requirement_id})

    except Exception as e:
        return Response({'error': str(e)}, status=500)

### Recent Uploads of Job Posts

@csrf_exempt
@api_view(['GET'])
def get_recent_jobs(request):
    try:
        user_id = request.GET.get('user_id')
        limit = int(request.GET.get('limit', 5))

        with connection.cursor() as cursor:
            if user_id:
                cursor.execute("""
                    SELECT jr.requirement_id, pm.position_name, jr.experience_range, jr.created_at, u.username
                    FROM job_requirement jr
                    JOIN position_master pm ON jr.position_id = pm.position_id
                    JOIN users u ON jr.created_by = u.userid
                    WHERE jr.created_by = %s
                    ORDER BY jr.created_at DESC
                    LIMIT %s
                """, [user_id, limit])
            else:
                cursor.execute("""
                    SELECT jr.requirement_id, pm.position_name, jr.experience_range, jr.created_at, u.username
                    FROM job_requirement jr
                    JOIN position_master pm ON jr.position_id = pm.position_id
                    JOIN users u ON jr.created_by = u.userid
                    ORDER BY jr.created_at DESC 
                    LIMIT %s
                """, [limit])

            rows = cursor.fetchall()

        jobs = [{
            'requirement_id': row[0],
            'position': row[1],
            'experience': row[2],
            'created_at': row[3],
            'created_by': row[4]
        } for row in rows]

        return Response({'jobs': jobs})

    except Exception as e:
        return Response({'error': str(e)}, status=500)


# Temporary 
@api_view(['GET'])
def check_session(request):
    return Response({
        'userid': request.session.get('userid'),
        'roleid': request.session.get('roleid')
    })



#    ---------  HR  --------- 
# HR Filter Resume
@api_view(['GET'])
def list_job_requirements(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                jr.requirement_id,
                pm.position_name,
                u.username,
                jr.experience_range,
                jr.created_at
            FROM job_requirement jr
            JOIN position_master pm ON jr.position_id = pm.position_id
            JOIN users u ON jr.created_by = u.userid
            ORDER BY jr.created_at DESC
        """)
        results = cursor.fetchall()

    data = [
        {
            "requirement_id": row[0],
            "position": row[1],
            "created_by": row[2],
            "experience_range": row[3],
            "created_at": row[4].strftime("%Y-%m-%d %H:%M:%S")
        }
        for row in results
    ]
    return Response(data)

@api_view(['GET'])
def get_job_requirement_detail(request, requirement_id):
    try:
        with connection.cursor() as cursor:
            # Core Requirement Info
            cursor.execute("""
                SELECT jr.requirement_id, pm.position_name, u.username, jr.experience_range, jr.created_at
                FROM job_requirement jr
                JOIN position_master pm ON jr.position_id = pm.position_id
                JOIN users u ON jr.created_by = u.userid
                WHERE jr.requirement_id = %s
            """, [requirement_id])
            row = cursor.fetchone()
            if not row:
                return Response({'error': 'Requirement not found'}, status=404)

            requirement = {
                'requirement_id': row[0],
                'position': row[1],
                'created_by': row[2],
                'experience': row[3],
                'created_at': row[4].strftime("%Y-%m-%d %H:%M:%S"),
            }

            # Skills
            cursor.execute("""
                SELECT sm.skill_name
                FROM job_skill js
                JOIN skill_master sm ON js.skill_id = sm.skill_id
                WHERE js.requirement_id = %s
            """, [requirement_id])
            skills = [name for (name,) in cursor.fetchall()]

            # Soft Skills
            cursor.execute("""
                SELECT ssm.soft_skill_name
                FROM job_softskill js
                JOIN soft_skill_master ssm ON js.soft_skill_id = ssm.soft_skill_id
                WHERE js.requirement_id = %s
            """, [requirement_id])
            soft_skills = [name for (name,) in cursor.fetchall()]

            # Education
            cursor.execute("""
                SELECT em.education_name
                FROM job_education je
                JOIN education_master em ON je.education_id = em.education_id
                WHERE je.requirement_id = %s
            """, [requirement_id])
            education = [name for (name,) in cursor.fetchall()]

        return Response({
            "requirement": requirement,
            "skills": skills,
            "soft_skills": soft_skills,
            "education": education
        })

    except Exception as e:
        return Response({'error': str(e)}, status=500)



# Resume upload

@csrf_exempt
@api_view(['POST'])
@parser_classes([MultiPartParser])
def upload_candidate_resume(request):
    try:
        name = request.POST.get('name')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        resume_file = request.FILES['resume']
        user_id = request.session.get('userid')

        if not name or not email or not phone or not resume_file:
            return Response({'error': 'Missing required fields'}, status=400)

        # Validate email format
        if not validate_email(email):
            return Response({'error': 'Invalid email format'}, status=400)

        # Validate phone number format
        if not re.match(r'^\d{10}$', phone):
            return Response({'error': 'Invalid phone number format'}, status=400)

        # Save to media/resumes/
        fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, 'resumes'))
        filename = fs.save(resume_file.name, resume_file)
        file_path = f"resumes/{filename}"

        # Insert into database
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO resume (resume_name, email, phone_number, file_location,created_by, uploaded_at )
                VALUES (%s, %s, %s, %s, %s , NOW())
            """, [name, email, phone,file_path , user_id])

        return Response({"message": "Resume uploaded successfully!"})
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    


@api_view(['GET'])
def get_recent_resumes(request):
    try:
        limit = int(request.GET.get('limit', 6))

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT r.resume_id, r.resume_name, r.email, r.uploaded_at, r.file_location, rm.status
                FROM resume r
                LEFT JOIN resume_job_map rm ON r.resume_id = rm.resume_id
                ORDER BY r.uploaded_at DESC
                LIMIT %s
            """, [limit])
            rows = cursor.fetchall()

        resumes = [{
            'id': row[0],
            'name': row[1],
            'email': row[2],
            'uploaded_at': row[3].strftime('%Y-%m-%d %H:%M:%S'),
            'file_url': request.build_absolute_uri(f"/media/{row[4]}"),
            'status': row[5]
        } for row in rows]

        return Response({'resumes': resumes})

    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

# User Profile
@csrf_exempt
@api_view(['GET'])
def user_profile(request):
    userid = request.session.get('userid')

    if not userid:
        return Response({'error': 'Unauthorized'}, status=401)

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                first_name, last_name, username, email,
                (SELECT role FROM rolemaster r WHERE r.role_id = u.roleid) as role
            FROM users u
            WHERE userid = %s
        """, [userid])

        row = cursor.fetchone()

    if not row:
        return Response({'error': 'User not found'}, status=404)

    return Response({
        'username': f"{row[0]} {row[1]}",
        'email': row[3],
        'role': row[4] or "User"
    })


# AI Score Generation 
@csrf_exempt
@api_view(['POST'])
def evaluate_with_ai(request):
    try:
        # Parse and validate inputs
        try:
            requirement_id = int(request.data.get('requirement_id'))
        except (TypeError, ValueError):
            return Response({"message": "Invalid requirement ID."}, status=400)

        batch_size = int(request.data.get('limit', 10))
        user_id = request.session.get('userid')

        if not user_id:
            return Response({"message": "Unauthorized. Please log in."}, status=401)

        with connection.cursor() as cursor:
            # Fetch resumes NOT already evaluated for this requirement
            cursor.execute("""
                SELECT r.resume_id
                FROM resume r
                WHERE r.is_active = TRUE
                  AND NOT EXISTS (
                    SELECT 1 FROM resume_job_map m
                    WHERE m.resume_id = r.resume_id AND m.requirement_id = %s
                  )
                LIMIT %s
            """, [requirement_id, batch_size])
            resume_ids = [row[0] for row in cursor.fetchall()]

            if not resume_ids:
                return Response({
                    "message": "No pending resumes found for this requirement.",
                    "resume_count": 0
                }, status=200)

            # Insert evaluations in one transaction
            for resume_id in resume_ids:
                score = round(random.uniform(40, 100), 2)  # placeholder for real AI
                cursor.execute("""
                    INSERT INTO resume_job_map (resume_id, requirement_id, score, status, evaluated_by)
                    VALUES (%s, %s, %s, %s, %s)
                """, [resume_id, requirement_id, score, 'evaluated', user_id])

                cursor.execute("UPDATE resume SET is_active = FALSE WHERE resume_id = %s", [resume_id])

        connection.commit()

        return Response({
            "message": "Evaluated new resumes.",
            "evaluated_count": len(resume_ids)
        }, status=200)

    except Exception as e:
        return Response({"message": "Error: " + str(e)}, status=500)


@api_view(['GET'])
def get_resumes_with_scores(request, requirement_id):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                r.resume_id,
                r.resume_name,
                r.email,
                r.file_location,
                r.uploaded_at,
                rjm.score
            FROM resume_job_map rjm
            JOIN resume r ON rjm.resume_id = r.resume_id
            WHERE rjm.requirement_id = %s AND rjm.status = 'evaluated'
            ORDER BY rjm.score DESC
        """, [requirement_id])

        results = cursor.fetchall()

    resumes = [
        {
            "resume_id": row[0],
            "name": row[1],
            "email": row[2],
            "file_location": row[3],
            "uploaded_at": row[4].strftime('%Y-%m-%d %H:%M:%S'),
            "score": row[5],
            "resume_url": request.build_absolute_uri(f"/media/{row[3]}")  # ✅ Fix
        }
        for row in results
    ]

    return Response({"resumes": resumes})

# Shortlist Resume
@csrf_exempt
@api_view(['POST'])
def shortlist_resumes(request):
    try:
        data = request.data  # Expected: [{resume_id, requirement_id}, ...]

        if not isinstance(data, list) or not data:
            return Response({"error": "Invalid payload format. Must be a non-empty list."}, status=400)

        user_id = request.session.get('userid')
        if not user_id:
            return Response({"error": "Unauthorized. Please log in."}, status=401)

        # Collect selected resume IDs + assumption: all share the same requirement_id
        selected_ids = []
        requirement_id = None

        for item in data:
            resume_id = item.get('resume_id')
            req_id = item.get('requirement_id')

            if resume_id and req_id:
                selected_ids.append(resume_id)
                requirement_id = req_id  # assumes same for all

        if not selected_ids or requirement_id is None:
            return Response({"error": "Missing resume_id or requirement_id in request."}, status=400)

        with connection.cursor() as cursor:
            # Step 1: Shortlist selected resumes
            cursor.execute(f"""
                UPDATE resume_job_map
                SET status = 'shortlisted', updated_at = CURRENT_TIMESTAMP
                WHERE requirement_id = %s AND resume_id IN ({','.join(['%s'] * len(selected_ids))})
            """, [requirement_id] + selected_ids)

            # Step 2: Reject all other resumes for this requirement
            cursor.execute(f"""
                UPDATE resume_job_map
                SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
                WHERE requirement_id = %s AND resume_id NOT IN ({','.join(['%s'] * len(selected_ids))})
            """, [requirement_id] + selected_ids)

        return Response({
            "message": "Shortlisted selected resumes and rejected others.",
            "shortlisted_count": len(selected_ids)
        }, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)









# --------------------- Manager Section --------------------- 
# Manager Shortlist
@api_view(['GET'])
def positions_with_shortlisted(request):
    try:
        user_id = request.session.get('userid')
        role_id = request.session.get('roleid')

        if role_id != 2:
            return Response({"error": "Unauthorized. Please log in."}, status=401)
        
        if not user_id:
            return Response({"error": "Unauthorized. Please log in."}, status=401)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    jr.requirement_id, 
                    pm.position_name, 
                    COUNT(rjm.resume_id) AS shortlisted_count
                FROM job_requirement jr
                JOIN position_master pm ON jr.position_id = pm.position_id
                LEFT JOIN resume_job_map rjm ON rjm.requirement_id = jr.requirement_id
                    AND rjm.status = 'shortlisted'
                WHERE jr.created_by = %s
                GROUP BY jr.requirement_id, pm.position_name
                ORDER BY shortlisted_count DESC
            """, [user_id])
            rows = cursor.fetchall()

            result = [
                {
                    "requirement_id": row[0],
                    "position_name": row[1],
                    "shortlisted_count": row[2]
                }
                for row in rows
            ]

            return Response(result)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# Manager Shortlist Details
@api_view(['GET'])
def get_shortlisted_candidates(request, requirement_id):
    try:
        user_id = request.session.get('userid')
        role_id = request.session.get('roleid')

        # Only allow managers (role_id == 2)
        if role_id != 2 or not user_id:
            return Response({"error": "Unauthorized access."}, status=401)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    r.resume_id,
                    r.resume_name,
                    r.email,
                    r.file_location,
                    rjm.score,
                    pm.position_name
                FROM resume_job_map rjm
                JOIN resume r ON r.resume_id = rjm.resume_id
                JOIN job_requirement jr ON jr.requirement_id = rjm.requirement_id
                JOIN position_master pm ON pm.position_id = jr.position_id
                WHERE rjm.status = 'shortlisted'
                  AND rjm.requirement_id = %s
                  AND jr.created_by = %s
            """, [requirement_id, user_id])

            rows = cursor.fetchall()

        result = [
            {
                "resume_id": row[0],
                "name": row[1],
                "email": row[2],
                "resume_url": request.build_absolute_uri(f"/media/{row[3]}"),
                "ai_score": row[4],
                "position_name": row[5]
            }
            for row in rows
        ]

        return Response(result)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

# Manager Shortlist Approvalt
@csrf_exempt
@api_view(['POST'])
def approve_shortlisted_candidates(request):
    try:
        # Accepts: {"candidate_ids": ["1", "2", ...], "requirement_id": "123"}
        candidate_ids = request.data.get('candidate_ids')
        requirement_id = request.data.get('requirement_id')
        user_id = request.session.get('userid')
        role_id = request.session.get('roleid')

        if role_id != 2 or not user_id:
            return Response({"error": "Unauthorized access."}, status=401)

        if not candidate_ids or not isinstance(candidate_ids, list):
            return Response({"error": "Invalid payload format. Must be a non-empty list of candidate_ids."}, status=400)

        if not requirement_id:
            return Response({"error": "Requirement ID is required."}, status=400)

        # Convert all IDs to int for safety
        selected_ids = [int(cid) for cid in candidate_ids if cid]
        if not selected_ids:
            return Response({"error": "No valid resume IDs provided."}, status=400)

        placeholders = ','.join(['%s'] * len(selected_ids))
        with connection.cursor() as cursor:
            # Step 1: Approve selected resumes
            cursor.execute(f"""
                UPDATE resume_job_map
                SET status = 'approved',
                    evaluated_by = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE requirement_id = %s
                  AND resume_id IN ({placeholders})
                  AND status = 'shortlisted'
            """, [user_id, requirement_id] + selected_ids)

            # Step 2: Reject remaining shortlisted resumes for that job
            cursor.execute(f"""
                UPDATE resume_job_map
                SET status = 'rejected',
                    evaluated_by = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE requirement_id = %s
                  AND resume_id NOT IN ({placeholders})
                  AND status = 'shortlisted'
            """, [user_id, requirement_id] + selected_ids)

            connection.commit()

        return Response({
            "message": "Shortlisted candidates approved and others rejected.",
            "approved_count": len(selected_ids)
        }, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# --- HR INTERVIEW SCHEDULING ---
from datetime import datetime

@csrf_exempt
@api_view(['GET'])
def hr_list_candidates_for_interview(request):
    """
    List candidates with status 'approved' or 'exam_scored' for interview scheduling.
    Only HR (roleid=3) can access.
    """
    userid = request.session.get('userid')
    roleid = request.session.get('roleid')
    if not userid or roleid != 3:
        return Response({'error': 'Unauthorized'}, status=401)
    with connection.cursor() as cursor:
        cursor.execute('''
            SELECT rjm.map_id, r.resume_id, r.resume_name, r.email, r.phone_number, rjm.status, rjm.exam_score
            FROM resume_job_map rjm
            JOIN resume r ON rjm.resume_id = r.resume_id
            WHERE rjm.status IN ('approved', 'exam_scored')
        ''')
        rows = cursor.fetchall()
    candidates = [
        {
            'map_id': row[0],
            'resume_id': row[1],
            'name': row[2],
            'email': row[3],
            'phone': row[4],
            'status': row[5],
            'exam_score': row[6],
        }
        for row in rows
    ]
    return Response({'candidates': candidates})

@csrf_exempt
@api_view(['POST'])
def hr_schedule_interview(request):
    """
    Schedule an interview for a candidate (by map_id). HR only.
    Expects: map_id, interview_datetime (ISO string), interviewer (optional)
    Sets status to 'interview_scheduled'.
    """
    userid = request.session.get('userid')
    roleid = request.session.get('roleid')
    if not userid or roleid != 3:
        return Response({'error': 'Unauthorized'}, status=401)
    data = request.data
    map_id = data.get('map_id')
    interview_datetime = data.get('interview_datetime')
    interviewer = data.get('interviewer', None)
    if not map_id or not interview_datetime:
        return Response({'error': 'map_id and interview_datetime required'}, status=400)
    try:
        dt = datetime.fromisoformat(interview_datetime)
    except Exception:
        return Response({'error': 'Invalid datetime format'}, status=400)
    with connection.cursor() as cursor:
        cursor.execute('''
            UPDATE resume_job_map SET status='interview_scheduled', updated_at=NOW() WHERE map_id=%s
        ''', [map_id])
        # Store interview info in a new table if needed, or in resume_job_map (add columns if present)
        # For now, assume a table interview_schedule(map_id, interview_datetime, interviewer, created_by, created_at)
        cursor.execute('''
            INSERT INTO interview_schedule (map_id, interview_datetime, interviewer, created_by, created_at)
            VALUES (%s, %s, %s, %s, NOW())
        ''', [map_id, interview_datetime, interviewer, userid])
    return Response({'message': 'Interview scheduled successfully'})

@csrf_exempt
@api_view(['GET'])
def hr_list_scheduled_interviews(request):
    """
    List all scheduled interviews (HR only).
    """
    userid = request.session.get('userid')
    roleid = request.session.get('roleid')
    if not userid or roleid != 3:
        return Response({'error': 'Unauthorized'}, status=401)
    with connection.cursor() as cursor:
        cursor.execute('''
            SELECT isch.schedule_id, isch.map_id, r.resume_name, isch.interview_datetime, isch.interviewer, isch.created_at
            FROM interview_schedule isch
            JOIN resume_job_map rjm ON isch.map_id = rjm.map_id
            JOIN resume r ON rjm.resume_id = r.resume_id
            ORDER BY isch.interview_datetime DESC
        ''')
        rows = cursor.fetchall()
    interviews = [
        {
            'schedule_id': row[0],
            'map_id': row[1],
            'candidate_name': row[2],
            'interview_datetime': row[3],
            'interviewer': row[4],
            'created_at': row[5],
        }
        for row in rows
    ]
    return Response({'interviews': interviews}) 


# --- MANAGER CANDIDATE PERFORMANCE ---
@csrf_exempt
@api_view(['GET'])
def manager_list_candidates_performance(request, requirement_id):
    """
    List all candidates for a requirement with exam scores and status. Manager only.
    """
    userid = request.session.get('userid')
    roleid = request.session.get('roleid')
    if not userid or roleid != 2:
        return Response({'error': 'Unauthorized'}, status=401)
    with connection.cursor() as cursor:
        cursor.execute('''
            SELECT rjm.map_id, r.resume_id, r.resume_name, r.email, rjm.status, rjm.exam_score
            FROM resume_job_map rjm
            JOIN resume r ON rjm.resume_id = r.resume_id
            WHERE rjm.requirement_id = %s
        ''', [requirement_id])
        rows = cursor.fetchall()
    candidates = [
        {
            'map_id': row[0],
            'resume_id': row[1],
            'name': row[2],
            'email': row[3],
            'status': row[4],
            'exam_score': row[5],
        }
        for row in rows
    ]
    return Response({'candidates': candidates})

@csrf_exempt
@api_view(['GET'])
def manager_get_exam_answers(request, map_id):
    """
    Fetch detailed exam answers for a candidate (by map_id). Manager only.
    """
    userid = request.session.get('userid')
    roleid = request.session.get('roleid')
    if not userid or roleid != 2:
        return Response({'error': 'Unauthorized'}, status=401)
    with connection.cursor() as cursor:
        # Get session_id for this candidate (assume 1:1 for map_id)
        cursor.execute('''
            SELECT es.session_id
            FROM exam_session es
            JOIN resume_job_map rjm ON es.resume_id = rjm.resume_id AND es.requirement_id = rjm.requirement_id
            WHERE rjm.map_id = %s
        ''', [map_id])
        row = cursor.fetchone()
        if not row:
            return Response({'error': 'No exam session found'}, status=404)
        session_id = row[0]
        # Get answers
        cursor.execute('''
            SELECT ea.answer_id, eq.question_id, eq.text, eq.type, eq.options, ea.answer_text, ea.score_awarded, ea.is_correct
            FROM exam_answer ea
            JOIN exam_question eq ON ea.question_id = eq.question_id
            WHERE ea.session_id = %s
        ''', [session_id])
        answers = [
            {
                'answer_id': a[0],
                'question_id': a[1],
                'question_text': a[2],
                'question_type': a[3],
                'options': a[4],
                'answer_text': a[5],
                'score_awarded': a[6],
                'is_correct': a[7],
            }
            for a in cursor.fetchall()
        ]
    return Response({'session_id': session_id, 'answers': answers})

@csrf_exempt
@api_view(['POST'])
def manager_update_exam_scores(request):
    """
    Update scores/feedback for exam answers. Manager only.
    Expects: session_id, answers: [{answer_id, score_awarded, is_correct}]
    Aggregates total score to resume_job_map.exam_score and updates status.
    """
    userid = request.session.get('userid')
    roleid = request.session.get('roleid')
    if not userid or roleid != 2:
        return Response({'error': 'Unauthorized'}, status=401)
    data = request.data
    session_id = data.get('session_id')
    answers = data.get('answers', [])
    if not session_id or not isinstance(answers, list):
        return Response({'error': 'session_id and answers required'}, status=400)
    total_score = 0
    with connection.cursor() as cursor:
        for ans in answers:
            answer_id = ans.get('answer_id')
            score_awarded = ans.get('score_awarded')
            is_correct = ans.get('is_correct', None)
            if answer_id is None or score_awarded is None:
                continue
            cursor.execute('''
                UPDATE exam_answer SET score_awarded=%s, is_correct=%s, updated_at=NOW() WHERE answer_id=%s
            ''', [score_awarded, is_correct, answer_id])
            total_score += float(score_awarded)
        # Update exam_session and resume_job_map
        cursor.execute('''
            UPDATE exam_session SET status='scored' WHERE session_id=%s
        ''', [session_id])
        # Find map_id
        cursor.execute('''
            SELECT rjm.map_id FROM resume_job_map rjm
            JOIN exam_session es ON rjm.resume_id = es.resume_id AND rjm.requirement_id = es.requirement_id
            WHERE es.session_id = %s
        ''', [session_id])
        row = cursor.fetchone()
        if row:
            map_id = row[0]
            cursor.execute('''
                UPDATE resume_job_map SET exam_score=%s, status='exam_scored', updated_at=NOW() WHERE map_id=%s
            ''', [total_score, map_id])
    return Response({'message': 'Scores updated', 'total_score': total_score}) 


# --- HR FINALISED CANDIDATE ACTIONS ---
@csrf_exempt
@api_view(['GET'])
def hr_list_finalised_candidates(request):
    """
    List all candidates with status 'finalised'. HR only.
    """
    userid = request.session.get('userid')
    roleid = request.session.get('roleid')
    if not userid or roleid != 3:
        return Response({'error': 'Unauthorized'}, status=401)
    with connection.cursor() as cursor:
        cursor.execute('''
            SELECT rjm.map_id, r.resume_id, r.resume_name, r.email, rjm.status, rjm.finalised_at
            FROM resume_job_map rjm
            JOIN resume r ON rjm.resume_id = r.resume_id
            WHERE rjm.status = 'finalised'
        ''')
        rows = cursor.fetchall()
    candidates = [
        {
            'map_id': row[0],
            'resume_id': row[1],
            'name': row[2],
            'email': row[3],
            'status': row[4],
            'finalised_at': row[5],
        }
        for row in rows
    ]
    return Response({'candidates': candidates})

@csrf_exempt
@api_view(['POST'])
def hr_update_finalised_status(request):
    """
    Bulk update status for finalised candidates. HR only.
    Expects: updates: [{map_id, new_status}] (new_status: 'joined' or 'rejected')
    """
    userid = request.session.get('userid')
    roleid = request.session.get('roleid')
    if not userid or roleid != 3:
        return Response({'error': 'Unauthorized'}, status=401)
    data = request.data
    updates = data.get('updates', [])
    if not isinstance(updates, list):
        return Response({'error': 'updates must be a list'}, status=400)
    with connection.cursor() as cursor:
        for upd in updates:
            map_id = upd.get('map_id')
            new_status = upd.get('new_status')
            if map_id and new_status in ('joined', 'rejected'):
                cursor.execute('''
                    UPDATE resume_job_map SET status=%s, updated_at=NOW() WHERE map_id=%s
                ''', [new_status, map_id])
    return Response({'message': 'Statuses updated'}) 


# --- CANDIDATE EXAM LIFECYCLE ---
@csrf_exempt
@api_view(['POST'])
def candidate_start_exam_session(request):
    """
    Candidate starts an exam session. Candidate only.
    Expects: resume_id, requirement_id
    Creates exam_session with status 'in_progress'.
    """
    userid = request.session.get('userid')
    roleid = request.session.get('roleid')
    if not userid or roleid != 4:
        return Response({'error': 'Unauthorized'}, status=401)
    data = request.data
    resume_id = data.get('resume_id')
    requirement_id = data.get('requirement_id')
    if not resume_id or not requirement_id:
        return Response({'error': 'resume_id and requirement_id required'}, status=400)
    with connection.cursor() as cursor:
        # Check if session already exists
        cursor.execute('''
            SELECT session_id, status FROM exam_session WHERE user_id=%s AND resume_id=%s AND requirement_id=%s
        ''', [userid, resume_id, requirement_id])
        row = cursor.fetchone()
        if row:
            return Response({'session_id': row[0], 'status': row[1], 'message': 'Session already exists'})
        # Create new session
        cursor.execute('''
            INSERT INTO exam_session (user_id, resume_id, requirement_id, started_at, status, updated_at)
            VALUES (%s, %s, %s, NOW(), 'in_progress', NOW())
        ''', [userid, resume_id, requirement_id])
        cursor.execute('SELECT LAST_INSERT_ID()')
        session_id = cursor.fetchone()[0]
    return Response({'session_id': session_id, 'status': 'in_progress'})

@csrf_exempt
@api_view(['POST'])
def candidate_submit_exam_answers(request):
    """
    Candidate submits answers for an exam session. Candidate only.
    Expects: session_id, answers: [{question_id, answer_text}]
    Updates exam_session status to 'submitted'.
    """
    userid = request.session.get('userid')
    roleid = request.session.get('roleid')
    if not userid or roleid != 4:
        return Response({'error': 'Unauthorized'}, status=401)
    data = request.data
    session_id = data.get('session_id')
    answers = data.get('answers', [])
    if not session_id or not isinstance(answers, list):
        return Response({'error': 'session_id and answers required'}, status=400)
    with connection.cursor() as cursor:
        for ans in answers:
            question_id = ans.get('question_id')
            answer_text = ans.get('answer_text')
            if question_id and answer_text is not None:
                cursor.execute('''
                    INSERT INTO exam_answer (session_id, question_id, answer_text, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                ''', [session_id, question_id, answer_text])
        cursor.execute('''
            UPDATE exam_session SET status='submitted', completed_at=NOW(), updated_at=NOW() WHERE session_id=%s
        ''', [session_id])
    return Response({'message': 'Answers submitted'})

@csrf_exempt
@api_view(['GET'])
def candidate_exam_status(request, session_id):
    """
    Candidate views exam session status. Candidate only.
    """
    userid = request.session.get('userid')
    roleid = request.session.get('roleid')
    if not userid or roleid != 4:
        return Response({'error': 'Unauthorized'}, status=401)
    with connection.cursor() as cursor:
        cursor.execute('''
            SELECT status, started_at, completed_at FROM exam_session WHERE session_id=%s AND user_id=%s
        ''', [session_id, userid])
        row = cursor.fetchone()
        if not row:
            return Response({'error': 'Session not found'}, status=404)
        status, started_at, completed_at = row
    return Response({'status': status, 'started_at': started_at, 'completed_at': completed_at}) 