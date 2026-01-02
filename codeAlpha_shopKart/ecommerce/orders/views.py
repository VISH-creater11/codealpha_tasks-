from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from cart.models import Cart
from .models import Order, OrderItem

@login_required
def checkout(request):
    cart = Cart.objects.get(user=request.user)
    items = cart.cartitem_set.all()

    if request.method == "POST":
        order = Order.objects.create(user=request.user)

        for item in items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )

        # clear cart
        items.delete()

        return render(request, "orders/success.html", {"order": order})

    return render(request, "orders/checkout.html", {"items": items})
