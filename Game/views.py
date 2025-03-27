from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Game
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import logout
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib import messages
import os
import logging
import json

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
            logger.info(f"Player joined game {game.id}. Current players: {game.player_count}")
            if game.player_count >= 2:
                game.status = 'in_progress'
                game.current_player = game.players.first()
            game.save()
        else:
            game = Game.objects.create(status='waiting', player_count=1, current_player=request.user)
            game.players.add(request.user)
            logger.info(f"New game created with ID: {game.id}")

        return JsonResponse({'game_id': game.id, 'status': game.status, 'player_id': request.user.id})
    except Exception as e:
        logger.error(f"Error in join_game: {e}")
        return JsonResponse({'error': 'An error occurred while joining the game.'}, status=500)

def list_games(request):
    games = Game.objects.all().values('id', 'status', 'player_count')
    return JsonResponse(list(games), safe=False)

@login_required(login_url='login')
def game_status(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        players = [
            {"username": player.username, "id": player.id, "ready": game.player_ready.get(str(player.id), False)}
            for player in game.players.all()
        ]
        return JsonResponse({
            'status': game.status,
            'player_count': game.player_count,
            'players': players
        })
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)

@login_required(login_url='login')
def game_state(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        return JsonResponse({
            'status': game.status,
            'state': game.state,
            'currentPlayer': game.current_player.id
        })
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)

@csrf_exempt
@login_required(login_url='login')
def set_ready(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        game.player_ready[str(request.user.id)] = True
        game.save()

        if game.is_ready():
            game.status = "started"
            game.save()
            return JsonResponse({'success': True, 'message': 'Game started'})

        return JsonResponse({'success': True, 'message': 'Player ready'})
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)

@csrf_exempt
@login_required(login_url='login')
def start_game(request, game_id):
    logger.debug("start_game view called")
    try:
        game = Game.objects.get(id=game_id)
        logger.info(f"Game {game_id} status: {game.status}, players: {game.player_count}")

        if game.player_count >= 2 and game.status == "waiting" and all(game.player_ready.values()):
            game.status = "started"
            game.save()
            logger.info(f"Game {game_id} started")
            return JsonResponse({'success': True, 'message': 'Game started'})

        return JsonResponse({'success': False, 'message': 'Not all players are ready'})
    except Game.DoesNotExist:
        logger.error(f"Game with id {game_id} does not exist.")
        return JsonResponse({'error': 'Game not found'}, status=404)

@csrf_exempt
@login_required(login_url='login')
def make_move(request, game_id):
    if request.method == 'POST':
        try:
            logger.debug(f"Received move request for game_id: {game_id}")
            game = Game.objects.get(id=game_id)

            # On suppose que la requête contient le mouvement dans le corps JSON
            move = json.loads(request.body.decode('utf-8')).get('move')
            logger.debug(f"Move received: {move}")

            if not move:
                logger.error("Move data is missing")
                return JsonResponse({'error': 'Move data is missing'}, status=400)

            # Logique pour traiter le mouvement et mettre à jour l'état du jeu
            # Exemple de mise à jour de l'état du jeu
            game.state = move  # Remplacer par la logique réelle pour mettre à jour l'état du jeu
            game.save()
            logger.debug(f"Game state updated: {game.state}")

            return JsonResponse({'state': game.state, 'currentPlayer': game.current_player.id})
        except Game.DoesNotExist:
            logger.error(f"Game with id {game_id} does not exist.")
            return JsonResponse({'error': 'Game not found'}, status=404)
        except json.JSONDecodeError:
            logger.error("Invalid JSON format in request body")
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
        except Exception as e:
            logger.error(f"Error in make_move: {e}")
            return JsonResponse({'error': 'An error occurred while making the move.'}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

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