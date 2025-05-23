from django.urls import path, include, re_path
from . import views

urlpatterns = [
    # Pages principales et authentification
    path('', views.index, name='index'),
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # Pages de l'application
    path('home/', views.common_react_view, name='home'),
    path('menu/', views.common_react_view, name='game'),
    path('pve/', views.common_react_view, name='rules'),
    path('ai/', views.common_react_view, name='rules'),
    path('rules/', views.common_react_view, name='rules'),
    path('waiting-room/', views.waiting_room_view, name='waiting_room'),
    path('online-game/<int:game_id>/', views.online_game_view, name='online_game'),
    path('legal/', views.common_react_view, name='legal'),
    path('menu/', views.common_react_view, name='menu'),
    path('profil/', views.common_react_view, name='profil'),
    path('technic/', views.common_react_view, name='technic'),

    # Historique player / game indiv
    path('historic/', views.common_react_view, name='historic'),
    path('historic/<int:game_id>/', views.common_react_view, name='historic_id'),

    # APIs pour avoir infos sur le joueur connecté
    path('api/player/id/', views.get_user_id, name='player_id'),  # revois id
    path('api/player/name/', views.get_user_name, name='player_name'),  # revois nom
    path('api/player/info/', views.get_user_info, name='player_games'),  # renvois les deux
    path('api/player/games/', views.get_user_games, name='player_games'),  # revois les games du joueur connecté

    # APIs pour la gestion des jeux - Mise à jour du nom de la fonction ici
    path('api/game/<int:game_id>/', views.game_detail_view, name='game_detail'),  # Mise à jour ici
    path('api/game/<int:game_id>/status/', views.game_status, name='game_status'),
    path('api/game/<int:game_id>/start/', views.start_game, name='start_game'),
    path('api/game/<int:game_id>/ready_to_play/', views.player_ready_to_play, name='player_ready_to_play'),
    path('api/game/<int:game_id>/state/', views.game_state, name='game_state'),
    path('api/game/<int:game_id>/move/', views.make_move, name='make_move'),

    path('api/game/', views.list_games, name='list_games'),
    path('api/game/create/', views.create_game, name='create_game'),
    path('api/game/<int:game_id>/join/', views.join_specific_game, name='join_specific_game'),
    path('api/game/<int:game_id>/leave/', views.leave_game, name='leave_game'),
    path('api/game/<int:game_id>/summary/', views.game_summary, name='game_sumary'),
    # Envois recap de game pour historic

    # API pour la fin du jeu
    path('api/is_game_over/', views.check_game_over, name='check_game_over'),

    path('api/get_possible_moves/', views.get_possible_moves, name='get_possible_moves'),
    
    # APIs pour la file d'attente
    path('api/queue/join/', views.join_queue, name='join_queue'),
    path('api/queue/ready/', views.set_ready, name='set_ready'),
    path('api/queue/leave/', views.leave_queue, name='leave_queue'),
    path('api/queue/status/', views.queue_status, name='queue_status'),

    # Redirection pour login
    path('login-redirect/', views.login_redirect_with_message, name='login_redirect'),

    # Route de fallback pour React - Commenté pour l'instant pour éviter les conflits
    # re_path(r'^.*$', views.react_fallback, name='react_fallback'),
]
