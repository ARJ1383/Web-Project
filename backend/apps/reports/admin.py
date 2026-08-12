from django.contrib import admin
from .models import Payout

@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ('artist', 'month', 'unique_listeners', 'monthly_streams', 'reward_amount', 'status')
    list_filter = ('status', 'month')
