from .models import Cart, CartItem


def cart_count(request):
    cart_id = request.session.get("cart_id")

    if not cart_id:
        return {"cart_count": 0}

    count = CartItem.objects.filter(cart_id=cart_id).count()
    return {"cart_count": count}
