from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Game
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import logout
import os
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.contrib import messages
import requests
import logging


def index(request):
    return render(request, 'index.html')

@csrf_exempt


@login_required(login_url='login')  # Redirige vers la page de connexion si non connecté
def game_view(request, game_id):
    game = Game.objects.get(id=game_id)
    # Logique pour récupérer l'état du jeu
    return JsonResponse(game.state)

# Configure the logger
logger = logging.getLogger(__name__)

def join_game(request):
    try:
        logger.debug("Join game view called")

        # Logique pour créer ou rejoindre une salle d'attente
        game = Game.objects.filter(status='waiting').first()
        if game:
            game.player_count += 1
            logger.info(f"Player joined game {game.id}. Current players: {game.player_count}")
            if game.player_count >= 2:
                game.status = 'in_progress'
            game.save()
        else:
            game = Game.objects.create(status='waiting', player_count=1)
            logger.info(f"New game created with ID: {game.id}")

        return JsonResponse({'game_id': game.id, 'status': game.status})
    except Exception as e:
        # Loggez l'erreur pour le débogage
        logger.error(f"Error in join_game: {e}")
        return JsonResponse({'error': 'An error occurred while joining the game.'}, status=500)
def list_games(request):
    games = Game.objects.all().values('id', 'status', 'player_count')
    return JsonResponse(list(games), safe=False)


def game_status(request, game_id):
    try:
        game = Game.objects.get(id=game_id)

        # Vérifie si le jeu doit démarrer
        if game.player_count >= 2 and game.status == "waiting":
            game.status = "started"
            game.save()

        return JsonResponse({
            'status': game.status,
            'player_count': game.player_count
        })
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found'}, status=404)


def start_game(request, game_id):
    try:
        game = Game.objects.get(id=game_id)

        if game.player_count >= 2 and game.status == "waiting":
            game.status = "started"
            game.save()
            return JsonResponse({'success': True, 'message': 'Game started'})

        return JsonResponse({'success': False, 'message': 'Not enough players'})
    except Game.DoesNotExist:
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