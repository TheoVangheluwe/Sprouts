from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('game/<int:game_id>/', views.game_view, name='game'),
    path('logout/', views.logout_view, name='logout'),
    path('app/', views.ReactAppView, name='react_app'),
    path('login-redirect/', views.login_redirect_with_message, name='login_redirect'),

    # API existantes
    #path('api/join-game', views.join_game, name='join_game'),
    path('api/game/<int:game_id>/status/', views.game_status, name='game_status'),
    path('api/game/<int:game_id>/start/', views.start_game, name='start_game'),
    path('api/game/', views.list_games, name='list_games'),
    path('api/game/<int:game_id>/ready/', views.set_ready, name='set_ready'),
    path('api/game/<int:game_id>/state/', views.game_state, name='game_state'),
    path('api/game/<int:game_id>/move/', views.make_move, name='make_move'),

    # Nouvelles API pour la gestion des files d'attente
    path('api/game/create/', views.create_game, name='create_game'),
    path('api/game/<int:game_id>/join/', views.join_specific_game, name='join_specific_game'),
    path('api/game/<int:game_id>/leave/', views.leave_game, name='leave_game'),
    # URLs pour la file d'attente globale
    path('api/queue/join/', views.join_queue, name='join_queue'),
    path('api/queue/ready/', views.set_ready, name='set_ready'),
    path('api/queue/leave/', views.leave_queue, name='leave_queue'),
    path('api/queue/status/', views.queue_status, name='queue_status'),
]