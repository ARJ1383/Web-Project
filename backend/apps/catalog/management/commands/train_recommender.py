from django.core.management.base import BaseCommand

from apps.catalog.models import Song
from apps.catalog.recommender import train_model


class Command(BaseCommand):
    help = 'Train the music recommendation model on the current song catalog.'

    def handle(self, *args, **options):
        songs = list(Song.objects.select_related('artist', 'album').filter(is_released=True))
        model = train_model(songs)
        if model is None:
            self.stdout.write(self.style.WARNING('Need at least 2 released songs to train the recommender.'))
            return
        self.stdout.write(
            self.style.SUCCESS(f'Trained recommender on {len(model.song_ids)} songs.')
        )
