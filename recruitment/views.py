from django.shortcuts import render
from django.http import HttpResponse
# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate

def home(request):
    return HttpResponse("Welcome to the AI Recruitment Tool Backend")


@api_view(['POST'])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=username, password=password)
    if user is not None:
        return Response({'message': f'Login successful! Welcome {user.username}'})
    else:
        return Response({'message': 'Invalid username or password'}, status=401)
