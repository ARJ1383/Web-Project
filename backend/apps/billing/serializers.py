from rest_framework import serializers
from apps.catalog.models import SubscriptionPlan
from .models import Payment

ALLOWED_MONTHS = (1, 3, 6, 12)

class PaymentSerializer(serializers.ModelSerializer):
    plan_code = serializers.CharField(source='plan.code', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id',
            'plan',
            'plan_code',
            'months',
            'amount',
            'status',
            'authority',
            'ref_id',
            'gateway_message',
            'created_at',
        )
        read_only_fields = fields

class PaymentCreateSerializer(serializers.Serializer):
    plan = serializers.PrimaryKeyRelatedField(queryset=SubscriptionPlan.objects.filter(is_active=True))
    months = serializers.ChoiceField(choices=ALLOWED_MONTHS, default=1)

    def validate_plan(self, plan):
        if plan.monthly_price <= 0:
            raise serializers.ValidationError('This plan is free and needs no payment.')
        return plan

class PaymentVerifySerializer(serializers.Serializer):
    authority = serializers.CharField()
    status = serializers.CharField(default='OK')
