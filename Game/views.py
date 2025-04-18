from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.http import Http404, JsonResponse, HttpResponse
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
from django.db import transaction
from .utils.move_over import is_game_over

# Configure the logger
logger = logging.getLogger(__name__)


def index(request):
    return render(request, 'index.html')


def home_view(request):
    """Vue pour la page d'accueil"""
    return ReactAppView(request)


def game_view(request):
    """Vue pour la page de jeu"""
    return ReactAppView(request)

def pve_view(request):
    """Vue pour la page de jeu"""
    return ReactAppView(request)

def ai_view(request):
    """Vue pour la page de jeu"""
    return ReactAppView(request)

def rules_view(request):
    """Vue pour la page des règles"""
    return ReactAppView(request)

def legal_view(request):
    """Vue pour la page d'accueil"""
    return ReactAppView(request)

def historic_view(request):
    """Vue pour la page d'accueil"""
    return ReactAppView(request)

def historic_id_view(request, game_id):
    """Vue pour game recap"""
    return ReactAppView(request)

def waiting_room_view(request):
    """Vue pour la salle d'attente"""
    if not request.user.is_authenticated:
        return redirect('login_redirect')
    return ReactAppView(request)

def menu_view(request):
    """Vue pour game recap"""
    return ReactAppView(request)

def profil_view(request):
    """Vue pour game recap"""
    return ReactAppView(request)

def online_game_view(request, game_id):
    """Vue pour un jeu en ligne spécifique"""
    if not request.user.is_authenticated:
        return redirect('login_redirect')

    # Vérifier si le jeu existe et si l'utilisateur y est autorisé
    try:
        game = Game.objects.get(id=game_id)
        if request.user not in game.players.all():
            messages.error(request, "Vous n'êtes pas autorisé à accéder à cette partie.")
            return redirect('game')
    except Game.DoesNotExist:
        messages.error(request, "Cette partie n'existe pas.")
        return redirect('game')

    return ReactAppView(request)


def react_fallback(request):
    """Fallback pour les routes React inconnues"""
    # Si l'URL commence par /api/, c'est une erreur 404
    if request.path.startswith('/api/'):
        return JsonResponse({'error': 'API endpoint not found'}, status=404)

    # Sinon, renvoyer l'application React
    return ReactAppView(request)


@csrf_exempt
@login_required(login_url='login')
def game_detail_view(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        return JsonResponse({
            'status': game.status,
            'player_count': game.player_count,
            'players': [{"username": player.username, "id": player.id} for player in game.players.all()]
        })
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)


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


def is_valid_graph_string(graph_string):
    """Vérifie si la chaîne graphString est valide pour déterminer la fin de partie"""
    if not graph_string:
        return False

    # Une chaîne valide doit contenir au moins un point (A, B, C, etc.)
    if not any(c.isalpha() for c in graph_string):
        return False

    # Vérifier s'il y a des motifs suspects comme des points multiples consécutifs
    if '...' in graph_string:
        return False

    return True


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

        # Initialiser les variables de fin de partie
        game_over = False
        winner = None

        if move["type"] == "initialize_points":
            # Initialisation des points avec vérification des préférences
            if len(move["points"]) in game.point_options:
                game.state["points"] = move["points"]
            else:
                return JsonResponse({'error': 'Invalid number of points'}, status=400)

        elif move["type"] == "draw_curve":
            # Gestion des courbes (code existant)
            start_point = next((p for p in game.state["points"] if p["label"] == move["startPoint"]), None)
            end_point = next((p for p in game.state["points"] if p["label"] == move["endPoint"]), None)

            if not start_point or not end_point:
                return JsonResponse({'error': 'Invalid start or end point'}, status=400)

            # Vérifier si c'est une boucle (même point de départ et d'arrivée)
            is_self_loop = move["startPoint"] == move["endPoint"]

            # Vérifier la limite de connexions
            if is_self_loop and start_point["connections"] > 1:
                return JsonResponse({'error': 'Cannot create a loop on a point with more than 1 connection'},
                                    status=400)
            elif not is_self_loop and (start_point["connections"] >= 3 or end_point["connections"] >= 3):
                return JsonResponse({'error': 'Maximum connections reached for a point'}, status=400)

            # Normaliser la structure de la courbe
            curve_to_add = None
            if isinstance(move["curve"], list):
                curve_to_add = {"points": move["curve"], "player": request.user.id}
            else:
                curve_to_add = move["curve"]
                curve_to_add["player"] = request.user.id

            # Vérifier si la courbe existe déjà pour éviter les doublons
            curve_exists = False
            for i, existing_curve in enumerate(game.state.get("curves", [])):
                # Vérifier la structure
                if not isinstance(existing_curve, dict):
                    continue

                # Pour vérifier si les courbes sont les mêmes, on compare leurs points de début et de fin
                existing_points = existing_curve.get("points", [])
                new_points = curve_to_add.get("points", [])

                if len(existing_points) > 0 and len(new_points) > 0:
                    # Vérifier le premier et le dernier point
                    if (existing_points[0] == new_points[0] and existing_points[-1] == new_points[-1]) or \
                            (existing_points[0] == new_points[-1] and existing_points[-1] == new_points[0]):
                        curve_exists = True
                        break

            if not curve_exists:
                game.state.setdefault("curves", []).append(curve_to_add)

            # Mise à jour des connexions avec gestion des boucles
            for point in game.state["points"]:
                if point["label"] == move["startPoint"] and is_self_loop:
                    # Pour une boucle, ajouter 2 connexions
                    point["connections"] += 2
                elif point["label"] == move["startPoint"] or point["label"] == move["endPoint"]:
                    # Pour des points différents, ajouter 1 connexion
                    point["connections"] += 1

            if "graphString" in move:
                game.state["graphString"] = move["graphString"]
                print(f"graphString reçue: {move['graphString']}")
            else:
                print("Aucune graphString dans le mouvement")

                # Ne pas vérifier la fin de partie ici - attendre le placement du point
            game_over = False


        elif move["type"] == "place_point":

            # Ajout d'un point
            game.state["points"].append(move["point"])
            # Récupérer la chaîne graphString depuis le mouvement si disponible

            if "graphString" in move:
                game.state["graphString"] = move["graphString"]

            # Vérifier la validité de la chaîne avant de déterminer si la partie est terminée
            graph_string = game.state.get("graphString", "")
            print(f"Vérification de fin de partie avec graphString: {graph_string}")

            game_over = is_game_over(graph_string)



            if game_over:
                print("La partie est terminée!")
                # Le gagnant est le joueur qui a joué le dernier coup
                winner = request.user.username
                print(f"Le gagnant est: {winner}")
                game.status = 'completed'
                # Assurez-vous de stocker le gagnant dans l'état du jeu
                game.state["winner"] = winner

            else:

                # Ce n'est qu'après le placement d'un point que le tour change
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
            'points': game.state.get('points', []),
            'graphString': game.state.get('graphString', ''),
            'isGameOver': game_over,
            'winner': winner
        })

    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=400)

    except Exception as e:
        return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)


@csrf_exempt
@login_required(login_url='login')
def create_game(request):
    """Créer une nouvelle salle d'attente avec les préférences de points"""
    if request.method == 'GET':
        # Retourner l'ID du joueur
        return JsonResponse({'player_id': request.user.id}, status=200)

    elif request.method == 'POST':
        try:
            with transaction.atomic():
                data = json.loads(request.body.decode('utf-8'))
                point_options = data.get('pointOptions', [3])  # Par défaut, 3 points si non spécifié

                # Valider les options de points
                valid_options = [3, 4, 5, 6, 7]
                point_options = [opt for opt in point_options if opt in valid_options]

                if not point_options:
                    return JsonResponse({'error': 'No valid point options provided'}, status=400)

                # Vérifier si le joueur a déjà une salle d'attente
                existing_room = Game.objects.filter(
                    players=request.user,
                    status='waiting'
                ).first()

                if existing_room:
                    # Mettre à jour les options de points de la salle existante
                    existing_room.point_options = point_options
                    existing_room.save()
                    return JsonResponse({
                        'waiting_room_id': existing_room.id,
                        'status': existing_room.status,
                        'player_id': request.user.id,
                        'point_options': point_options
                    })

                # Créer une salle d'attente (pas encore une partie active)
                waiting_room = Game.objects.create(
                    status='waiting',
                    player_count=1,
                    current_player=request.user,
                    point_options=point_options,
                    state={"curves": [], "points": []},
                    from_queue=True  # Marquer explicitement comme venant de la file d'attente
                )
                waiting_room.players.add(request.user)
                waiting_room.player_ready = {str(request.user.id): False}
                waiting_room.save()

                return JsonResponse({
                    'waiting_room_id': waiting_room.id,
                    'status': waiting_room.status,
                    'player_id': request.user.id,
                    'point_options': point_options
                })

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)


def cleanup_games():
    """Nettoyer les parties non utilisées ou incohérentes"""
    try:
        # Supprimer les parties sans joueurs
        Game.objects.filter(player_count=0).delete()

        # Supprimer les parties en double - Garder seulement la plus récente pour chaque paire de joueurs
        games = Game.objects.filter(status__in=['started', 'in_progress']).order_by('-created_at')
        processed_pairs = set()

        for game in games:
            players = sorted([player.id for player in game.players.all()])
            players_key = tuple(players)

            if len(players) == 2:  # Seulement pour les parties 1v1
                if players_key in processed_pairs:
                    # Cette paire de joueurs a déjà une partie plus récente
                    game.status = 'abandoned'  # Marquer comme abandonnée au lieu de supprimer
                    game.save()
                else:
                    processed_pairs.add(players_key)
    except Exception as e:
        logger.error(f"Error in cleanup_games: {str(e)}")


def get_active_game(user):
    """Vérifier si un joueur a une partie active et retourner l'ID de cette partie"""
    active_game = Game.objects.filter(
        players=user,
        status__in=['started', 'in_progress']
    ).order_by('-created_at').first()

    return active_game


@csrf_exempt
@login_required(login_url='login')
def join_queue(request):
    """Rejoindre la file d'attente globale avec des préférences de points"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        # Vérifier si le joueur a déjà une partie active
        active_game = get_active_game(request.user)
        if active_game:
            return JsonResponse({
                'active_game': True,
                'game_id': active_game.id,
                'message': 'You have an active game, redirecting...'
            })

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
            existing_entry.ready = False  # Réinitialiser l'état "prêt"
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


# Modifier la fonction set_ready pour éviter la création de parties multiples
@csrf_exempt
@login_required(login_url='login')
def set_ready(request):
    """Marquer un joueur comme prêt dans la file d'attente et créer une partie si les deux joueurs sont prêts"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        # Utiliser un verrou global pour cette action critique
        from django.core.cache import cache
        import time

        # Tentative d'obtenir un verrou basé sur l'utilisateur
        lock_id = f"game_creation_lock_{request.user.id}"
        # L'acquisition du verrou est non-bloquante, si déjà verrouillé, on retourne un message d'attente
        acquire_lock = lambda: cache.add(lock_id, "true", 10)  # verrou de 10 secondes max
        release_lock = lambda: cache.delete(lock_id)

        if not acquire_lock():
            return JsonResponse({
                'success': False,
                'message': 'Une opération est déjà en cours, veuillez patienter...'
            })

        try:
            # Vérifier d'abord si le joueur a déjà une partie active
            active_game = get_active_game(request.user)
            if active_game:
                logger.info(f"Player {request.user.username} already has an active game with id {active_game.id}")
                return JsonResponse({
                    'success': True,
                    'message': 'Game already exists',
                    'game_id': active_game.id
                })

            # TRANSACTION CRITIQUE - Cela garantit l'atomicité de toutes les opérations suivantes
            with transaction.atomic():
                # Récupérer l'entrée du joueur dans la file d'attente avec verrou pour éviter les modifications concurrentes
                entry = QueueEntry.objects.select_for_update().get(user=request.user)

                # Marquer le joueur comme prêt (seulement s'il ne l'est pas déjà)
                if not entry.ready:
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

                # Verrouiller également l'entrée du joueur matché pour éviter les modifications concurrentes
                matched_entry = QueueEntry.objects.select_for_update().get(id=entry.matched_with.id)

                # Vérifier si l'adversaire est également prêt
                if not matched_entry.ready:
                    logger.info(
                        f"Player {request.user.username} is ready, opponent {matched_entry.user.username} is not ready yet")
                    return JsonResponse({
                        'success': True,
                        'message': 'Player ready, waiting for opponent',
                        'matched_also_ready': False
                    })

                # Vérifier encore une fois pour éviter les courses critiques
                active_game = get_active_game(request.user)
                if active_game:
                    return JsonResponse({
                        'success': True,
                        'message': 'Game found after check',
                        'game_id': active_game.id
                    })

                # Les deux joueurs sont prêts, rechercher ou créer une partie
                # Recherche avec verrouillage des enregistrements concernés
                existing_game = Game.objects.select_for_update().filter(
                    players=request.user
                ).filter(
                    players=matched_entry.user
                ).filter(
                    status__in=['started', 'in_progress'],
                    from_queue=True
                ).order_by('-created_at').first()

                if existing_game:
                    logger.info(f"Game already exists with id {existing_game.id}, returning that")
                    game_id = existing_game.id
                else:
                    # Double vérification - si le joueur adverse a déjà une partie, l'utiliser
                    opponent_active_game = get_active_game(matched_entry.user)
                    if opponent_active_game and request.user in opponent_active_game.players.all():
                        logger.info(f"Found opponent active game with id {opponent_active_game.id}")
                        return JsonResponse({
                            'success': True,
                            'message': 'Found via opponent',
                            'game_id': opponent_active_game.id
                        })

                    # Aucune partie existante, créer une nouvelle partie
                    common_points = set(entry.point_preferences).intersection(set(matched_entry.point_preferences))
                    if common_points:
                        selected_points = list(common_points)[0]
                    else:
                        selected_points = min(entry.point_preferences)

                    logger.info(
                        f"Creating game with {selected_points} points for players {request.user.username} and {matched_entry.user.username}")

                    # CRÉATION UNIQUE - Cette création est maintenant parfaitement protégée contre les doublons
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
                    game.players.add(request.user, matched_entry.user)
                    game.save()

                    game_id = game.id
                    logger.info(f"New game created with id {game_id}")

                    # Supprimer immédiatement les entrées de la file d'attente pour éviter les duplications
                    QueueEntry.objects.filter(id__in=[entry.id, matched_entry.id]).delete()
                    logger.info(f"Queue entries deleted for game {game_id}")

                # Retourner l'ID de la partie (nouvelle ou existante)
                return JsonResponse({
                    'success': True,
                    'message': 'Game created or found',
                    'game_id': game_id
                })

        finally:
            # S'assurer que le verrou est libéré même en cas d'erreur
            release_lock()

    except QueueEntry.DoesNotExist:
        logger.error(f"Player {request.user.username} not found in queue")
        return JsonResponse({'error': 'You are not in the queue'}, status=404)
    except Exception as e:
        logger.error(f"Error in set_ready: {str(e)}")
        return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)


# Modifier la fonction queue_status pour nettoyer la file d'attente correctement
@login_required(login_url='login')
def queue_status(request):
    """Obtenir le statut actuel dans la file d'attente"""
    try:
        # Vérifier si le joueur a déjà une partie active
        active_game = get_active_game(request.user)
        if active_game:
            return JsonResponse({
                'active_game': True,
                'game_id': active_game.id,
                'message': 'You have an active game, redirecting...'
            })

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

            # Vérifier si les deux joueurs sont prêts - NE PAS créer de partie ici
            if entry.ready and entry.matched_with.ready:
                # Vérifier si une partie a été créée pour ces joueurs
                recent_games = Game.objects.filter(
                    players=request.user
                ).filter(
                    players=entry.matched_with.user
                ).filter(
                    status__in=['started', 'in_progress'],
                    from_queue=True
                ).order_by('-created_at')[:1]

                if recent_games:
                    game = recent_games[0]
                    logger.info(
                        f"Found game {game.id} for players {request.user.username} and {entry.matched_with.user.username}")

                    response_data['game_created'] = True
                    response_data['game_id'] = game.id

                    # Supprimer immédiatement les entrées de la file d'attente
                    matched_user = entry.matched_with.user
                    QueueEntry.objects.filter(user__in=[request.user, matched_user]).delete()
                    logger.info(f"Queue entries deleted via queue_status for game {game.id}")
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
    """Quitter un jeu et informer l'autre joueur"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        # Utiliser un verrou pour éviter les concurrences
        with transaction.atomic():
            game = Game.objects.select_for_update().get(id=game_id)

            # Vérifier si le joueur est dans le jeu
            if request.user not in game.players.all():
                return JsonResponse({'error': 'You are not in this game'}, status=400)

            # Récupérer l'adversaire avant de modifier le jeu
            other_players = list(game.players.exclude(id=request.user.id))

            # Ajouter une information dans l'état du jeu pour indiquer qui a abandonné
            if not game.state:
                game.state = {}

            game.state['abandoned_by'] = request.user.username
            game.state['abandoned_at'] = datetime.now().isoformat()
            game.status = 'abandoned'  # Marquer le jeu comme abandonné
            game.save()

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

            # Vérifier toutes les parties actives du joueur et les marquer comme abandonnées
            other_games = Game.objects.filter(
                players=request.user,
                status__in=['waiting', 'in_progress', 'started']
            )
            for other_game in other_games:
                if other_game.id != game_id:  # Éviter de traiter deux fois le même jeu
                    other_game.status = 'abandoned'
                    other_game.save()

            # Retourner les informations sur l'abandon
            return JsonResponse({
                'success': True,
                'message': 'Left game successfully',
                'abandoned': True
            })

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
            return redirect(request.GET.get('next', '/home/'))
        else:
            messages.error(request, "Identifiants invalides. Veuillez réessayer.")
    else:
        if 'next' in request.GET:
            messages.error(request, "Vous devez être connecté pour accéder à cette page.")
    return render(request, 'login.html')

@csrf_exempt
def logout_view(request):
    logout(request)
    return redirect('login')


@login_required(login_url='login')
def ReactAppView(request):
    """Vue pour servir l'application React"""
    react_index_path = os.path.join(settings.BASE_DIR, 'frontend', 'build', 'index.html')
    try:
        with open(react_index_path, 'r', encoding='utf-8') as f:
            # Lire le contenu du fichier
            html_content = f.read()

            # Injecter les informations utilisateur si nécessaire
            if request.user.is_authenticated:
                user_data = {
                    'username': request.user.username,
                    'id': request.user.id,
                }
                user_script = f"""
                <script>
                window.USER_DATA = {json.dumps(user_data)};
                </script>
                """
                # Insérer juste avant la balise </head>
                html_content = html_content.replace('</head>', f'{user_script}</head>')

            return HttpResponse(html_content, content_type='text/html')
    except FileNotFoundError:
        return HttpResponse(
            "Le fichier React index.html n'existe pas. Assurez-vous d'avoir exécuté 'npm run build'.",
            status=404,
        )


def login_redirect_with_message(request):
    messages.error(request, "Vous devez être connecté pour accéder à cette page.")
    return redirect('login')

@login_required
def get_user_id(request):
    """Obtenir l'id de l'utilisateur connecté"""
    return JsonResponse({
        "id": request.user.id,
    })
    
@login_required
def get_user_name(request):
    """Obtenir le nom d'utilisateur de l'utilisateur connecté"""
    return JsonResponse({
        "username": request.user.username,
    })
    
@login_required
def get_user_info(request):
        """Obtenir le nom d'utilisateur & id de l'utilisateur connecté"""
        return JsonResponse({
        "id": request.user.id,
        "username": request.user.username,
    })
    
@login_required
@transaction.atomic
def get_user_games(request):
    user = request.user

    # Récupère tous les jeux où l'utilisateur est dans la relation ManyToMany
    games = Game.objects.filter(players=user)

    data = [
        {
            "game_id": game.id,
            "created_at": game.created_at.strftime("%Y-%m-%d %H:%M") if game.created_at else None,
            "status": game.status if hasattr(game, "status") else "inconnu",
        }
        for game in games
    ]

    return JsonResponse(data, safe=False)

@login_required
@csrf_exempt
def check_game_over(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            chain = data.get('chain')
            if not chain:
                return JsonResponse({'error': 'Chain is required'}, status=400)

            game_over = is_game_over(chain)
            return JsonResponse({'game_over': game_over})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@login_required
def game_summary(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
    except Game.DoesNotExist:
        raise Http404("Partie non trouvée")

    data = {
        "game_id": game.id,
        "status": game.status if hasattr(game, 'status') else "inconnu",
        "created_at": game.created_at.strftime("%Y-%m-%d %H:%M") if hasattr(game, 'created_at') else "inconnu",
        "players": [player.username for player in game.players.all()]  # relation ManyToMany
    }

    return JsonResponse(data)