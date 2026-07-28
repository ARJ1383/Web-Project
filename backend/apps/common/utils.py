from __future__ import annotations

import uuid
from pathlib import Path
from django.utils.text import slugify
from django.utils.deconstruct import deconstructible

def unique_handle(value: str, prefix: str = '@') -> str:
    base = slugify(value, allow_unicode=True).replace('-', '_').strip('_')
    base = base or 'user'
    return f'{prefix}{base}_{uuid.uuid4().hex[:4]}'

@deconstructible
class UploadTo:
    def __init__(self, prefix: str):
        self.prefix = prefix

    def __call__(self, instance, filename: str) -> str:
        ext = Path(filename).suffix.lower()
        instance_id = getattr(instance, 'id', None)
        instance_part = instance_id.hex if hasattr(instance_id, 'hex') else 'temp'
        return f'{self.prefix}/{instance_part}/{uuid.uuid4().hex}{ext}'