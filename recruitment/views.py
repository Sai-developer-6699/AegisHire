from django.shortcuts import render
from django.http import HttpResponse
# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


def home(request):
    return HttpResponse("Welcome to the AI Recruitment Tool Backend")


@api_view(['POST'])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')

    # For now, just mock response
    if username == 'admin' and password == 'password123':
        return Response({'message': 'Login successful!'})
    else:
        return Response({'message': 'Invalid credentials'}, status=401)
