from rest_framework import serializers
from .models import Ticket, TicketMessage

class TicketMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketMessage
        fields = ('id', 'sender_role', 'sender_name', 'body', 'created_at')
        read_only_fields = ('id', 'sender_role', 'sender_name', 'created_at')

class TicketSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_name = serializers.CharField(source='user.display_name', read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = (
            'id',
            'user_id',
            'user_name',
            'subject',
            'status',
            'messages',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'status', 'created_at', 'updated_at')

class TicketCreateSerializer(serializers.ModelSerializer):
    body = serializers.CharField(write_only=True)

    class Meta:
        model = Ticket
        fields = ('id', 'subject', 'body')
        read_only_fields = ('id',)
