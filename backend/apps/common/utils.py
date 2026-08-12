from __future__ import annotations

import uuid
from pathlib import Path
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from django.utils.deconstruct import deconstructible

AUDIO_EXTENSIONS = ('.mp3', '.wav', '.flac')
IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg')
MAX_AUDIO_SIZE = 25 * 1024 * 1024
MAX_IMAGE_SIZE = 5 * 1024 * 1024

def unique_handle(value: str, prefix: str = '@') -> str:
    base = slugify(value, allow_unicode=True).replace('-', '_').strip('_')
    base = base or 'user'
    return f'{prefix}{base}_{uuid.uuid4().hex[:4]}'

@deconstructible
class UploadTo:
    """Scatter uploads into `<prefix>/<random>/<random><ext>` under MEDIA_ROOT."""

    def __init__(self, prefix: str):
        self.prefix = prefix

    def __call__(self, instance, filename: str) -> str:
        ext = Path(filename).suffix.lower()
        return f'{self.prefix}/{uuid.uuid4().hex[:2]}/{uuid.uuid4().hex}{ext}'

def validate_audio_file(value):
    if Path(value.name).suffix.lower() not in AUDIO_EXTENSIONS:
        raise ValidationError(f'Supported audio formats: {", ".join(AUDIO_EXTENSIONS)}.')
    if value.size and value.size > MAX_AUDIO_SIZE:
        raise ValidationError('Audio file must be smaller than 25 MB.')

def validate_image_file(value):
    if Path(value.name).suffix.lower() not in IMAGE_EXTENSIONS:
        raise ValidationError(f'Supported image formats: {", ".join(IMAGE_EXTENSIONS)}.')
    if value.size and value.size > MAX_IMAGE_SIZE:
        raise ValidationError('Image must be smaller than 5 MB.')
