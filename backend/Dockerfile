FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends libjpeg62-turbo zlib1g \
  && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt backend/requirements-recommender.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-recommender.txt

COPY backend/ .
# seed_demo resolves demo audio via repo-root/public/audio (parents[5] from the command module).
COPY public/audio /public/audio

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && python manage.py seed_demo && python manage.py runserver 0.0.0.0:8000"]
