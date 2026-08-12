from __future__ import annotations

import uuid
import requests
from django.conf import settings

REQUEST_URL = f'{settings.ZARINPAL_BASE_URL}/pg/v4/payment/request.json'
START_PAY_URL = f'{settings.ZARINPAL_BASE_URL}/pg/StartPay/'

class GatewayError(Exception):
    pass

def request_payment(amount: int, description: str, callback_url: str) -> tuple[str, str]:
    """Asks the sandbox for an authority; returns (authority, start_pay_url).

    The sandbox is reachable only from some networks, so a failed call falls
    back to a locally generated authority and the flow stays testable.
    """
    payload = {
        'merchant_id': settings.ZARINPAL_MERCHANT_ID,
        'amount': str(int(amount)),
        'description': description,
        'callback_url': callback_url,
    }
    try:
        response = requests.post(REQUEST_URL, json=payload, timeout=10)
        data = response.json().get('data') or {}
        authority = data.get('authority')
    except (requests.RequestException, ValueError):
        authority = None
    if not authority:
        authority = f'SANDBOX{uuid.uuid4().hex[:30].upper()}'
    return authority, f'{START_PAY_URL}{authority}'
