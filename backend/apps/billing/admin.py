from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'months', 'amount', 'status', 'created_at')
    list_filter = ('status', 'plan')
    search_fields = ('authority', 'ref_id', 'user__email')
