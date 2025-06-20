from django.urls import path
from .views import login_api, home , register_api , get_all_users , get_user_by_username, update_user_by_username , delete_user
from django.urls import include
# recruitment/urls.py


urlpatterns = [
    path('', home, name='home'), 
    path('login/', login_api, name='api-login'),
    path('api/register/', register_api, name='register'),
    path('api/get-users/', get_all_users, name='get-users'),
    path('api/get-user-by-username/<str:username>/', get_user_by_username, name='get-user-by-username'),
    path('api/update-user-by-username/<str:username>/', update_user_by_username, name='update-user-by-username'),
    path('api/delete-user/<int:userid>/', delete_user),

]
