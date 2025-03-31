from django.urls import path, include, re_path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('game/<int:game_id>/', views.game_view, name='game'),
    path('logout/', views.logout_view, name='logout'), 
    path('app/', views.ReactAppView, name='react_app'),
    path('login-redirect/', views.login_redirect_with_message, name='login_redirect'),
    # Catch-all pattern pour React
    re_path(r'^.*$', views.ReactAppView, name='react_app_catch_all'),
]
