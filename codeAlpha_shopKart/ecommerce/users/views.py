from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout


def register(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password1 = request.POST.get("password1")
        password2 = request.POST.get("password2")

        # check if passwords match
        if password1 != password2:
            return render(
                request,
                "users/register.html",
                {"error": "Passwords do not match"}
            )

        # check if username exists
        if User.objects.filter(username=username).exists():
            return render(
                request,
                "users/register.html",
                {"error": "Username already exists. Please choose another."}
            )

        # create user
        user = User.objects.create_user(
            username=username,
            password=password1
        )
        user.save()

        return redirect("login")

    return render(request, "users/register.html")


def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect("/")
        else:
            return render(
                request,
                "users/login.html",
                {"error": "Invalid username or password"}
            )

    return render(request, "users/login.html")


def logout_view(request):
    logout(request)
    return redirect("/")
