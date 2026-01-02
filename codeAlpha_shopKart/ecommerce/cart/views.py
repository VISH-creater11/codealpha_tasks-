from django.shortcuts import render, redirect, get_object_or_404
from products.models import Product
from .models import Cart, CartItem


def _get_cart(request):
    """
    Helper function to get or create cart using session
    """
    cart_id = request.session.get("cart_id")

    if cart_id:
        cart = Cart.objects.get(id=cart_id)
    else:
        cart = Cart.objects.create()
        request.session["cart_id"] = cart.id

    return cart


def add_to_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    cart = _get_cart(request)

    item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product
    )

    if not created:
        item.quantity += 1
    item.save()

    return redirect("/cart/")


def view_cart(request):
    cart_id = request.session.get("cart_id")

    if not cart_id:
        return render(request, "cart/cart.html", {
            "items": [],
            "total": 0
        })

    cart = Cart.objects.get(id=cart_id)
    items = CartItem.objects.filter(cart=cart)

    total = sum(item.product.price * item.quantity for item in items)

    return render(request, "cart/cart.html", {
        "items": items,
        "total": total
    })


def increase_quantity(request, item_id):
    item = get_object_or_404(CartItem, id=item_id)
    item.quantity += 1
    item.save()
    return redirect("/cart/")


def decrease_quantity(request, item_id):
    item = get_object_or_404(CartItem, id=item_id)

    if item.quantity > 1:
        item.quantity -= 1
        item.save()
    else:
        item.delete()

    return redirect("/cart/")
