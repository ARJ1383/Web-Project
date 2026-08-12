from rest_framework import serializers
from .models import Payout

class PayoutSerializer(serializers.ModelSerializer):
    artist_id = serializers.IntegerField(source='artist.id', read_only=True)
    artist_name = serializers.CharField(source='artist.display_name', read_only=True)

    class Meta:
        model = Payout
        fields = (
            'id',
            'artist_id',
            'artist_name',
            'month',
            'unique_listeners',
            'monthly_streams',
            'reward_amount',
            'status',
            'settled_at',
        )
        read_only_fields = fields
