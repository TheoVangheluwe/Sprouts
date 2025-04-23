from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class CustomUserCreationForm(UserCreationForm):
    username = forms.CharField(
        max_length=20,
        label="Nom d'utilisateur",
        help_text="Requis. 20 caractères maximum. Lettres, chiffres et @/./+/-/_ uniquement.",
        widget=forms.TextInput(attrs={'placeholder': "Nom d'utilisateur"})
    )

    password1 = forms.CharField(
        label="Mot de passe",
        widget=forms.PasswordInput(attrs={'placeholder': 'Mot de passe'}),
        help_text="Votre mot de passe doit contenir au moins 8 caractères, ne pas être trop commun, etc."
    )

    password2 = forms.CharField(
        label="Confirmation du mot de passe",
        widget=forms.PasswordInput(attrs={'placeholder': 'Confirmation du mot de passe'}),
        help_text="Veuillez saisir le même mot de passe que précédemment pour vérification."
    )

    class Meta:
        model = User
        fields = ['username', 'password1', 'password2']
