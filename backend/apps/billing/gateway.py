from __future__ import annotations

import requests
from django.conf import settings


class GatewayError(Exception):
    pass


def _gateway_url(path: str) -> str:
    return f'{settings.ZARINPAL_BASE_URL.rstrip("/")}/pg/v4/payment/{path}.json'


def request_payment(amount: int, description: str, callback_url: str) -> tuple[str, str]:
    """Request a real ZarinPal authority and return its StartPay URL."""
    payload = {
        'merchant_id': settings.ZARINPAL_MERCHANT_ID,
        'amount': int(amount),
        'description': description,
        'callback_url': callback_url,
    }

    try:
        response = requests.post(_gateway_url('request'), json=payload, timeout=10)
        response.raise_for_status()
        body = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise GatewayError('Payment gateway is unavailable.') from exc

    data = body.get('data') or {}
    code = data.get('code')
    authority = data.get('authority')
    if code not in (100, 101) or not authority:
        errors = body.get('errors') or []
        message = str(errors[0]) if errors else 'Payment gateway rejected the payment request.'
        raise GatewayError(message)

    start_pay_url = f'{settings.ZARINPAL_BASE_URL.rstrip("/")}/pg/StartPay/{authority}'
    return authority, start_pay_url


def verify_payment(amount: int, authority: str) -> tuple[str, str]:
    """Verify a payment with ZarinPal and return (ref_id, gateway_message)."""
    payload = {
        'merchant_id': settings.ZARINPAL_MERCHANT_ID,
        'amount': int(amount),
        'authority': authority,
    }

    try:
        response = requests.post(_gateway_url('verify'), json=payload, timeout=10)
        response.raise_for_status()
        body = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise GatewayError('Payment verification gateway is unavailable.') from exc

    data = body.get('data') or {}
    code = data.get('code')
    if code not in (100, 101):
        errors = body.get('errors') or []
        message = str(errors[0]) if errors else 'Payment gateway verification failed.'
        raise GatewayError(message)

    ref_id = str(data.get('ref_id') or '')
    message = 'Payment verified by ZarinPal.' if code == 100 else 'Payment was already verified by ZarinPal.'
    return ref_id, message
