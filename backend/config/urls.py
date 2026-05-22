from django.contrib import admin
from django.urls import path
from core.api import api

urlpatterns = [
    path('api/', api.urls),
]