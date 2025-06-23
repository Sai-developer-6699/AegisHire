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

    # Fetch user record from MySQL
    cursor = connection.cursor()
    cursor.execute("SELECT password, roleid FROM users WHERE username = %s", [username])
    user = cursor.fetchone()

    if user and check_password(password, user[0]):
        return Response({'message': f'Login successful!', 'roleid': user[1]})
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

