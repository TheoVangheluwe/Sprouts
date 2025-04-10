from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Game, QueueEntry
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import logout
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib import messages
import os
import logging
import json
from django.db.models import Q
from datetime import datetime, timedelta

# Configure the logger
logger = logging.getLogger(__name__)

def index(request):
    return render(request, 'index.html')

@csrf_exempt
@login_required(login_url='login')
def game_view(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        return JsonResponse({
            'status': game.status,
            'player_count': game.player_count,
            'players': [{"username": player.username, "id": player.id} for player in game.players.all()]
        })
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)

@csrf_exempt
@login_required(login_url='login')
def join_game(request):
    try:
        logger.debug("Join game view called")

        # Logique pour créer ou rejoindre une salle d'attente
        game = Game.objects.filter(status='waiting').first()
        if game:
            game.player_count += 1
            game.players.add(request.user)
            if game.player_count >= 2:
                game.status = 'in_progress'
                game.current_player = game.players.first()
            game.save()
        else:
            game = Game.objects.create(status='waiting', player_count=1, current_player=request.user)
            game.players.add(request.user)

        return JsonResponse({'game_id': game.id, 'status': game.status, 'player_id': request.user.id})
    except Exception as e:
        return JsonResponse({'error': 'An error occurred while joining the game.'}, status=500)

def list_games(request):
    # Supprimer les jeux inactifs de plus de 2 heures
    old_date = datetime.now() - timedelta(hours=2)
    Game.objects.filter(created_at__lt=old_date).delete()

    # Récupérer les jeux actifs
    games = Game.objects.filter(status='waiting').values('id', 'status', 'player_count', 'point_options')
    return JsonResponse(list(games), safe=False)


@login_required(login_url='login')
def game_status(request, game_id):
    try:
        waiting_room = Game.objects.get(id=game_id)
        players = [
            {"username": player.username, "id": player.id,
             "ready": waiting_room.player_ready.get(str(player.id), False)}
            for player in waiting_room.players.all()
        ]

        # Vérifier si tous les joueurs sont prêts
        all_ready = all(waiting_room.player_ready.values()) if waiting_room.player_ready else False
        enough_players = waiting_room.player_count >= 2

        # Si tous les joueurs sont prêts et qu'il y a assez de joueurs, vérifier s'il y a un jeu associé
        game_id = None
        if all_ready and enough_players:
            # Rechercher si un jeu a été créé à partir de cette salle d'attente
            # Ceci est une simplification - vous devrez adapter cette logique à votre modèle de données
            recent_games = Game.objects.filter(
                status='started',
                player_count=waiting_room.player_count
            ).order_by('-created_at')[:5]

            for game in recent_games:
                # Vérifier si les mêmes joueurs sont dans ce jeu
                game_player_ids = set(player.id for player in game.players.all())
                waiting_player_ids = set(player.id for player in waiting_room.players.all())

                if game_player_ids == waiting_player_ids:
                    game_id = game.id
                    break

        return JsonResponse({
            'status': waiting_room.status,
            'player_count': waiting_room.player_count,
            'players': players,
            'point_options': waiting_room.point_options,
            'game_id': game_id
        })
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Waiting room not found'}, status=404)

@login_required(login_url='login')
def game_state(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        return JsonResponse({
            'status': game.status,
            'state': game.state,
            'currentPlayer': game.current_player.id if game.current_player else None,
            'point_options': game.point_options
        })
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)


@csrf_exempt
@login_required(login_url='login')
def start_game(request, game_id):
    try:
        game = Game.objects.get(id=game_id)

        if game.player_count >= 2 and game.status == "waiting" and all(game.player_ready.values()):
            game.status = "started"
            game.save()
            return JsonResponse({'success': True, 'message': 'Game started'})

        return JsonResponse({'success': False, 'message': 'Not all players are ready'})
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)

@csrf_exempt
@login_required(login_url='login')
def make_move(request, game_id):

    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        game = Game.objects.get(id=game_id)

        move = json.loads(request.body.decode('utf-8'))

        if not move:
            return JsonResponse({'error': 'Move data is missing'}, status=400)

        if not game.state:
            game.state = {"curves": [], "points": []}

        if move["type"] == "initialize_points":
            # Le nombre de points est déterminé par la préférence du jeu
            # Vérifier si le nombre de points est cohérent avec les préférences
            if len(move["points"]) in game.point_options:
                game.state["points"] = move["points"]
            else:
                return JsonResponse({'error': 'Invalid number of points'}, status=400)

        elif move["type"] == "draw_curve":
            start_point = next((p for p in game.state["points"] if p["label"] == move["startPoint"]), None)
            end_point = next((p for p in game.state["points"] if p["label"] == move["endPoint"]), None)

            if not start_point or not end_point:
                return JsonResponse({'error': 'Invalid start or end point'}, status=400)

            if start_point["connections"] >= 3 or end_point["connections"] >= 3:
                return JsonResponse({'error': 'Maximum connections reached for a point'}, status=400)

            # Ajouter l'information du joueur à la courbe
            if isinstance(move["curve"], list):
                move["curve"] = {"points": move["curve"], "player": request.user.id}
            else:
                move["curve"]["player"] = request.user.id

            game.state["curves"].append(move["curve"])

            for point in game.state["points"]:
                if point["label"] == move["startPoint"] or point["label"] == move["endPoint"]:
                    point["connections"] += 1

        elif move["type"] == "place_point":
            game.state["points"].append(move["point"])

            # Ajouter l'information du joueur à la courbe si elle existe
            if "curve" in move and move["curve"]:
                if isinstance(move["curve"], list):
                    move["curve"] = {"points": move["curve"], "player": request.user.id}
                else:
                    move["curve"]["player"] = request.user.id
                game.state["curves"].append(move["curve"])

            players = list(game.players.all())
            current_player_index = players.index(game.current_player)
            next_player_index = (current_player_index + 1) % len(players)
            game.current_player = players[next_player_index]

        else:
            return JsonResponse({'error': 'Invalid move type'}, status=400)

        game.save()

        return JsonResponse({
            'gameId': game.id,
            'state': game.state,
            'currentPlayer': game.current_player.id,
            'curves': game.state.get('curves', []),
            'points': game.state.get('points', [])
        })

    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=400)

    except Exception as e:
        return JsonResponse({'error': 'An error occurred while making the move.'}, status=500)

# Nouvelles fonctions pour la gestion des files d'attente avec préférences de points

# Modification de la fonction create_game pour qu'elle crée une "salle d'attente" sans GameId
@csrf_exempt
@login_required(login_url='login')
def create_game(request):
    """Créer une nouvelle salle d'attente avec les préférences de points"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
        point_options = data.get('pointOptions', [3])  # Par défaut, 3 points si non spécifié

        # Valider les options de points
        valid_options = [3, 4, 5, 6, 7]
        point_options = [opt for opt in point_options if opt in valid_options]

        if not point_options:
            return JsonResponse({'error': 'No valid point options provided'}, status=400)

        # Créer une salle d'attente (pas encore une partie active)
        waiting_room = Game.objects.create(
            status='waiting',
            player_count=1,
            current_player=request.user,
            point_options=point_options,
            state={"curves": [], "points": []},
            # Ne pas définir de gameId ici
        )
        waiting_room.players.add(request.user)
        waiting_room.player_ready[str(request.user.id)] = False
        waiting_room.save()


        return JsonResponse({
            'waiting_room_id': waiting_room.id,  # Retourner l'ID de la salle d'attente, pas un gameId
            'status': waiting_room.status,
            'player_id': request.user.id,
            'point_options': point_options
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)


@csrf_exempt
@login_required(login_url='login')
def join_queue(request):
    """Rejoindre la file d'attente globale avec des préférences de points"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
        point_preferences = data.get('pointPreferences', [3])  # Par défaut, 3 points

        # Valider les préférences de points
        valid_options = [3, 4, 5, 6, 7]
        point_preferences = [opt for opt in point_preferences if opt in valid_options]

        if not point_preferences:
            return JsonResponse({'error': 'No valid point preferences provided'}, status=400)

        # Vérifier si le joueur est déjà dans la file d'attente
        existing_entry = QueueEntry.objects.filter(user=request.user).first()
        if existing_entry:
            # Mettre à jour les préférences
            existing_entry.point_preferences = point_preferences
            existing_entry.save()
            entry = existing_entry
        else:
            # Créer une nouvelle entrée dans la file
            entry = QueueEntry.objects.create(
                user=request.user,
                point_preferences=point_preferences
            )

        # Chercher un joueur compatible non matché
        potential_matches = QueueEntry.objects.filter(
            matched_with__isnull=True
        ).exclude(
            user=request.user
        ).order_by('joined_at')

        matched_entry = None
        for potential_match in potential_matches:
            # Vérifier si les préférences de points sont compatibles
            if any(p in potential_match.point_preferences for p in point_preferences):
                matched_entry = potential_match
                break

        if matched_entry:
            # Établir le match entre les deux joueurs
            entry.matched_with = matched_entry
            matched_entry.matched_with = entry
            entry.save()
            matched_entry.save()

        # Renvoyer l'état de la file d'attente
        response_data = {
            'in_queue': True,
            'queue_id': entry.id,
            'point_preferences': point_preferences,
            'matched': matched_entry is not None
        }

        if matched_entry:
            response_data['matched_with'] = {
                'username': matched_entry.user.username,
                'ready': matched_entry.ready
            }

        return JsonResponse(response_data)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)


@csrf_exempt
@login_required(login_url='login')
def set_ready(request):
    """Marquer un joueur comme prêt dans la file d'attente et créer une partie si les deux joueurs sont prêts"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        # Récupérer l'entrée du joueur dans la file d'attente
        entry = QueueEntry.objects.get(user=request.user)

        # Marquer le joueur comme prêt
        entry.ready = True
        entry.save()

        logger.info(f"Player {request.user.username} (id: {request.user.id}) is now ready")

        # Vérifier si le joueur est matché avec un autre joueur
        if not entry.matched_with:
            logger.info(f"Player {request.user.username} is ready but not matched yet")
            return JsonResponse({
                'success': True,
                'message': 'Player ready, waiting for match',
                'matched_also_ready': False
            })

        # Vérifier si l'adversaire est également prêt
        if not entry.matched_with.ready:
            logger.info(
                f"Player {request.user.username} is ready, opponent {entry.matched_with.user.username} is not ready yet")
            return JsonResponse({
                'success': True,
                'message': 'Player ready, waiting for opponent',
                'matched_also_ready': False
            })

        # Les deux joueurs sont prêts, on peut créer une partie
        logger.info(f"Both players ready: {request.user.username} and {entry.matched_with.user.username}")

        # Trouver des points communs pour la partie
        common_points = set(entry.point_preferences).intersection(set(entry.matched_with.point_preferences))
        if common_points:
            selected_points = list(common_points)[0]
        else:
            selected_points = min(entry.point_preferences)

        logger.info(f"Creating game with {selected_points} points")

        # Vérifier si une partie existe déjà pour ces deux joueurs
        existing_game = Game.objects.filter(
            players=request.user
        ).filter(
            players=entry.matched_with.user
        ).filter(
            status='started',
            from_queue=True
        ).order_by('-created_at').first()

        if existing_game:
            logger.info(f"Game already exists with id {existing_game.id}, returning that")
            game_id = existing_game.id
        else:
            # Créer une nouvelle partie
            game = Game.objects.create(
                status='started',
                player_count=2,
                current_player=request.user,
                point_options=[selected_points],
                selected_points=selected_points,
                from_queue=True,
                state={"curves": [], "points": []}
            )

            # Ajouter les joueurs à la partie
            game.players.add(request.user, entry.matched_with.user)
            game.save()

            game_id = game.id
            logger.info(f"New game created with id {game_id}")

        # Ne pas supprimer les entrées de file d'attente tout de suite
        # pour que les deux joueurs puissent voir l'ID de partie via queue_status

        return JsonResponse({
            'success': True,
            'message': 'Game created',
            'game_id': game_id
        })

    except QueueEntry.DoesNotExist:
        logger.error(f"Player {request.user.username} not found in queue")
        return JsonResponse({'error': 'You are not in the queue'}, status=404)
    except Exception as e:
        logger.error(f"Error in set_ready: {str(e)}")
        return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)


@login_required(login_url='login')
def queue_status(request):
    """Obtenir le statut actuel dans la file d'attente"""
    try:
        # Récupérer l'entrée du joueur dans la file d'attente
        entry = QueueEntry.objects.filter(user=request.user).first()

        if not entry:
            return JsonResponse({
                'in_queue': False,
                'queue_count': QueueEntry.objects.count()
            })

        # Préparer les données de base de la réponse
        response_data = {
            'in_queue': True,
            'queue_id': entry.id,
            'point_preferences': entry.point_preferences,
            'ready': entry.ready,
            'queue_count': QueueEntry.objects.count(),
            'joined_at': entry.joined_at.isoformat() if entry.joined_at else None
        }

        # Ajouter les informations sur l'adversaire si le joueur est matché
        if entry.matched_with:
            response_data['matched'] = True
            response_data['matched_with'] = {
                'username': entry.matched_with.user.username,
                'ready': entry.matched_with.ready
            }

            # Vérifier si les deux joueurs sont prêts
            if entry.ready and entry.matched_with.ready:
                # Vérifier si une partie a été créée pour ces joueurs
                recent_games = Game.objects.filter(
                    players=request.user
                ).filter(
                    players=entry.matched_with.user
                ).filter(
                    status='started',
                    from_queue=True
                ).order_by('-created_at')[:1]

                if recent_games:
                    game = recent_games[0]
                    logger.info(
                        f"Found game {game.id} for players {request.user.username} and {entry.matched_with.user.username}")

                    response_data['game_created'] = True
                    response_data['game_id'] = game.id

                    # Maintenir les entrées dans la file pendant quelques secondes
                    # pour s'assurer que les deux joueurs peuvent voir l'ID de partie
                    # La suppression se fera lors d'une prochaine requête queue_status
                    if hasattr(entry, 'game_id_seen') and hasattr(entry.matched_with, 'game_id_seen'):
                        logger.info(f"Both players have seen game {game.id}, cleaning up queue")
                        matched_user = entry.matched_with.user
                        QueueEntry.objects.filter(user__in=[request.user, matched_user]).delete()
                    else:
                        # Marquer que ce joueur a vu l'ID de partie
                        entry.game_id_seen = True
                        entry.save()
        else:
            response_data['matched'] = False

        return JsonResponse(response_data)

    except Exception as e:
        logger.error(f"Error in queue_status: {str(e)}")
        return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)

@csrf_exempt
@login_required(login_url='login')
def leave_queue(request):
    """Quitter la file d'attente"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        entries = QueueEntry.objects.filter(user=request.user)

        for entry in entries:
            # Si le joueur était matché, libérer l'autre joueur
            if entry.matched_with:
                entry.matched_with.matched_with = None
                entry.matched_with.save()

            # Supprimer l'entrée
            entry.delete()

        return JsonResponse({
            'success': True,
            'message': 'Left queue successfully'
        })

    except Exception as e:
        return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)

@csrf_exempt
@login_required(login_url='login')
def join_specific_game(request, game_id):
    """Rejoindre un jeu spécifique"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
        point_preferences = data.get('pointPreferences', [])

        game = Game.objects.get(id=game_id)

        # Vérifier si le jeu est en attente et a des options de points compatibles
        if game.status != 'waiting':
            return JsonResponse({'error': 'Game is not in waiting status'}, status=400)

        if game.player_count >= 2:
            return JsonResponse({'error': 'Game is already full'}, status=400)

        # Vérifier si le joueur est déjà dans le jeu
        if request.user in game.players.all():
            return JsonResponse({'error': 'You are already in this game'}, status=400)

        # Vérifier la compatibilité des préférences de points
        if not any(opt in point_preferences for opt in game.point_options):
            return JsonResponse({'error': 'No compatible point options'}, status=400)

        # Rejoindre le jeu
        game.player_count += 1
        game.players.add(request.user)
        game.player_ready[str(request.user.id)] = False

        if game.player_count >= 2:
            game.status = 'in_progress'
            if not game.current_player:
                game.current_player = game.players.first()

        game.save()


        return JsonResponse({
            'game_id': game.id,
            'status': game.status,
            'player_id': request.user.id,
            'point_options': game.point_options
        })

    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)

@csrf_exempt
@login_required(login_url='login')
def leave_game(request, game_id):
    """Quitter un jeu"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        game = Game.objects.get(id=game_id)

        # Vérifier si le joueur est dans le jeu
        if request.user not in game.players.all():
            return JsonResponse({'error': 'You are not in this game'}, status=400)

        # Retirer le joueur du jeu
        game.players.remove(request.user)
        game.player_count -= 1

        # Retirer le statut "prêt" du joueur
        if str(request.user.id) in game.player_ready:
            del game.player_ready[str(request.user.id)]

        # Si le jeu est vide, le supprimer
        if game.player_count <= 0:
            game.delete()
            return JsonResponse({'success': True, 'message': 'Game deleted'})

        # Si le joueur actuel quitte, passer au joueur suivant
        if game.current_player == request.user:
            remaining_players = list(game.players.all())
            if remaining_players:
                game.current_player = remaining_players[0]
            else:
                game.current_player = None

        game.save()



        return JsonResponse({'success': True, 'message': 'Left game successfully'})

    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = UserCreationForm()
    return render(request, 'register.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect(request.GET.get('next', '/app/'))
        else:
            messages.error(request, "Identifiants invalides. Veuillez réessayer.")
    else:
        if 'next' in request.GET:
            messages.error(request, "Vous devez être connecté pour accéder à cette page.")
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('login')

@login_required(login_url='login')
def ReactAppView(request):
    react_index_path = os.path.join(settings.BASE_DIR, 'frontend', 'build', 'index.html')
    try:
        with open(react_index_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    except FileNotFoundError:
        return HttpResponse(
            "Le fichier React index.html n'existe pas. Assurez-vous d'avoir exécuté 'npm run build'.",
            status=404,
        )

def login_redirect_with_message(request):
    messages.error(request, "Vous devez être connecté pour accéder à cette page.")
    return redirect('login')
