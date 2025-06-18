from django.urls import path
from .views import login_api, home , register_api , get_all_users
from django.urls import include
# recruitment/urls.py


urlpatterns = [
    path('', home, name='home'), 
    path('login/', login_api, name='api-login'),
    path('api/register/', register_api, name='register'),
    path('api/get-users/', get_all_users, name='get-users')

]
