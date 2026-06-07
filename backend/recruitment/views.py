import os
import hashlib
from django.conf import settings
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from django.db import connection, transaction
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
import json
import logging
import re
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from .decorators import require_auth, require_role
from .services.ownership_service import OwnershipService
from .services.audit_logger import AuthzAuditLogger
from .services.audit_service import audit_service

# Configure logging
logger = logging.getLogger('recruitment')

# Instantiate security helpers
ownership = OwnershipService()
audit_logger = AuthzAuditLogger()

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
@require_auth
def dashboard(request):
    userid = request.scope.user_id
    roleid = request.scope.role_id
    return Response({'message': f'Welcome user {userid} with role {roleid}'})


# View for logout
@csrf_exempt
@api_view(['POST'])
def logout_api(request):
    request.session.flush()  # Clears session data
    return Response({'message': 'Logged out successfully', 'redirect': '../index.html'}) # Redirect to frontend index page


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


@csrf_exempt
@api_view(['POST'])
@require_role([1])
def register_api(request):
    data = request.data  # works with DRF

    hashed_pwd = make_password(data['password'])

    role_id = get_role_id(data['role'])
    warning_message = None

    with connection.cursor() as cursor:
        cursor.execute("""
            INSERT INTO users (first_name, last_name, username, password, roleid, email, phone_number, department, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data['first_name'], data['last_name'], data['username'],
            hashed_pwd, role_id, data['email'],
            data['phone_number'], data['department'], data['status']
        ))
        cursor.execute("SELECT LAST_INSERT_ID()")
        new_user_id = cursor.fetchone()[0]

        # If registering a Candidate, check for resume and link mapping
        if role_id == 4:
            cursor.execute("SELECT resume_id, resume_name FROM resume WHERE email = %s", [data['email']])
            resume_row = cursor.fetchone()
            if not resume_row:
                warning_message = "No matching resume record found for this email. Candidate may not be able to access exams."
            else:
                resume_id, resume_name = resume_row
                # Update all mapping entries for this candidate to status 'account_created' and set user_account_id
                cursor.execute("""
                    UPDATE resume_job_map 
                    SET user_account_id = %s, status = 'account_created', updated_at = CURRENT_TIMESTAMP
                    WHERE resume_id = %s
                """, [new_user_id, resume_id])

                # Create Notice for HR (role_id = 3)
                cursor.execute("""
                    INSERT INTO notices (title, message, notice_type, role_id)
                    VALUES (%s, %s, %s, %s)
                """, [
                    "Candidate Account Created",
                    f"Candidate user account for {data['first_name']} {data['last_name']} (Username: {data['username']}) has been successfully created. Temporary password communicated separately.",
                    "ACCOUNT_CREATED",
                    3  # HR role
                ])

                # Auto-mark Admin's EXAM_APPROVAL notices for this candidate as read
                action_url = f"/admin/users/add?email={data['email']}&role=candidate"
                cursor.execute("""
                    UPDATE notices SET is_read = 1 
                    WHERE notice_type = 'EXAM_APPROVAL' AND action_url = %s
                """, [action_url])

            connection.commit()

    # Log to audit log
    from recruitment.services.audit_service import audit_service
    audit_service.log(
        action='register_user',
        actor_id=request.scope.user_id,
        target_type='users',
        target_id=new_user_id,
        details={'username': data['username'], 'role': data['role']}
    )

    response_data = {'message': 'User created successfully'}
    if warning_message:
        response_data['warning'] = warning_message
    return Response(response_data)


# view for getting all users
@csrf_exempt
@api_view(['GET'])
@require_role([1])
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
@require_role([1])
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
@require_role([1])
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
@require_role([1])
def delete_user(request, userid):
    cursor = connection.cursor()
    cursor.execute("DELETE FROM users WHERE userid = %s", [userid])
    return Response({"message": "User deleted successfully"})


# View for getting user by id
@csrf_exempt
@api_view(['GET'])
@require_role([1])
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

def check_job_active(requirement_id):
    with connection.cursor() as cursor:
        cursor.execute("SELECT status FROM job_requirement WHERE requirement_id = %s", [requirement_id])
        row = cursor.fetchone()
        if not row:
            return False, 'Job requirement not found'
        if row[0] != 'ACTIVE':
            return False, f'Job requirement is not ACTIVE (current status: {row[0]})'
    return True, None


# Manager Section

## Job Creation


@csrf_exempt
@api_view(['GET'])
@require_auth
def get_positions(request):
    cursor = connection.cursor()
    cursor.execute("SELECT position_name FROM position_master")
    positions = [row[0] for row in cursor.fetchall()]
    return Response(positions)

@csrf_exempt
@api_view(['POST'])
@require_role([2])
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
@require_role([2])
def submit_job(request):
    try:
        userid = request.scope.user_id
        roleid = request.scope.role_id

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
@require_role([2])
def update_job(request):
    try:
        userid = request.scope.user_id
        roleid = request.scope.role_id
        
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
@require_auth
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
@require_auth
def check_session(request):
    return Response({
        'userid': request.scope.user_id,
        'roleid': request.scope.role_id
    })



# HR Filter Resume
@api_view(['GET'])
@require_auth
def list_job_requirements(request):
    user_id = request.scope.user_id
    role_id = request.scope.role_id
    show_deleted = request.GET.get('show_deleted') == 'true' and role_id == 1

    query = """
        SELECT 
            jr.requirement_id,
            pm.position_name,
            u.username,
            jr.experience_range,
            jr.created_at,
            jr.assigned_to,
            (SELECT username FROM users WHERE userid = jr.assigned_to) as assigned_username,
            jr.status,
            jr.closed_at,
            jr.closed_by
        FROM job_requirement jr
        JOIN position_master pm ON jr.position_id = pm.position_id
        JOIN users u ON jr.created_by = u.userid
        WHERE 1=1
    """
    params = []

    if not show_deleted:
        query += " AND jr.status <> 'DELETED'"
    
    if role_id == 3:  # HR: Show assigned to me + unassigned
        query += " AND (jr.assigned_to = %s OR jr.assigned_to IS NULL)"
        params.append(user_id)
    elif role_id == 2:  # Manager: Show only created by me
        query += " AND jr.created_by = %s"
        params.append(user_id)
        
    query += " ORDER BY jr.created_at DESC"

    with connection.cursor() as cursor:
        cursor.execute(query, params)
        results = cursor.fetchall()

    data = [
        {
            "requirement_id": row[0],
            "position": row[1],
            "created_by": row[2],
            "experience_range": row[3],
            "created_at": row[4].strftime("%Y-%m-%d %H:%M:%S") if row[4] else 'N/A',
            "assigned_to": row[5],
            "assigned_username": row[6],
            "status": row[7],
            "closed_at": row[8].strftime("%Y-%m-%d %H:%M:%S") if row[8] else None,
            "closed_by": row[9]
        }
        for row in results
    ]
    return Response(data)

@csrf_exempt
@api_view(['POST'])
@require_role([1, 3])
def assign_job_requirement(request):
    try:
        userid = request.scope.user_id
        roleid = request.scope.role_id

        requirement_id = request.data.get('requirement_id')
        if not requirement_id:
            return Response({'error': 'Requirement ID is required'}, status=400)

        with connection.cursor() as cursor:
            cursor.execute("SELECT assigned_to FROM job_requirement WHERE requirement_id = %s", [requirement_id])
            row = cursor.fetchone()
            if not row:
                return Response({'error': 'Job requirement not found'}, status=404)
            current_assigned_to = row[0]

            if roleid == 3:  # HR recruiter
                if current_assigned_to is not None and current_assigned_to != userid:
                    return Response({'error': 'Already claimed by another recruiter'}, status=403)
                assignee_id = userid
            elif roleid == 1:  # Admin
                target_user_id = request.data.get('target_user_id') or request.data.get('user_id') or request.data.get('assigned_to')
                if not target_user_id:
                    return Response({'error': 'Target user ID is required for admin reassignment'}, status=400)
                
                # Verify target user exists and is HR (role 3)
                cursor.execute("SELECT roleid FROM users WHERE userid = %s", [target_user_id])
                target_row = cursor.fetchone()
                if not target_row:
                    return Response({'error': 'Target recruiter user not found'}, status=404)
                if target_row[0] != 3:
                    return Response({'error': 'Jobs can only be assigned to HR recruiters'}, status=400)
                assignee_id = target_user_id
            else:
                return Response({'error': 'Access denied'}, status=403)

            cursor.execute("""
                UPDATE job_requirement
                SET assigned_to = %s
                WHERE requirement_id = %s
            """, [assignee_id, requirement_id])
            cursor.connection.commit()

        # Log to audit_log
        audit_service.log(
            action='claim_job' if roleid == 3 else 'admin_assign_job',
            actor_id=userid,
            target_type='job_requirement',
            target_id=requirement_id,
            details={'assigned_to': assignee_id, 'previous_assignee': current_assigned_to}
        )

        return Response({'message': 'Job requirement assigned successfully!'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@csrf_exempt
@api_view(['POST'])
@require_role([1, 3])
def unassign_job_requirement(request):
    try:
        userid = request.scope.user_id
        roleid = request.scope.role_id

        requirement_id = request.data.get('requirement_id')
        if not requirement_id:
            return Response({'error': 'Requirement ID is required'}, status=400)

        with connection.cursor() as cursor:
            cursor.execute("SELECT assigned_to FROM job_requirement WHERE requirement_id = %s", [requirement_id])
            row = cursor.fetchone()
            if not row:
                return Response({'error': 'Job requirement not found'}, status=404)
            current_assigned_to = row[0]

            if roleid == 3:  # HR recruiter
                if current_assigned_to != userid:
                    return Response({'error': 'You can only unassign your own claimed jobs'}, status=403)
            elif roleid != 1:  # Not Admin
                return Response({'error': 'Access denied'}, status=403)

            cursor.execute("""
                UPDATE job_requirement
                SET assigned_to = NULL
                WHERE requirement_id = %s
            """, [requirement_id])
            cursor.connection.commit()

        # Log to audit_log
        audit_service.log(
            action='unclaim_job' if roleid == 3 else 'admin_unassign_job',
            actor_id=userid,
            target_type='job_requirement',
            target_id=requirement_id,
            details={'previous_assignee': current_assigned_to}
        )

        return Response({'message': 'Job requirement unassigned successfully!'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@require_auth
def get_job_requirement_detail(request, requirement_id):
    try:
        user_id = request.scope.user_id
        role_id = request.scope.role_id

        if not ownership.can_view_requirement(user_id, role_id, requirement_id):
            audit_logger.log_403(request, 'ownership_denied', requirement_id)
            return Response({'error': 'Forbidden'}, status=403)

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
@require_role([3])
def upload_candidate_resume(request):
    try:
        name = request.POST.get('name')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        resume_file = request.FILES.get('resume')
        user_id = request.scope.user_id

        requirement_id = request.POST.get('requirement_id') or request.GET.get('requirement_id')
        if requirement_id:
            try:
                requirement_id = int(requirement_id)
                if not ownership.can_modify_requirement(user_id, request.scope.role_id, requirement_id):
                    audit_logger.log_403(request, 'ownership_denied', requirement_id)
                    return Response({'error': 'Forbidden'}, status=403)
                
                is_active, err_msg = check_job_active(requirement_id)
                if not is_active:
                    return Response({'error': err_msg}, status=400)
            except ValueError:
                pass

        if not name or not email or not phone or not resume_file:
            return Response({'error': 'Missing required fields'}, status=400)

        if not validate_email(email):
            return Response({'error': 'Invalid email format'}, status=400)

        if not re.match(r'^\d{10}$', phone):
            return Response({'error': 'Invalid phone number format'}, status=400)

        # ── Duplicate Detection (Layer 1 & 2) ──────────────────────────
        from recruitment.repositories.resume_repo import resume_repo

        # Layer 2: SHA-256 file hash
        file_bytes = resume_file.read()
        content_hash = hashlib.sha256(file_bytes).hexdigest()
        resume_file.seek(0)   # Reset file pointer after reading

        # Layer 1: email + hash check
        existing = resume_repo.find_by_email_or_hash(email, content_hash)
        if existing:
            return Response({
                'error':         'duplicate_candidate',
                'message':       'This candidate already exists in the system.',
                'existing_id':   existing['resume_id'],
                'existing_name': existing['resume_name'],
            }, status=409)

        # ── Save file ──────────────────────────────────────────────────
        fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, 'resumes'))
        filename = fs.save(resume_file.name, resume_file)
        file_path = f"resumes/{filename}"

        # ── Insert DB record ───────────────────────────────────────────
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO resume
                    (resume_name, email, phone_number, file_location,
                     created_by, uploaded_at, content_hash, parse_status)
                VALUES (%s, %s, %s, %s, %s, NOW(), %s, 'pending')
            """, [name, email, phone, file_path, user_id, content_hash])
            cursor.execute('SELECT LAST_INSERT_ID()')
            resume_id = cursor.fetchone()[0]

        # ── Dispatch async parse task ──────────────────────────────────
        try:
            from recruitment.tasks import parse_and_profile_resume
            parse_and_profile_resume.delay(resume_id)
            logger.info(f"Queued parse task for resume_id={resume_id}")
        except Exception as task_err:
            # Task queue unavailable (e.g. Redis not running) — log but don't fail upload
            logger.warning(
                f"Could not queue parse task for resume {resume_id}: {task_err}. "
                f"Parse status will remain 'pending'."
            )

        return Response({
            'message':   'Resume uploaded successfully! Parsing is in progress.',
            'resume_id': resume_id,
        })

    except Exception as e:
        logger.error(f"upload_candidate_resume error: {e}")
        return Response({'error': str(e)}, status=500)
    


@api_view(['GET'])
@require_role([3])
def get_recent_resumes(request):
    try:
        user_id = request.scope.user_id
        role_id = request.scope.role_id
        limit = int(request.GET.get('limit', 6))

        allowed_reqs = ownership.get_allowed_requirements(user_id, role_id)

        # Resumes where either no requirement mapped, or mapped requirement is allowed
        if allowed_reqs:
            placeholders = ','.join(['%s'] * len(allowed_reqs))
            query = f"""
                SELECT r.resume_id, r.resume_name, r.email, r.uploaded_at, r.file_location, rm.status, rm.map_id, rm.requirement_id
                FROM resume r
                LEFT JOIN resume_job_map rm ON r.resume_id = rm.resume_id
                WHERE rm.requirement_id IS NULL OR rm.requirement_id IN ({placeholders})
                ORDER BY r.uploaded_at DESC
                LIMIT %s
            """
            params = allowed_reqs + [limit]
        else:
            query = """
                SELECT r.resume_id, r.resume_name, r.email, r.uploaded_at, r.file_location, rm.status, rm.map_id, rm.requirement_id
                FROM resume r
                LEFT JOIN resume_job_map rm ON r.resume_id = rm.resume_id
                WHERE rm.requirement_id IS NULL
                ORDER BY r.uploaded_at DESC
                LIMIT %s
            """
            params = [limit]

        with connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()

        resumes = [{
            'id': row[0],
            'name': row[1],
            'email': row[2],
            'uploaded_at': row[3].strftime('%Y-%m-%d %H:%M:%S'),
            'file_url': request.build_absolute_uri(f"/media/{row[4]}"),
            'status': row[5],
            'map_id': row[6],
            'requirement_id': row[7]
        } for row in rows]

        return Response({'resumes': resumes})

    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

# User Profile
@csrf_exempt
@api_view(['GET'])
@require_auth
def user_profile(request):
    userid = request.scope.user_id

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


@csrf_exempt
@api_view(['POST'])
@require_role([3])
def evaluate_with_ai(request):
    """
    Trigger async AI evaluation for unevaluated resumes against a requirement.
    Returns immediately — evaluation runs in Celery background tasks.
    """
    try:
        try:
            requirement_id = int(request.data.get('requirement_id'))
        except (TypeError, ValueError):
            return Response({"message": "Invalid requirement ID."}, status=400)

        user_id = request.scope.user_id
        role_id = request.scope.role_id
        if not ownership.can_modify_requirement(user_id, role_id, requirement_id):
            audit_logger.log_403(request, 'ownership_denied', requirement_id)
            return Response({'error': 'Forbidden'}, status=403)

        is_active, err_msg = check_job_active(requirement_id)
        if not is_active:
            return Response({'error': err_msg}, status=400)

        batch_size = int(request.data.get('limit', 50))

        from recruitment.repositories.resume_repo import resume_repo
        from recruitment.tasks import run_ai_evaluation

        pending_resumes = resume_repo.list_pending_evaluation(requirement_id, batch_size)

        if not pending_resumes:
            return Response({
                "message": "No pending resumes found. All resumes may already be evaluated or still parsing.",
                "queued_count": 0
            }, status=200)

        # Dispatch one Celery task per resume (async, non-blocking)
        queued = 0
        for r in pending_resumes:
            try:
                run_ai_evaluation.delay(r['resume_id'], requirement_id, user_id)
                queued += 1
            except Exception as task_err:
                logger.error(f"Failed to queue evaluation for resume {r['resume_id']}: {task_err}")

        logger.info(
            f"Evaluation queued: {queued} resumes for requirement {requirement_id} by user {user_id}"
        )

        return Response({
            "message": f"Queued {queued} resumes for evaluation. Results will appear as they complete.",
            "queued_count": queued,
        }, status=202)

    except Exception as e:
        logger.error(f"evaluate_with_ai error: {e}")
        return Response({"message": f"Error: {str(e)}"}, status=500)


@api_view(['GET'])
@require_role([3])
def get_resumes_with_scores(request, requirement_id):
    user_id = request.scope.user_id
    role_id = request.scope.role_id

    if not ownership.can_view_requirement(user_id, role_id, requirement_id):
        audit_logger.log_403(request, 'ownership_denied', requirement_id)
        return Response({'error': 'Forbidden'}, status=403)

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
            "resume_url": request.build_absolute_uri(f"/media/{row[3]}"),
            "requirement_id": requirement_id
        }
        for row in results
    ]

    return Response({"resumes": resumes})

# Shortlist Resume
@csrf_exempt
@api_view(['POST'])
@require_role([3])
def shortlist_resumes(request):
    try:
        data = request.data  # Expected: [{resume_id, requirement_id}, ...]

        if not isinstance(data, list) or not data:
            return Response({"error": "Invalid payload format. Must be a non-empty list."}, status=400)

        user_id = request.scope.user_id
        role_id = request.scope.role_id

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

        if not ownership.can_modify_requirement(user_id, role_id, requirement_id):
            audit_logger.log_403(request, 'ownership_denied', requirement_id)
            return Response({'error': 'Forbidden'}, status=403)

        is_active, err_msg = check_job_active(requirement_id)
        if not is_active:
            return Response({'error': err_msg}, status=400)

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
@require_role([2])
def positions_with_shortlisted(request):
    try:
        user_id = request.scope.user_id

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
@require_role([2])
def get_shortlisted_candidates(request, requirement_id):
    try:
        user_id = request.scope.user_id
        role_id = request.scope.role_id

        # Centralized check
        if not ownership.can_view_requirement(user_id, role_id, requirement_id):
            audit_logger.log_403(request, 'ownership_denied', requirement_id)
            return Response({'error': 'Forbidden'}, status=403)

        # Debug logging
        print(f"get_shortlisted_candidates called with requirement_id: {requirement_id}")
        print(f"user_id: {user_id}")

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
                "resume_url": request.build_absolute_uri(f"/media/{row[3]}") if row[3] else None,
                "ai_score": row[4],
                "position_name": row[5]
            }
            for row in rows
        ]

        print(f"Returning {len(result)} candidates")
        print(f"Result: {result}")

        return Response(result)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

# Manager Shortlist Approvalt
@csrf_exempt
@api_view(['POST'])
@require_role([2])
def approve_shortlisted_candidates(request):
    try:
        # Accepts: {"candidate_ids": ["1", "2", ...], "requirement_id": "123"}
        candidate_ids = request.data.get('candidate_ids')
        requirement_id = request.data.get('requirement_id')
        user_id = request.scope.user_id
        role_id = request.scope.role_id

        if not requirement_id:
            return Response({"error": "Requirement ID is required."}, status=400)

        # Centralized check
        if not ownership.can_modify_requirement(user_id, role_id, int(requirement_id)):
            audit_logger.log_403(request, 'ownership_denied', requirement_id)
            return Response({'error': 'Forbidden'}, status=403)

        is_active, err_msg = check_job_active(int(requirement_id))
        if not is_active:
            return Response({'error': err_msg}, status=400)

        if not candidate_ids or not isinstance(candidate_ids, list):
            return Response({"error": "Invalid payload format. Must be a non-empty list of candidate_ids."}, status=400)

        # Convert all IDs to int for safety
        selected_ids = [int(cid) for cid in candidate_ids if cid]
        if not selected_ids:
            return Response({"error": "No valid resume IDs provided."}, status=400)

        placeholders = ','.join(['%s'] * len(selected_ids))
        with connection.cursor() as cursor:
            # Step 1: Approve selected resumes for exam
            cursor.execute(f"""
                UPDATE resume_job_map
                SET status = 'exam_approved',
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

            # Step 3: Fetch approved candidate details to create notices for Admin (role_id = 1)
            cursor.execute(f"""
                SELECT resume_id, resume_name, email FROM resume WHERE resume_id IN ({placeholders})
            """, selected_ids)
            approved_candidates = cursor.fetchall()

            for cand_id, name, email in approved_candidates:
                action_url = f"/admin/users/add?email={email}&role=candidate"
                # Prevent duplicate notices
                cursor.execute("""
                    SELECT COUNT(*) FROM notices 
                    WHERE notice_type = 'EXAM_APPROVAL' AND action_url = %s AND is_read = 0
                """, [action_url])
                if cursor.fetchone()[0] == 0:
                    cursor.execute("""
                        INSERT INTO notices (title, message, notice_type, role_id, action_url)
                        VALUES (%s, %s, %s, %s, %s)
                    """, [
                        "Candidate Approved for Exam",
                        f"Candidate {name} ({email}) has been approved for the exam of Job Requisition #{requirement_id}. Please create their candidate user account.",
                        "EXAM_APPROVAL",
                        1,  # Admin role
                        action_url
                    ])

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
@require_role([3])
def hr_list_candidates_for_interview(request):
    """
    List candidates with status 'approved' or 'exam_scored' for interview scheduling.
    Only HR (roleid=3) can access.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    allowed_reqs = ownership.get_allowed_requirements(userid, roleid)

    if not allowed_reqs:
        return Response({'candidates': []})

    placeholders = ','.join(['%s'] * len(allowed_reqs))
    with connection.cursor() as cursor:
        cursor.execute(f'''
            SELECT rjm.map_id, r.resume_id, r.resume_name, r.email, r.phone_number, rjm.status, rjm.exam_score
            FROM resume_job_map rjm
            JOIN resume r ON rjm.resume_id = r.resume_id
            WHERE rjm.status IN ('approved', 'exam_scored')
              AND rjm.requirement_id IN ({placeholders})
        ''', allowed_reqs)
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
@require_role([3])
def hr_schedule_interview(request):
    """
    Schedule an interview for a candidate (by map_id). HR only.
    Expects: map_id, interview_datetime (ISO string), interviewer (optional)
    Sets status to 'interview_scheduled'.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    data = request.data
    map_id = data.get('map_id')
    interview_datetime = data.get('interview_datetime')
    interviewer = data.get('interviewer', None)
    if not map_id or not interview_datetime:
        return Response({'error': 'map_id and interview_datetime required'}, status=400)

    if not ownership.can_schedule_interview(userid, roleid, map_id):
        audit_logger.log_403(request, 'ownership_denied', map_id)
        return Response({'error': 'Forbidden'}, status=403)

    with connection.cursor() as cursor:
        cursor.execute("SELECT requirement_id FROM resume_job_map WHERE map_id = %s", [map_id])
        row = cursor.fetchone()
        if not row:
            return Response({'error': 'Candidate mapping not found'}, status=404)
        requirement_id = row[0]
        
        is_active, err_msg = check_job_active(requirement_id)
        if not is_active:
            return Response({'error': err_msg}, status=400)

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
@require_role([3])
def hr_list_scheduled_interviews(request):
    """
    List all scheduled interviews (HR only).
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    allowed_reqs = ownership.get_allowed_requirements(userid, roleid)

    if not allowed_reqs:
        return Response({'interviews': []})

    placeholders = ','.join(['%s'] * len(allowed_reqs))
    with connection.cursor() as cursor:
        cursor.execute(f'''
            SELECT isch.schedule_id, isch.map_id, r.resume_name, isch.interview_datetime, isch.interviewer, isch.created_at
            FROM interview_schedule isch
            JOIN resume_job_map rjm ON isch.map_id = rjm.map_id
            JOIN resume r ON rjm.resume_id = r.resume_id
            WHERE rjm.requirement_id IN ({placeholders})
            ORDER BY isch.interview_datetime DESC
        ''', allowed_reqs)
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
@require_role([2])
def manager_list_candidates_performance(request, requirement_id):
    """
    List all candidates for a requirement with exam scores and status. Manager only.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id

    if not ownership.can_view_requirement(userid, roleid, requirement_id):
        audit_logger.log_403(request, 'ownership_denied', requirement_id)
        return Response({'error': 'Forbidden'}, status=403)

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
@require_role([2])
def manager_get_exam_answers(request, map_id):
    """
    Fetch detailed exam answers for a candidate (by map_id). Manager only.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id

    if not ownership.can_schedule_interview(userid, roleid, map_id):
        audit_logger.log_403(request, 'ownership_denied', map_id)
        return Response({'error': 'Forbidden'}, status=403)

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
@require_role([2])
def manager_update_exam_scores(request):
    """
    Update scores/feedback for exam answers. Manager only.
    Expects: session_id, answers: [{answer_id, score_awarded, is_correct}]
    Aggregates total score to resume_job_map.exam_score and updates status.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    data = request.data
    session_id = data.get('session_id')
    answers = data.get('answers', [])
    if not session_id or not isinstance(answers, list):
        return Response({'error': 'session_id and answers required'}, status=400)

    # Find requirement_id to verify ownership
    with connection.cursor() as cursor:
        cursor.execute("SELECT requirement_id FROM exam_session WHERE session_id = %s", [session_id])
        row = cursor.fetchone()
        if not row:
            return Response({'error': 'Exam session not found'}, status=404)
        requirement_id = row[0]

    if not ownership.can_modify_requirement(userid, roleid, requirement_id):
        audit_logger.log_403(request, 'ownership_denied', requirement_id)
        return Response({'error': 'Forbidden'}, status=403)

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
@require_role([3])
def hr_list_finalised_candidates(request):
    """
    List all candidates with status 'finalised'. HR only.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    allowed_reqs = ownership.get_allowed_requirements(userid, roleid)

    if not allowed_reqs:
        return Response({'candidates': []})

    placeholders = ','.join(['%s'] * len(allowed_reqs))
    with connection.cursor() as cursor:
        cursor.execute(f'''
            SELECT rjm.map_id, r.resume_id, r.resume_name, r.email, rjm.status, rjm.finalised_at
            FROM resume_job_map rjm
            JOIN resume r ON rjm.resume_id = r.resume_id
            WHERE rjm.status = 'finalised'
              AND rjm.requirement_id IN ({placeholders})
        ''', allowed_reqs)
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
@require_role([3])
def hr_update_finalised_status(request):
    """
    Bulk update status for finalised candidates. HR only.
    Expects: updates: [{map_id, new_status}] (new_status: 'joined' or 'rejected')
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    data = request.data
    updates = data.get('updates', [])
    if not isinstance(updates, list):
        return Response({'error': 'updates must be a list'}, status=400)

    # First, verify ownership of all map_ids
    for upd in updates:
        map_id = upd.get('map_id')
        if map_id:
            if not ownership.can_update_pipeline(userid, roleid, map_id):
                audit_logger.log_403(request, 'ownership_denied', map_id)
                return Response({'error': f'Forbidden: ownership violation on mapping {map_id}'}, status=403)

    from recruitment.repositories.candidate_repo import candidate_repo
    try:
        with transaction.atomic():
            for upd in updates:
                map_id = upd.get('map_id')
                new_status = upd.get('new_status')
                if map_id and new_status in ('joined', 'rejected'):
                    candidate_repo.update_status(map_id, new_status, userid)
    except PermissionError as pe:
        return Response({'error': str(pe)}, status=403)
    except ValueError as ve:
        return Response({'error': str(ve)}, status=400)

    return Response({'message': 'Statuses updated'}) 


# --- CANDIDATE EXAM LIFECYCLE ---
@csrf_exempt
@api_view(['POST'])
@require_role([4])
def candidate_start_exam_session(request):
    """
    Candidate starts an exam session. Candidate only.
    Expects: resume_id, requirement_id
    Creates exam_session with status 'in_progress'.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    data = request.data
    resume_id = data.get('resume_id')
    requirement_id = data.get('requirement_id')
    if not resume_id or not requirement_id:
        return Response({'error': 'resume_id and requirement_id required'}, status=400)

    is_active, err_msg = check_job_active(requirement_id)
    if not is_active:
        return Response({'error': err_msg}, status=400)

    from recruitment.services.audit_service import audit_service
    from django.utils import timezone
    import datetime

    with connection.cursor() as cursor:
        # 1. Enforce that candidate matches user_account_id in resume_job_map
        cursor.execute("""
            SELECT status, user_account_id FROM resume_job_map 
            WHERE resume_id = %s AND requirement_id = %s
        """, [resume_id, requirement_id])
        map_row = cursor.fetchone()
        if not map_row:
            return Response({'error': 'Candidate requirement mapping not found'}, status=404)
        
        map_status, user_account_id = map_row
        if user_account_id != userid:
            audit_logger.log_403(request, 'exam_start_forbidden_user', f"candidate={userid} mapping_user={user_account_id}")
            return Response({'error': 'Forbidden: You are not authorized for this exam session.'}, status=403)

        # 2. Check if a session already exists for this candidate/requirement
        cursor.execute('''
            SELECT session_id, status, expires_at FROM exam_session 
            WHERE user_id=%s AND resume_id=%s AND requirement_id=%s
        ''', [userid, resume_id, requirement_id])
        session_row = cursor.fetchone()
        
        if session_row:
            session_id, session_status, expires_at = session_row
            
            # Determine if current session is expired
            if expires_at:
                if timezone.is_aware(expires_at):
                    is_expired = timezone.now() > expires_at
                else:
                    if settings.USE_TZ:
                        is_expired = timezone.now().replace(tzinfo=None) > expires_at
                    else:
                        is_expired = datetime.datetime.now() > expires_at
            else:
                is_expired = False

            if session_status == 'in_progress':
                if is_expired:
                    # Mark expired session as submitted/timeout
                    with transaction.atomic():
                        cursor.execute("""
                            UPDATE exam_session SET status='submitted', completed_at=%s, updated_at=NOW() WHERE session_id=%s
                        """, [expires_at, session_id])
                        cursor.execute("""
                            UPDATE resume_job_map SET status='exam_submitted', updated_at=NOW() WHERE resume_id=%s AND requirement_id=%s
                        """, [resume_id, requirement_id])
                        
                        audit_service.log(
                            action='exam_timeout',
                            actor_id=userid,
                            target_type='exam_session',
                            target_id=session_id,
                            details={'message': 'Exam expired before submission'}
                        )
                    return Response({'error': 'Exam session has expired.'}, status=400)
                else:
                    return Response({
                        'session_id': session_id, 
                        'status': 'in_progress', 
                        'expires_at': expires_at.isoformat() if expires_at else None,
                        'message': 'Session already exists'
                    })
            else:
                return Response({'error': f'Exam session already completed with status: {session_status}'}, status=400)

        # 3. Verify candidate's pipeline status is approved, exam_pending, exam_approved, or account_created
        if map_status not in ('approved', 'exam_pending', 'exam_approved', 'account_created'):
            return Response({'error': f'Cannot start exam. Candidate pipeline status is {map_status}.'}, status=400)

        # 4. Fetch configurable exam duration
        cursor.execute("""
            SELECT exam_duration_minutes FROM job_requirement WHERE requirement_id = %s
        """, [requirement_id])
        dur_row = cursor.fetchone()
        duration_mins = dur_row[0] if (dur_row and dur_row[0] is not None) else 60

        # 5. Create new session setting expires_at
        now = timezone.now()
        expires_at = now + datetime.timedelta(minutes=duration_mins)
        
        with transaction.atomic():
            cursor.execute('''
                INSERT INTO exam_session (user_id, resume_id, requirement_id, started_at, expires_at, status, updated_at)
                VALUES (%s, %s, %s, %s, %s, 'in_progress', %s)
            ''', [userid, resume_id, requirement_id, now, expires_at, now])
            cursor.execute('SELECT LAST_INSERT_ID()')
            session_id = cursor.fetchone()[0]
            
            cursor.execute("""
                UPDATE resume_job_map SET status='exam_started', updated_at=NOW() WHERE resume_id=%s AND requirement_id=%s
            """, [resume_id, requirement_id])
            
            audit_service.log(
                action='start_exam_session',
                actor_id=userid,
                target_type='exam_session',
                target_id=session_id,
                details={'expires_at': expires_at.isoformat()}
            )
            
    return Response({'session_id': session_id, 'status': 'in_progress', 'expires_at': expires_at.isoformat()})

@csrf_exempt
@api_view(['POST'])
@require_role([4])
def candidate_submit_exam_answers(request):
    """
    Candidate submits answers for an exam session. Candidate only.
    Expects: session_id, answers: [{question_id, answer_text}]
    Updates exam_session status to 'submitted'.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    data = request.data
    session_id = data.get('session_id')
    answers = data.get('answers', [])
    if not session_id or not isinstance(answers, list):
        return Response({'error': 'session_id and answers required'}, status=400)

    from recruitment.services.audit_service import audit_service
    from django.utils import timezone
    import datetime

    try:
        # Wrap everything in a transaction block to enforce SELECT FOR UPDATE locking
        with transaction.atomic():
            with connection.cursor() as cursor:
                # Row lock the exam session during submission
                cursor.execute("""
                    SELECT user_id, status, expires_at, resume_id, requirement_id 
                    FROM exam_session 
                    WHERE session_id = %s FOR UPDATE
                """, [session_id])
                row = cursor.fetchone()
                if not row:
                    return Response({'error': 'Exam session not found'}, status=404)
                
                session_user_id, session_status, expires_at, resume_id, requirement_id = row
                
                # Verify ownership
                if session_user_id != userid:
                    audit_logger.log_403(request, 'exam_submit_forbidden_user', f"candidate={userid} session_user={session_user_id}")
                    return Response({'error': 'Forbidden: You do not own this exam session.'}, status=403)
                
                # Verify status
                if session_status != 'in_progress':
                    return Response({'error': f'Exam session is not in progress (status: {session_status})'}, status=400)

                # Check expiration
                if expires_at:
                    if timezone.is_aware(expires_at):
                        is_expired = timezone.now() > expires_at
                    else:
                        if settings.USE_TZ:
                            is_expired = timezone.now().replace(tzinfo=None) > expires_at
                        else:
                            is_expired = datetime.datetime.now() > expires_at
                else:
                    is_expired = False

                if is_expired:
                    # Expired session
                    cursor.execute("""
                        UPDATE exam_session SET status='submitted', completed_at=%s, updated_at=NOW() WHERE session_id=%s
                    """, [expires_at, session_id])
                    cursor.execute("""
                        UPDATE resume_job_map SET status='exam_submitted', updated_at=NOW() WHERE resume_id=%s AND requirement_id=%s
                    """, [resume_id, requirement_id])
                    
                    action = 'exam_abandoned' if not answers else 'exam_timeout'
                    audit_service.log(
                        action=action,
                        actor_id=userid,
                        target_type='exam_session',
                        target_id=session_id,
                        details={'message': f'Exam expired. Submitted with {len(answers)} answers.'}
                    )
                    return Response({'error': 'Exam session has expired and cannot accept further submissions.'}, status=400)

                # Insert normal answers
                for ans in answers:
                    question_id = ans.get('question_id')
                    answer_text = ans.get('answer_text')
                    if question_id and answer_text is not None:
                        cursor.execute('''
                            INSERT INTO exam_answer (session_id, question_id, answer_text, created_at, updated_at)
                            VALUES (%s, %s, %s, NOW(), NOW())
                        ''', [session_id, question_id, answer_text])

                # Update status
                cursor.execute('''
                    UPDATE exam_session SET status='submitted', completed_at=NOW(), updated_at=NOW() WHERE session_id=%s
                ''', [session_id])
                
                cursor.execute("""
                    UPDATE resume_job_map SET status='exam_submitted', updated_at=NOW() WHERE resume_id=%s AND requirement_id=%s
                """, [resume_id, requirement_id])

                # Log audit trail
                audit_service.log(
                    action='submit_exam_answers',
                    actor_id=userid,
                    target_type='exam_session',
                    target_id=session_id,
                    details={'answers_count': len(answers)}
                )

        return Response({'message': 'Answers submitted'})
    except Exception as e:
        logger.error(f"candidate_submit_exam_answers error: {e}")
        return Response({'error': str(e)}, status=500)

@csrf_exempt
@api_view(['GET'])
@require_role([4])
def candidate_exam_status(request, session_id):
    """
    Candidate views exam session status. Candidate only.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    with connection.cursor() as cursor:
        cursor.execute('''
            SELECT status, started_at, completed_at FROM exam_session WHERE session_id=%s AND user_id=%s
        ''', [session_id, userid])
        row = cursor.fetchone()
        if not row:
            return Response({'error': 'Session not found'}, status=404)
        status, started_at, completed_at = row
    return Response({'status': status, 'started_at': started_at, 'completed_at': completed_at})


# =============================================================================
# NEW ENDPOINTS — Phase 3–8
# =============================================================================

# ─── Evaluation Progress ────────────────────────────────────────────────────

@api_view(['GET'])
@require_auth
def evaluation_status(request, requirement_id):
    """
    Poll the progress of async AI evaluation for a requirement.
    Frontend uses this to show a progress bar after triggering evaluate_with_ai.
    """
    user_id = request.scope.user_id
    role_id = request.scope.role_id
    if not ownership.can_view_requirement(user_id, role_id, int(requirement_id)):
        audit_logger.log_403(request, 'ownership_denied', requirement_id)
        return Response({'error': 'Forbidden'}, status=403)

    try:
        from recruitment.repositories.candidate_repo import candidate_repo
        progress = candidate_repo.get_evaluation_progress(requirement_id)
        return Response(progress)
    except Exception as e:
        logger.error(f"evaluation_status error: {e}")
        return Response({'error': str(e)}, status=500)


# ─── Candidate Search Engine ─────────────────────────────────────────────────

@api_view(['GET'])
@require_role([2, 3])
def search_candidates(request):
    """
    Search parsed candidate profiles by skills, experience, and education.
    Results are ranked by skill match percentage.

    Query params:
        skills          comma-separated  e.g. Python,FastAPI
        experience_min  float            e.g. 2
        experience_max  float            e.g. 5
        education       str              e.g. B.Tech
        requirement_id  int (optional)   restrict to an evaluated pool
        limit           int (default 20)
        offset          int (default 0)
    """
    skills_param = request.GET.get('skills', '')
    skills = [s.strip() for s in skills_param.split(',') if s.strip()] if skills_param else []

    experience_min = request.GET.get('experience_min')
    experience_max = request.GET.get('experience_max')
    education = request.GET.get('education', '')
    requirement_id = request.GET.get('requirement_id')
    limit = int(request.GET.get('limit', 20))
    offset = int(request.GET.get('offset', 0))

    user_id = request.scope.user_id
    role_id = request.scope.role_id

    req_ids_filter = None
    if role_id == 2:  # Manager
        if requirement_id:
            if not ownership.can_view_requirement(user_id, role_id, int(requirement_id)):
                return Response({'error': 'Forbidden'}, status=403)
        else:
            req_ids_filter = ownership.get_allowed_requirements(user_id, role_id)
            if not req_ids_filter:
                return Response({'results': [], 'total': 0})
    elif role_id == 3:  # HR
        if requirement_id:
            if not ownership.can_view_requirement(user_id, role_id, int(requirement_id)):
                return Response({'error': 'Forbidden'}, status=403)

    try:
        from recruitment.services.search_service import search_service
        result = search_service.search(
            skills=skills,
            experience_min=float(experience_min) if experience_min else None,
            experience_max=float(experience_max) if experience_max else None,
            education=education or None,
            requirement_id=int(requirement_id) if requirement_id else None,
            requirement_ids=req_ids_filter,
            limit=limit,
            offset=offset,
        )
        return Response(result)
    except Exception as e:
        logger.error(f"search_candidates error: {e}")
        return Response({'error': str(e)}, status=500)



# ─── Candidate AI Details (for CandidateDrawer) ──────────────────────────────

@api_view(['GET'])
@require_role([2, 3])
def candidate_ai_details(request, resume_id):
    """
    Return the full AI score breakdown, percentage-based skill matrix,
    hiring recommendations (decision support), and interviewer pack.
    """
    requirement_id = request.GET.get('requirement_id')
    if not requirement_id:
        return Response({'error': 'requirement_id query param is required'}, status=400)

    user_id = request.scope.user_id
    role_id = request.scope.role_id
    if not ownership.can_view_requirement(user_id, role_id, int(requirement_id)):
        audit_logger.log_403(request, 'ownership_denied', requirement_id)
        return Response({'error': 'Forbidden'}, status=403)

    try:
        from recruitment.repositories.candidate_repo import candidate_repo
        details = candidate_repo.get_ai_details(resume_id, int(requirement_id))
        if not details:
            return Response({'error': 'Evaluation not found'}, status=404)

        # Fetch job requirement details (skills and weights)
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT sm.skill_name FROM job_skill js
                JOIN skill_master sm ON js.skill_id = sm.skill_id
                WHERE js.requirement_id = %s
            """, [requirement_id])
            required_skills = [r[0] for r in cursor.fetchall()]

            cursor.execute("""
                SELECT resume_weight, exam_weight FROM job_requirement
                WHERE requirement_id = %s
            """, [requirement_id])
            row = cursor.fetchone()
            resume_weight = row[0] if row else 50
            exam_weight = row[1] if row else 50

            cursor.execute("""
                SELECT exam_score, map_id FROM resume_job_map
                WHERE resume_id = %s AND requirement_id = %s
            """, [resume_id, requirement_id])
            score_row = cursor.fetchone()
            exam_score = float(score_row[0]) if (score_row and score_row[0] is not None) else None
            map_id = score_row[1] if score_row else None

        # Build Skill Matrix
        matched_skills = details.get('matched_skills', [])
        missing_skills = details.get('missing_skills', [])
        extracted_skills = details.get('extracted_skills', [])

        matched_set = {s.lower() for s in matched_skills}
        missing_set = {s.lower() for s in missing_skills}
        extracted_set = {s.lower() for s in extracted_skills}

        skill_matrix = []
        for req_skill in required_skills:
            req_skill_lower = req_skill.lower()
            if req_skill_lower in matched_set:
                pct = 100
            elif req_skill_lower in extracted_set:
                pct = 70  # Partial match
            elif any(req_skill_lower in s or s in req_skill_lower for s in extracted_set):
                pct = 70  # Related partial match
            else:
                pct = 0
            skill_matrix.append({
                'name': req_skill,
                'required': True,
                'match': pct
            })

        # Add nice-to-have candidate skills
        for ext_skill in extracted_skills:
            ext_skill_lower = ext_skill.lower()
            if ext_skill_lower not in {s.lower() for s in required_skills} and ext_skill_lower in matched_set:
                skill_matrix.append({
                    'name': ext_skill,
                    'required': False,
                    'match': 100
                })

        # Compute overall skill match percentage
        total_req = len(required_skills)
        if total_req > 0:
            matched_req = len([sm for sm in skill_matrix if sm['required'] and sm['match'] == 100])
            partial_req = len([sm for sm in skill_matrix if sm['required'] and sm['match'] == 70])
            skill_match_pct = round(((matched_req + 0.7 * partial_req) / total_req) * 100)
        else:
            skill_match_pct = 100

        # Dynamic Recommendation Engine (Decision Support)
        resume_score = details.get('score', 0.0) or 0.0
        factors = []
        
        if exam_score is None:
            # Weighted recommendation with exam pending
            rec = 'Interview Pending'
            conf = 'N/A'
            factors.append(f"Resume score: {resume_score:.1f}% (Weight: {resume_weight}%)")
            factors.append(f"Exam score is pending (Weight: {exam_weight}%)")
            factors.append("Hiring recommendation is suspended until the exam is completed and scored.")
        else:
            weighted_score = (resume_score * resume_weight + exam_score * exam_weight) / 100.0
            if weighted_score >= 80:
                rec = 'Strong Hire'
                conf = 'High'
            elif weighted_score >= 70:
                rec = 'Hire'
                conf = 'High'
            elif weighted_score >= 60:
                rec = 'Hold'
                conf = 'High'
            else:
                rec = 'Reject'
                conf = 'High'

            factors.append(f"Combined weighted score of {weighted_score:.1f}% meets target")
            factors.append(f"Resume credentials: {resume_score:.1f}% (Weight: {resume_weight}%)")
            factors.append(f"Technical exam score: {exam_score:.1f}% (Weight: {exam_weight}%)")
            factors.append(f"Matched {len(matched_skills)}/{total_req} required skills")

        details['skill_matrix'] = skill_matrix
        details['overall_skill_match'] = skill_match_pct
        details['exam_score'] = exam_score
        details['map_id'] = map_id
        details['hiring_recommendation'] = {
            'recommendation': rec,
            'confidence': conf,
            'factors': factors
        }

        # Retrieve AI generated interview questions (candidate-specific from evaluation summary)
        suggested_questions = []
        try:
            ai_data = json.loads(details.get('ai_summary', '{}'))
            if isinstance(ai_data, dict):
                suggested_questions = ai_data.get('suggested_questions', [])
                details['ai_summary'] = ai_data.get('summary', details.get('ai_summary'))
        except Exception:
            pass
        
        if not suggested_questions:
            suggested_questions = [
                f"Describe your experience working with {', '.join(matched_skills[:3]) or 'software engineering stack'}.",
                f"Can you explain why you haven't worked with {', '.join(missing_skills[:2]) or 'the required job tools'} and how you plan to bridge that gap?",
                "What was the most challenging technical project you built, and how did you design its architecture?"
            ]
        details['suggested_questions'] = suggested_questions

        return Response(details)
    except Exception as e:
        logger.error(f"candidate_ai_details error: {e}")
        return Response({'error': str(e)}, status=500)


# ─── Audit Trail (for Activity Timeline) ────────────────────────────────────

@api_view(['GET'])
@require_auth
def audit_log_timeline(request, target_type, target_id):
    """
    Return the activity timeline for a target entity.
    Used by: CandidateDrawer activity feed.
    target_type examples: 'resume', 'job_requirement', 'interview'
    """
    user_id = request.scope.user_id
    role_id = request.scope.role_id

    # Enforce isolation on audit log timeline
    if target_type == 'resume' and not ownership.can_view_resume(user_id, role_id, target_id):
        audit_logger.log_403(request, 'ownership_denied', target_id)
        return Response({'error': 'Forbidden'}, status=403)
    elif target_type == 'job_requirement' and not ownership.can_view_requirement(user_id, role_id, target_id):
        audit_logger.log_403(request, 'ownership_denied', target_id)
        return Response({'error': 'Forbidden'}, status=403)
    # If target_type is interview, we'll allow it for now if they are logged in since it maps to a candidate.

    limit = int(request.GET.get('limit', 50))

    try:
        from recruitment.services.audit_service import audit_service
        timeline = audit_service.get_timeline(target_type, int(target_id), limit)
        return Response({'timeline': timeline, 'count': len(timeline)})
    except Exception as e:
        logger.error(f"audit_log_timeline error: {e}")
        return Response({'error': str(e)}, status=500)


# ─── AI Exam Question Generation ─────────────────────────────────────────────

@csrf_exempt
@api_view(['POST'])
@require_role([3])
def generate_exam_questions(request):
    """
    Generate AI-powered exam questions for a job requirement.
    HR only. Requires GEMINI_API_KEY.
    """
    requirement_id = request.data.get('requirement_id')
    num_technical = int(request.data.get('num_technical', 6))
    num_problem_solving = int(request.data.get('num_problem_solving', 2))
    num_behavioral = int(request.data.get('num_behavioral', 2))
    difficulty = request.data.get('difficulty', 'medium')

    if not requirement_id:
        return Response({'error': 'requirement_id is required'}, status=400)

    user_id = request.scope.user_id
    role_id = request.scope.role_id
    if not ownership.can_modify_requirement(user_id, role_id, int(requirement_id)):
        audit_logger.log_403(request, 'ownership_denied', requirement_id)
        return Response({'error': 'Forbidden'}, status=403)

    try:
        # Get position and skills for this requirement
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT pm.position_name
                FROM job_requirement jr
                JOIN position_master pm ON jr.position_id = pm.position_id
                WHERE jr.requirement_id = %s
            """, [requirement_id])
            row = cursor.fetchone()
            if not row:
                return Response({'error': 'Requirement not found'}, status=404)
            position = row[0]

            cursor.execute("""
                SELECT sm.skill_name FROM job_skill js
                JOIN skill_master sm ON js.skill_id = sm.skill_id
                WHERE js.requirement_id = %s
            """, [requirement_id])
            skills = [r[0] for r in cursor.fetchall()]

        from recruitment.services.ai_service import get_ai_service
        ai = get_ai_service()
        if not ai:
            return Response({'error': 'AI service unavailable. Check GEMINI_API_KEY.'}, status=503)

        questions = ai.generate_exam_questions(
            position,
            skills,
            num_technical=num_technical,
            num_problem_solving=num_problem_solving,
            num_behavioral=num_behavioral,
            difficulty=difficulty
        )

        if not questions:
            return Response({'error': 'AI returned no questions. Try again.'}, status=500)

        # Store generated questions in question_bank table
        stored = []
        with connection.cursor() as cursor:
            for q in questions:
                options_json = json.dumps(q.get('options')) if q.get('options') else None
                cursor.execute("""
                    INSERT INTO question_bank
                        (requirement_id, text, type, options, correct_answer, category, skill, difficulty, source, status, created_by, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'AI', 'draft', %s, NOW())
                """, [
                    requirement_id,
                    q.get('text', ''),
                    q.get('type', 'open_ended'),
                    options_json,
                    q.get('correct_answer'),
                    q.get('category', 'Technical'),
                    q.get('skill', ''),
                    difficulty,
                    user_id
                ])
                cursor.execute("SELECT LAST_INSERT_ID()")
                question_id = cursor.fetchone()[0]
                
                stored.append({
                    'question_id': question_id,
                    'text': q.get('text', ''),
                    'type': q.get('type', 'open_ended'),
                    'options': q.get('options'),
                    'correct_answer': q.get('correct_answer'),
                    'category': q.get('category', 'Technical'),
                    'skill': q.get('skill', ''),
                    'difficulty': difficulty,
                    'status': 'draft'
                })

        logger.info(f"Generated {len(stored)} draft exam questions for requirement {requirement_id}")
        return Response({'questions': stored, 'count': len(stored)})

    except Exception as e:
        logger.error(f"generate_exam_questions error: {e}")
        return Response({'error': str(e)}, status=500)


# ─── RAG-Powered Recruiter Copilot ───────────────────────────────────────────

@csrf_exempt
@api_view(['POST'])
@require_auth
def copilot_chat(request):
    """
    AI Recruiter Copilot — answers recruiter questions using RAG.
    Retrieves relevant candidate/job data from DB before calling Gemini.
    """
    message = request.data.get('message', '').strip()
    context = request.data.get('context', {})
    requirement_id = context.get('requirement_id')

    if not message:
        return Response({'error': 'message is required'}, status=400)

    user_id = request.scope.user_id
    role_id = request.scope.role_id
    if requirement_id:
        if not ownership.can_view_requirement(user_id, role_id, int(requirement_id)):
            audit_logger.log_403(request, 'ownership_denied', requirement_id)
            return Response({'error': 'Forbidden'}, status=403)

    try:
        from recruitment.services.rag_service import rag_service
        reply = rag_service.answer(message, requirement_id)
        return Response({'reply': reply})
    except Exception as e:
        logger.error(f"copilot_chat error: {e}")
        return Response({'error': str(e)}, status=500)


# ─── Pipeline Board ──────────────────────────────────────────────────────────

@api_view(['GET'])
@require_auth
def pipeline_stages(request):
    """
    Return candidate counts by pipeline stage for the Kanban board.
    Optionally filter by requirement_id.
    """
    user_id = request.scope.user_id
    role_id = request.scope.role_id
    requirement_id = request.GET.get('requirement_id')

    if requirement_id:
        if not ownership.can_view_requirement(user_id, role_id, int(requirement_id)):
            audit_logger.log_403(request, 'ownership_denied', requirement_id)
            return Response({'error': 'Forbidden'}, status=403)
    else:
        allowed_reqs = ownership.get_allowed_requirements(user_id, role_id)
        if not allowed_reqs:
            stage_order = [
                'evaluated', 'shortlisted', 'approved', 'rejected',
                'interview_scheduled', 'exam_scored', 'finalised', 'joined',
            ]
            stages = {stage: {'count': 0, 'candidates': []} for stage in stage_order}
            return Response({'stages': stages, 'order': stage_order})

    try:
        with connection.cursor() as cursor:
            if requirement_id:
                cursor.execute("""
                    SELECT
                        rjm.status,
                        COUNT(*) as count,
                        GROUP_CONCAT(r.resume_name ORDER BY rjm.score DESC SEPARATOR '||') as names,
                        GROUP_CONCAT(rjm.score ORDER BY rjm.score DESC SEPARATOR ',') as scores,
                        GROUP_CONCAT(rjm.resume_id ORDER BY rjm.score DESC SEPARATOR ',') as ids
                    FROM resume_job_map rjm
                    JOIN resume r ON rjm.resume_id = r.resume_id
                    WHERE rjm.requirement_id = %s
                    GROUP BY rjm.status
                """, [requirement_id])
            else:
                placeholders = ','.join(['%s'] * len(allowed_reqs))
                cursor.execute(f"""
                    SELECT status, COUNT(*) as count, NULL, NULL, NULL
                    FROM resume_job_map
                    WHERE requirement_id IN ({placeholders})
                    GROUP BY status
                """, allowed_reqs)
            rows = cursor.fetchall()

        stage_order = [
            'evaluated', 'shortlisted', 'approved', 'rejected',
            'interview_scheduled', 'exam_scored', 'finalised', 'joined',
        ]

        stages = {}
        for row in rows:
            status = row[0]
            candidates = []
            if row[2]:
                names = row[2].split('||')
                scores = row[3].split(',') if row[3] else []
                ids = row[4].split(',') if row[4] else []
                for i, name in enumerate(names):
                    candidates.append({
                        'name': name,
                        'score': float(scores[i]) if i < len(scores) and scores[i] else None,
                        'resume_id': int(ids[i]) if i < len(ids) and ids[i] else None,
                    })
            stages[status] = {'count': row[1], 'candidates': candidates}

        # Fill missing stages with zeros
        for stage in stage_order:
            if stage not in stages:
                stages[stage] = {'count': 0, 'candidates': []}

        return Response({'stages': stages, 'order': stage_order})

    except Exception as e:
        logger.error(f"pipeline_stages error: {e}")
        return Response({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
@require_role([1, 2, 3])
def pipeline_move(request):
    """
    Move a candidate to a different pipeline stage.
    Logs the action to audit_log.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    map_id = request.data.get('map_id')
    new_status = request.data.get('new_status')

    VALID_STATUSES = [
        'evaluated', 'shortlisted', 'approved', 'rejected',
        'interview_scheduled', 'exam_scored', 'finalised', 'joined',
    ]

    if not map_id or not new_status:
        return Response({'error': 'map_id and new_status are required'}, status=400)

    if new_status not in VALID_STATUSES:
        return Response({'error': f'Invalid status. Must be one of: {VALID_STATUSES}'}, status=400)

    if not ownership.can_update_pipeline(userid, roleid, map_id):
        audit_logger.log_403(request, 'ownership_denied', map_id)
        return Response({'error': 'Forbidden'}, status=403)

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT status FROM resume_job_map WHERE map_id = %s", [map_id])
            row = cursor.fetchone()
            if not row:
                return Response({'error': 'Mapping not found'}, status=404)
            current_status = row[0]

        is_valid, err_msg = ownership.validate_transition(current_status, new_status, role_id=roleid)
        if not is_valid:
            audit_logger.log_transition_denied(request, map_id, current_status, new_status)
            if err_msg and "Finalized" in err_msg:
                return Response({'error': err_msg}, status=403)
            return Response({'error': err_msg}, status=400)

        from recruitment.repositories.candidate_repo import candidate_repo
        from recruitment.services.audit_service import audit_service

        try:
            candidate_repo.update_status(map_id, new_status, userid)
        except PermissionError as pe:
            return Response({'error': str(pe)}, status=403)
        except ValueError as ve:
            return Response({'error': str(ve)}, status=400)

        audit_service.log(
            action=f'pipeline_move_{new_status}',
            actor_id=userid,
            target_type='resume_job_map',
            target_id=int(map_id),
            details={'new_status': new_status},
        )

        return Response({'message': f'Candidate moved to {new_status}'})
    except Exception as e:
        logger.error(f"pipeline_move error: {e}")
        return Response({'error': str(e)}, status=500)


# --- QUESTION BANK MANAGEMENT ENDPOINTS ---

@csrf_exempt
@api_view(['GET'])
@require_role([3]) # HR only
def hr_list_question_bank(request):
    """
    List all questions in the question bank. HR only.
    Can filter by requirement_id, status, skill, difficulty.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    
    requirement_id = request.GET.get('requirement_id')
    status = request.GET.get('status')
    skill = request.GET.get('skill')
    difficulty = request.GET.get('difficulty')

    if requirement_id:
        if not ownership.can_view_requirement(userid, roleid, int(requirement_id)):
            return Response({'error': 'Forbidden'}, status=403)

    query = """
        SELECT question_id, requirement_id, text, type, options, correct_answer, 
               skill, difficulty, category, source, status, created_by, approved_by, created_at
        FROM question_bank
        WHERE 1=1
    """
    params = []

    if requirement_id:
        query += " AND requirement_id = %s"
        params.append(int(requirement_id))
    if status:
        query += " AND status = %s"
        params.append(status)
    if skill:
        query += " AND skill LIKE %s"
        params.append(f"%{skill}%")
    if difficulty:
        query += " AND difficulty = %s"
        params.append(difficulty)

    query += " ORDER BY question_id DESC"

    with connection.cursor() as cursor:
        cursor.execute(query, params)
        rows = cursor.fetchall()

    questions = []
    for r in rows:
        questions.append({
            'question_id': r[0],
            'requirement_id': r[1],
            'text': r[2],
            'type': r[3],
            'options': json.loads(r[4]) if r[4] else None,
            'correct_answer': r[5],
            'skill': r[6],
            'difficulty': r[7],
            'category': r[8],
            'source': r[9],
            'status': r[10],
            'created_by': r[11],
            'approved_by': r[12],
            'created_at': r[13],
        })

    return Response({'questions': questions, 'count': len(questions)})


@csrf_exempt
@api_view(['POST'])
@require_role([3]) # HR only
def hr_create_question_bank(request):
    """
    Create a new manual question in the question bank. HR only.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    data = request.data

    requirement_id = data.get('requirement_id')
    text = data.get('text', '').strip()
    q_type = data.get('type', 'open_ended')
    options = data.get('options')
    correct_answer = data.get('correct_answer')
    skill = data.get('skill', '').strip()
    difficulty = data.get('difficulty', 'medium')
    category = data.get('category', 'Technical')

    if not text:
        return Response({'error': 'text is required'}, status=400)

    if requirement_id:
        if not ownership.can_modify_requirement(userid, roleid, int(requirement_id)):
            return Response({'error': 'Forbidden'}, status=403)

    options_json = json.dumps(options) if options else None

    with connection.cursor() as cursor:
        cursor.execute("""
            INSERT INTO question_bank 
                (requirement_id, text, type, options, correct_answer, skill, difficulty, category, source, status, created_by, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'manual', 'draft', %s, NOW())
        """, [requirement_id, text, q_type, options_json, correct_answer, skill, difficulty, category, userid])
        cursor.execute("SELECT LAST_INSERT_ID()")
        question_id = cursor.fetchone()[0]

    from recruitment.services.audit_service import audit_service
    audit_service.log(
        action='create_question',
        actor_id=userid,
        target_type='question_bank',
        target_id=question_id,
        details={'requirement_id': requirement_id}
    )

    return Response({
        'message': 'Question created successfully',
        'question_id': question_id,
        'status': 'draft'
    })


@csrf_exempt
@api_view(['PUT'])
@require_role([3]) # HR only
def hr_update_question_bank(request, question_id):
    """
    Update a question in the question bank. HR only.
    If the question is in status 'approved' or 'published', clone it as a new draft.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    data = request.data

    text = data.get('text', '').strip()
    q_type = data.get('type', 'open_ended')
    options = data.get('options')
    correct_answer = data.get('correct_answer')
    skill = data.get('skill', '').strip()
    difficulty = data.get('difficulty', 'medium')
    category = data.get('category', 'Technical')

    if not text:
        return Response({'error': 'text is required'}, status=400)

    from recruitment.services.audit_service import audit_service

    with connection.cursor() as cursor:
        # Check current status of the question
        cursor.execute("""
            SELECT requirement_id, status FROM question_bank WHERE question_id = %s
        """, [question_id])
        row = cursor.fetchone()
        if not row:
            return Response({'error': 'Question not found'}, status=404)
        
        requirement_id, status = row
        
        if requirement_id:
            if not ownership.can_modify_requirement(userid, roleid, int(requirement_id)):
                return Response({'error': 'Forbidden'}, status=403)

        options_json = json.dumps(options) if options else None

        # Immutability & Version Freezing:
        # If the question is approved or published, clone it into a new draft
        if status in ('approved', 'published'):
            cursor.execute("""
                INSERT INTO question_bank 
                    (requirement_id, text, type, options, correct_answer, skill, difficulty, category, source, status, created_by, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'manual', 'draft', %s, NOW())
            """, [requirement_id, text, q_type, options_json, correct_answer, skill, difficulty, category, userid])
            cursor.execute("SELECT LAST_INSERT_ID()")
            new_question_id = cursor.fetchone()[0]
            
            audit_service.log(
                action='edit_question',
                actor_id=userid,
                target_type='question_bank',
                target_id=question_id,
                details={'cloned_to': new_question_id}
            )
            audit_service.log(
                action='create_question',
                actor_id=userid,
                target_type='question_bank',
                target_id=new_question_id,
                details={'cloned_from': question_id, 'requirement_id': requirement_id}
            )
            
            return Response({
                'message': 'Question was approved/published. Cloned to a new draft version.',
                'question_id': new_question_id,
                'cloned': True,
                'status': 'draft'
            })
        else:
            # If still draft, edit in place
            cursor.execute("""
                UPDATE question_bank 
                SET text=%s, type=%s, options=%s, correct_answer=%s, skill=%s, difficulty=%s, category=%s, updated_at=NOW()
                WHERE question_id=%s
            """, [text, q_type, options_json, correct_answer, skill, difficulty, category, question_id])
            
            audit_service.log(
                action='edit_question',
                actor_id=userid,
                target_type='question_bank',
                target_id=question_id,
                details={'requirement_id': requirement_id}
            )
            
            return Response({
                'message': 'Question updated successfully',
                'question_id': question_id,
                'cloned': False,
                'status': 'draft'
            })


@csrf_exempt
@api_view(['POST'])
@require_role([3]) # HR only
def hr_approve_question_bank(request, question_id):
    """
    Approve a question in the question bank. HR only.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id

    with connection.cursor() as cursor:
        cursor.execute("SELECT requirement_id, status FROM question_bank WHERE question_id = %s", [question_id])
        row = cursor.fetchone()
        if not row:
            return Response({'error': 'Question not found'}, status=404)
        requirement_id, status = row

        if requirement_id:
            if not ownership.can_modify_requirement(userid, roleid, int(requirement_id)):
                return Response({'error': 'Forbidden'}, status=403)

        cursor.execute("""
            UPDATE question_bank 
            SET status = 'approved', approved_by = %s, updated_at = NOW() 
            WHERE question_id = %s
        """, [userid, question_id])

    from recruitment.services.audit_service import audit_service
    audit_service.log(
        action='approve_question',
        actor_id=userid,
        target_type='question_bank',
        target_id=question_id,
        details={'requirement_id': requirement_id}
    )

    return Response({'message': 'Question approved successfully'})


@csrf_exempt
@api_view(['POST'])
@require_role([3]) # HR only
def hr_publish_question_bank(request):
    """
    Publish a set of approved questions to a requirement's exam pool. HR only.
    Sets question status in bank to 'published' and updates active mapping in exam_question.
    """
    userid = request.scope.user_id
    roleid = request.scope.role_id
    data = request.data

    requirement_id = data.get('requirement_id')
    question_ids = data.get('question_ids', [])

    if not requirement_id or not isinstance(question_ids, list):
        return Response({'error': 'requirement_id and question_ids list required'}, status=400)

    if not ownership.can_modify_requirement(userid, roleid, int(requirement_id)):
        return Response({'error': 'Forbidden'}, status=403)

    from recruitment.services.audit_service import audit_service

    try:
        # Enforce transaction block to ensure atomicity
        with transaction.atomic():
            with connection.cursor() as cursor:
                # Verify questions exist and are approved or published
                if question_ids:
                    format_strings = ','.join(['%s'] * len(question_ids))
                    cursor.execute(f"""
                        SELECT question_id, text, type, options, correct_answer, status, category FROM question_bank
                        WHERE question_id IN ({format_strings}) AND requirement_id = %s
                    """, question_ids + [requirement_id])
                    rows = cursor.fetchall()
                    if len(rows) != len(question_ids):
                        return Response({'error': 'Some questions not found or do not belong to requirement'}, status=400)
                    
                    # Check status and count categories
                    tech_count = 0
                    for r in rows:
                        if r[5] not in ('approved', 'published'):
                            return Response({'error': f'Question {r[0]} must be approved before publishing'}, status=400)
                        cat = (r[6] or '').strip().lower()
                        if cat == 'technical':
                            tech_count += 1

                    # Publish validations: minimum technical >= 3, total >= 5
                    if len(question_ids) < 5:
                        return Response({'error': 'An exam must contain at least 5 questions.'}, status=400)
                    if tech_count < 3:
                        return Response({'error': f'Exam questions do not meet the minimum Technical questions requirement (found {tech_count}/3).'}, status=400)

                # Set other previously published questions for this requirement to archived
                if question_ids:
                    format_strings = ','.join(['%s'] * len(question_ids))
                    cursor.execute(f"""
                        SELECT question_id FROM question_bank 
                        WHERE requirement_id = %s AND status = 'published' AND question_id NOT IN ({format_strings})
                    """, [requirement_id] + question_ids)
                    archived_ids = [r[0] for r in cursor.fetchall()]

                    cursor.execute(f"""
                        UPDATE question_bank 
                        SET status = 'archived', updated_at = NOW() 
                        WHERE requirement_id = %s AND status = 'published' AND question_id NOT IN ({format_strings})
                    """, [requirement_id] + question_ids)
                else:
                    cursor.execute("""
                        SELECT question_id FROM question_bank 
                        WHERE requirement_id = %s AND status = 'published'
                    """, [requirement_id])
                    archived_ids = [r[0] for r in cursor.fetchall()]

                    cursor.execute("""
                        UPDATE question_bank 
                        SET status = 'archived', updated_at = NOW() 
                        WHERE requirement_id = %s AND status = 'published'
                    """, [requirement_id])

                # Log audit trail for archived questions
                for q_id in archived_ids:
                    audit_service.log(
                        action='archive_question',
                        actor_id=userid,
                        target_type='question_bank',
                        target_id=q_id,
                        details={'requirement_id': requirement_id}
                    )

                # Update status of newly published questions
                if question_ids:
                    format_strings = ','.join(['%s'] * len(question_ids))
                    cursor.execute(f"""
                        UPDATE question_bank 
                        SET status = 'published', updated_at = NOW() 
                        WHERE question_id IN ({format_strings})
                    """, question_ids)

                # Keep only exam_question mappings that have candidate answers, delete others
                if question_ids:
                    format_strings = ','.join(['%s'] * len(question_ids))
                    cursor.execute(f"""
                        DELETE FROM exam_question 
                        WHERE requirement_id = %s 
                          AND bank_question_id NOT IN ({format_strings})
                          AND question_id NOT IN (SELECT DISTINCT question_id FROM exam_answer)
                    """, [requirement_id] + question_ids)
                else:
                    cursor.execute("""
                        DELETE FROM exam_question 
                        WHERE requirement_id = %s 
                          AND question_id NOT IN (SELECT DISTINCT question_id FROM exam_answer)
                    """, [requirement_id])

                # Insert new mapping entries in exam_question (create version snapshot)
                for q_id in question_ids:
                    cursor.execute("""
                        SELECT question_id FROM exam_question 
                        WHERE requirement_id = %s AND bank_question_id = %s
                    """, [requirement_id, q_id])
                    if cursor.fetchone():
                        continue # Already mapped
                    
                    cursor.execute("""
                        SELECT text, type, options, correct_answer FROM question_bank WHERE question_id = %s
                    """, [q_id])
                    q_text, q_type, q_opts, q_ans = cursor.fetchone()
                    
                    cursor.execute("""
                        INSERT INTO exam_question (requirement_id, bank_question_id, text, type, options, correct_answer, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    """, [requirement_id, q_id, q_text, q_type, q_opts, q_ans])

                # Log exam publication
                audit_service.log(
                    action='publish_exam',
                    actor_id=userid,
                    target_type='job_requirement',
                    target_id=requirement_id,
                    details={'question_ids': question_ids}
                )

        return Response({'message': 'Exam questions published successfully'})
    except Exception as e:
        logger.error(f"hr_publish_question_bank error: {e}")
        return Response({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
@require_role([4]) # Candidate only
def candidate_list_exam_questions(request, session_id):
    """
    List active exam questions for a candidate's session. Candidate only.
    Includes validation: candidate owns session, session is active and not completed.
    """
    userid = request.scope.user_id
    
    with connection.cursor() as cursor:
        # Validate session ownership and status
        cursor.execute("""
            SELECT user_id, status, requirement_id FROM exam_session WHERE session_id = %s
        """, [session_id])
        row = cursor.fetchone()
        if not row:
            return Response({'error': 'Exam session not found'}, status=404)
        
        session_user_id, status, requirement_id = row
        if session_user_id != userid:
            return Response({'error': 'Forbidden'}, status=403)
        
        if status != 'in_progress':
            return Response({'error': f'Exam session is not active (status: {status})'}, status=400)

        # Retrieve questions from exam_question (the frozen mapping)
        cursor.execute("""
            SELECT question_id, text, type, options 
            FROM exam_question 
            WHERE requirement_id = %s
        """, [requirement_id])
        q_rows = cursor.fetchall()

    questions = []
    for q in q_rows:
        questions.append({
            'question_id': q[0],
            'text': q[1],
            'type': q[2],
            'options': json.loads(q[3]) if q[3] else None
        })

    return Response({'questions': questions, 'count': len(questions)})


@csrf_exempt
@api_view(['GET'])
@require_auth
def get_notices(request):
    try:
        user_id = request.scope.user_id
        role_id = request.scope.role_id

        # Notices can be targeted at either user_id specifically or role_id (or both)
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT notice_id, title, message, notice_type, is_read, action_url, created_at
                FROM notices
                WHERE is_read = 0
                  AND (role_id = %s OR user_id = %s)
                ORDER BY created_at DESC
            """, [role_id, user_id])
            rows = cursor.fetchall()

        result = [
            {
                "notice_id": row[0],
                "title": row[1],
                "message": row[2],
                "notice_type": row[3],
                "is_read": bool(row[4]),
                "action_url": row[5],
                "created_at": row[6].strftime("%Y-%m-%d %H:%M:%S") if row[6] else None
            }
            for row in rows
        ]
        return Response(result)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
@require_auth
def mark_notice_read(request, notice_id):
    try:
        user_id = request.scope.user_id
        role_id = request.scope.role_id

        with connection.cursor() as cursor:
            # Check ownership/targeting
            cursor.execute("""
                SELECT role_id, user_id FROM notices WHERE notice_id = %s
            """, [notice_id])
            row = cursor.fetchone()
            if not row:
                return Response({'error': 'Notice not found'}, status=404)
            target_role_id, target_user_id = row

            if (target_role_id is not None and target_role_id != role_id) and (target_user_id is not None and target_user_id != user_id):
                return Response({'error': 'Forbidden'}, status=403)

            cursor.execute("""
                UPDATE notices SET is_read = 1 WHERE notice_id = %s
            """, [notice_id])
            connection.commit()

        return Response({'message': 'Notice marked as read'})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
@require_auth
def update_job_status(request, requirement_id):
    try:
        user_id = request.scope.user_id
        role_id = request.scope.role_id
        new_status = request.data.get('status')

        if new_status not in ('ACTIVE', 'CLOSED', 'DELETED'):
            return Response({'error': 'Invalid status. Must be ACTIVE, CLOSED, or DELETED.'}, status=400)

        with connection.cursor() as cursor:
            # Get job creator and current status
            cursor.execute("""
                SELECT created_by, status FROM job_requirement WHERE requirement_id = %s
            """, [requirement_id])
            row = cursor.fetchone()
            if not row:
                return Response({'error': 'Job requirement not found.'}, status=404)
            created_by, current_status = row

            # Policy checks
            if new_status == 'DELETED':
                if role_id != 1:  # Only admin can delete
                    return Response({'error': 'Forbidden: Only administrators can delete job requirements.'}, status=403)
                cursor.execute("""
                    UPDATE job_requirement 
                    SET status = %s, deleted_at = NOW(), deleted_by = %s 
                    WHERE requirement_id = %s
                """, [new_status, user_id, requirement_id])
            elif new_status in ('CLOSED', 'ACTIVE'):
                if role_id != 1 and created_by != user_id:  # Only admin or creator manager
                    return Response({'error': 'Forbidden: You are not authorized to modify this job requirement.'}, status=403)

                if new_status == 'CLOSED':
                    cursor.execute("""
                        UPDATE job_requirement 
                        SET status = %s, closed_at = NOW(), closed_by = %s 
                        WHERE requirement_id = %s
                    """, [new_status, user_id, requirement_id])
                else:  # ACTIVE (reopening)
                    cursor.execute("""
                        UPDATE job_requirement 
                        SET status = %s, closed_at = NULL, closed_by = NULL 
                        WHERE requirement_id = %s
                    """, [new_status, requirement_id])
            
            connection.commit()

        # Log action to audit log
        from recruitment.services.audit_service import audit_service
        audit_service.log(
            action='update_job_status',
            actor_id=user_id,
            target_type='job_requirement',
            target_id=requirement_id,
            details={'status': new_status}
        )

        return Response({'message': f'Job status updated successfully to {new_status}'})

    except Exception as e:
        return Response({'error': str(e)}, status=500)