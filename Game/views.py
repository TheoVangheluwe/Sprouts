from django.shortcuts import render

def draw_canvas(request):
    return render(request, 'Game/canvas.html')
