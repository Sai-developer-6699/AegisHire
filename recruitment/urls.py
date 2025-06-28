from django.urls import path
from .views import (
    login_api,
    home,
    register_api,
    get_all_users,
    get_user_by_username,
    update_user_by_username,
    delete_user,
    get_user_by_id,
    get_recommendations_for_position,
    submit_job,
    get_recent_jobs,
    check_session,
    logout_api,
    dashboard,
    get_positions
)
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
    path('api/get-user-by-id/<int:userid>/', get_user_by_id, name='get-user-by-id'),
    path('api/get_recommendations_for_position/', get_recommendations_for_position, name='get_recommendations_for_position'),
    path('api/submit_job/', submit_job, name='submit_job'),
    path('api/get-recent-jobs/', get_recent_jobs, name='get-recent-jobs'),
    path('api/check_session/', check_session, name='check_session'),
    path('api/logout/', logout_api, name='logout'),
    path('api/dashboard/', dashboard, name='dashboard'),
    path('api/get_positions/', get_positions, name='get_positions')
]
