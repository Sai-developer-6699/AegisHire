from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
import json

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



def get_role_id(role_name):
    role_map = {
        "admin": 1,
        "Manager": 2,
        "HR": 3,
        "Candidate": 4
    }
    return role_map.get(role_name, 4)  # Default to Candidate


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
