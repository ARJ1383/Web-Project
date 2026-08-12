from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.catalog.models import SubscriptionPlan
from .models import Payment, PaymentStatus

class PaymentAPITests(APITestCase):
    def setUp(self):
        SubscriptionPlan.objects.create(code='basic', name='Basic', monthly_price=0)
        self.plan = SubscriptionPlan.objects.create(
            code='gold', name='Gold', monthly_price=199000, sort_order=3
        )
        self.user = User.objects.create_user(
            email='listener@example.com', password='password12345', display_name='Listener'
        )
        self.client.force_authenticate(self.user)

    def _start(self, months=3):
        with patch(
            'apps.billing.views.request_payment',
            return_value=('AUTH123', 'https://sandbox.zarinpal.com/pg/StartPay/AUTH123'),
        ):
            return self.client.post(
                reverse('payment-start'), {'plan': self.plan.id, 'months': months}, format='json'
            )

    def test_start_creates_a_pending_payment_with_a_gateway_url(self):
        response = self._start()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('StartPay/AUTH123', response.data['payment_url'])
        payment = Payment.objects.get(authority='AUTH123')
        self.assertEqual(payment.status, PaymentStatus.PENDING)
        self.assertEqual(str(payment.amount), '597000.00')

    def test_free_plan_needs_no_payment(self):
        basic = SubscriptionPlan.objects.get(code='basic')
        response = self.client.post(
            reverse('payment-start'), {'plan': basic.id, 'months': 1}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_duration_is_rejected(self):
        response = self.client.post(
            reverse('payment-start'), {'plan': self.plan.id, 'months': 5}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_activates_the_subscription(self):
        self._start(months=1)
        response = self.client.post(
            reverse('payment-verify'), {'authority': 'AUTH123', 'status': 'OK'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.subscription_tier, 'gold')
        self.assertTrue(self.user.subscription_active)
        self.assertTrue(self.user.notifications.exists())

    def test_cancelled_payment_leaves_the_plan_untouched(self):
        self._start()
        response = self.client.post(
            reverse('payment-verify'), {'authority': 'AUTH123', 'status': 'NOK'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertEqual(self.user.subscription_tier, 'basic')
        self.assertEqual(Payment.objects.get(authority='AUTH123').status, PaymentStatus.FAILED)

    def test_a_payment_cannot_be_verified_twice(self):
        self._start()
        self.client.post(
            reverse('payment-verify'), {'authority': 'AUTH123', 'status': 'OK'}, format='json'
        )
        response = self.client.post(
            reverse('payment-verify'), {'authority': 'AUTH123', 'status': 'OK'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_payments_of_other_users_are_not_listed(self):
        self._start()
        other = User.objects.create_user(
            email='other@example.com', password='password12345', display_name='Other'
        )
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get(reverse('payment-list')).data['count'], 0)
