from django.urls import path
from .views import login_api

urlpatterns = [
    path('../login.js', login_api, name='api-login'),
]
