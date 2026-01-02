from django.shortcuts import render, get_object_or_404
from .models import Product

def product_list(request):
    query = request.GET.get("q")

    if query:
        products = Product.objects.filter(name__icontains=query)
    else:
        products = Product.objects.all()

    return render(request, "products/list.html", {
        "products": products,
        "query": query
    })


def product_detail(request, id):
    product = get_object_or_404(Product, id=id)
    return render(request, "products/detail.html", {
        "product": product
    })
