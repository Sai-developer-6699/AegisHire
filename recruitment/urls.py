from django.urls import path
from .views import login_api, home
from django.urls import include
# recruitment/urls.py


urlpatterns = [
    path('', home, name='home'), 
    path('login/', login_api, name='api-login'),
]
