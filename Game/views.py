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

# Configure the logger
logger = logging.getLogger(__name__)

def index(request):
    return render(request, 'index.html')

@csrf_exempt
@login_required(login_url='login')  # Redirige vers la page de connexion si non connecté
def game_view(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        return JsonResponse({'status': game.status, 'player_count': game.player_count, 'players': [{"username": player.username} for player in game.players.all()]})
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)

@csrf_exempt
@login_required(login_url='login')  # Redirige vers la page de connexion si non connecté
def join_game(request):
    try:
        logger.debug("Join game view called")

        # Logique pour créer ou rejoindre une salle d'attente
        game = Game.objects.filter(status='waiting').first()
        if game:
            game.player_count += 1
            game.players.add(request.user)  # Ajoute l'utilisateur au jeu
            logger.info(f"Player joined game {game.id}. Current players: {game.player_count}")
            if game.player_count >= 2:
                game.status = 'in_progress'
                game.current_player = game.players.first()  # Définir le premier joueur comme joueur actuel
            game.save()
        else:
            game = Game.objects.create(status='waiting', player_count=1, current_player=request.user)
            game.players.add(request.user)  # Ajoute l'utilisateur au jeu
            logger.info(f"New game created with ID: {game.id}")

        return JsonResponse({'game_id': game.id, 'status': game.status})
    except Exception as e:
        # Loggez l'erreur pour le débogage
        logger.error(f"Error in join_game: {e}")
        return JsonResponse({'error': 'An error occurred while joining the game.'}, status=500)

def list_games(request):
    games = Game.objects.all().values('id', 'status', 'player_count')
    return JsonResponse(list(games), safe=False)

@login_required(login_url='login')  # Redirige vers la page de connexion si non connecté
def game_status(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        players = [
            {
                "username": player.username,
                "ready": game.player_ready.get(str(player.id), False)
            }
            for player in game.players.all()
        ]
        return JsonResponse({
            'status': game.status,
            'player_count': game.player_count,
            'players': players
        })
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)

@login_required(login_url='login')  # Redirige vers la page de connexion si non connecté
def game_state(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        return JsonResponse({
            'status': game.status,
            'state': game.state,  # Assurez-vous que l'état du jeu est renvoyé
            'currentPlayer': game.current_player.username
        })
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)

@csrf_exempt
@login_required(login_url='login')
def set_ready(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        game.player_ready[request.user.id] = True
        game.save()

        if game.is_ready():
            game.status = "started"
            game.save()
            return JsonResponse({'success': True, 'message': 'Game started'})

        return JsonResponse({'success': True, 'message': 'Player ready'})
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)

@csrf_exempt  # Désactiver temporairement la protection CSRF pour diagnostiquer le problème
@login_required(login_url='login')  # Redirige vers la page de connexion si non connecté
def start_game(request, game_id):
    logger.debug("start_game view called")
    try:
        game = Game.objects.get(id=game_id)
        logger.info(f"Game {game_id} status: {game.status}, players: {game.player_count}")

        # Vérifiez si tous les joueurs sont prêts
        if game.player_count >= 2 and game.status == "waiting" and all(game.player_ready.values()):
            game.status = "started"
            game.save()
            logger.info(f"Game {game_id} started")
            return JsonResponse({'success': True, 'message': 'Game started'})

        return JsonResponse({'success': False, 'message': 'Not all players are ready'})
    except Game.DoesNotExist:
        logger.error(f"Game with id {game_id} does not exist.")
        return JsonResponse({'error': 'Game not found'}, status=404)

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()  # Sauvegarde l'utilisateur dans la base de données
            return redirect('login')  # Redirige vers la page de connexion
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
            return redirect(request.GET.get('next', '/app/'))  # Redirige vers la page demandée ou /app/
        else:
            messages.error(request, "Identifiants invalides. Veuillez réessayer.")
            print("Message ajouté : Identifiants invalides.")  # Debug
    else:
        if 'next' in request.GET:
            messages.error(request, "Vous devez être connecté pour accéder à cette page.")
            print("Message ajouté : Vous devez être connecté.")  # Debug
    return render(request, 'login.html')

def logout_view(request):
    logout(request)  # Déconnecte l'utilisateur
    return redirect('login')  # Redirige vers la page de connexion

@login_required(login_url='login')  # Redirige vers la page de connexion si non connecté
def ReactAppView(request):
    # Chemin vers le fichier index.html généré par React
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