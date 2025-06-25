from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
import json
import logging

# Configure logging
logger = logging.getLogger(__name__)


def home(request):
    return HttpResponse("Welcome to the AI Recruitment Tool Backend")


@api_view(['POST'])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')

    with connection.cursor() as cursor:
        # Fetch userid, hashed password, and roleid
        cursor.execute("SELECT userid, password, roleid FROM users WHERE username = %s", [username])
        user = cursor.fetchone()

    if user and check_password(password, user[1]):
        userid = user[0]
        roleid = user[2]

        # ✅ Send userid back in response so frontend can save it
        return Response({
            'message': 'Login successful!',
            'roleid': roleid,
            'userid': userid  # Send this to associate job posts
        })
    else:
        return Response({'message': 'Invalid username or password'}, status=401)



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

@api_view(['GET'])
def get_user_by_username(request, username):
    cursor = connection.cursor()
    cursor.execute("SELECT userid FROM users WHERE username = %s", [username])
    result = cursor.fetchone()
    
    if result:
        return Response({"userid": result[0]})
    else:
        return Response({"userid": None})  # Not found


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


@api_view(['DELETE'])
def delete_user(request, userid):
    cursor = connection.cursor()
    cursor.execute("DELETE FROM users WHERE userid = %s", [userid])
    return Response({"message": "User deleted successfully"})




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

###Get options


@api_view(['POST'])
def get_recommendations_for_position(request):
    try:
        position_name = request.data.get('position', '').strip().lower()

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

@api_view(['POST'])
def submit_job(request):
    try:
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User not logged in'}, status=403)

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
            """, [position_id, experience_range, user_id])
            cursor.execute("SELECT LAST_INSERT_ID()")
            requirement_id = cursor.fetchone()[0]

            # Insert skill mappings
            for skill_name in selected_skills:
                cursor.execute("SELECT skill_id FROM skill_master WHERE skill_name=%s", [skill_name])
                skill_row = cursor.fetchone()
                if skill_row:
                    skill_id = skill_row[0]
                    cursor.execute("INSERT INTO job_requirement_skills (requirement_id, skill_id) VALUES (%s, %s)", [requirement_id, skill_id])

            # Insert education
            for edu_name in selected_education:
                cursor.execute("SELECT education_id FROM education_master WHERE education_name=%s", [edu_name])
                edu_row = cursor.fetchone()
                if edu_row:
                    edu_id = edu_row[0]
                    cursor.execute("INSERT INTO job_requirement_education (requirement_id, education_id) VALUES (%s, %s)", [requirement_id, edu_id])

            # Insert soft skills
            for soft_name in selected_soft_skills:
                cursor.execute("SELECT soft_skill_id FROM soft_skill_master WHERE soft_skill_name=%s", [soft_name])
                soft_row = cursor.fetchone()
                if soft_row:
                    soft_id = soft_row[0]
                    cursor.execute("INSERT INTO job_requirement_softskills (requirement_id, soft_skill_id) VALUES (%s, %s)", [requirement_id, soft_id])

        return Response({'status': 'Job created successfully', 'requirement_id': requirement_id})

    except Exception as e:
        return Response({'error': str(e)}, status=500)

### Recent Uploads of Job Posts


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

