from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Game
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.views.generic import TemplateView
import os
from django.conf import settings

def index(request):
    return render(request, 'index.html')

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False})

def game_view(request, game_id):
    game = Game.objects.get(id=game_id)
    # Logique pour récupérer l'état du jeu
    return JsonResponse(game.state)


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
            return redirect('game_list')  # Redirige vers une liste de parties ou une autre page
        else:
            return render(request, 'login.html', {'error': 'Identifiants invalides'})
    return render(request, 'login.html')

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('/app/')  # Redirige vers l'application React
        else:
            return render(request, 'login.html', {'error': 'Identifiants invalides'})
    return render(request, 'login.html')


def logout_view(request):
    logout(request)  # Déconnecte l'utilisateur
    return redirect('login')  # Redirige vers la page de connexion

from django.http import HttpResponse
import os
from django.conf import settings

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