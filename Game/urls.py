from django.urls import path
from .views import draw_canvas

urlpatterns = [
    path('', draw_canvas, name='draw_canvas'),
]
