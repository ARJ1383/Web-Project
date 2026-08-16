from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Iterable

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors

from .models import PlayEvent, Song


@dataclass
class TrainedRecommender:
    """A fitted content model trained from the current song catalog."""

    vectorizer: TfidfVectorizer
    model: NearestNeighbors
    song_ids: list[int]



def _song_document(song: Song) -> str:
    """Convert catalog metadata into the text representation learned by TF-IDF."""
    collaborators = " ".join(str(value) for value in (song.collaborators or []))
    return " ".join(
        part.strip()
        for part in (
            song.title,
            song.genre,
            song.album.title if song.album_id else "",
            song.artist.display_name,
            song.artist.username,
            collaborators,
            str(song.release_year or ""),
        )
        if part and part.strip()
    )



def train_model(songs: Iterable[Song]) -> TrainedRecommender | None:
    """Fit TF-IDF + nearest-neighbour model on the current catalog."""
    songs = list(songs)
    if len(songs) < 2:
        return None

    documents = [_song_document(song) for song in songs]
    vectorizer = TfidfVectorizer(lowercase=True, ngram_range=(1, 2), min_df=1)
    matrix = vectorizer.fit_transform(documents)

    model = NearestNeighbors(metric="cosine", algorithm="brute", n_neighbors=min(20, len(songs)))
    model.fit(matrix)
    return TrainedRecommender(vectorizer=vectorizer, model=model, song_ids=[song.id for song in songs])



def _popularity_score(song: Song) -> float:
    # Popularity is only a cold-start tie-breaker, never a random choice.
    import math

    return math.log1p(max(0, song.streams_count)) + 0.5 * math.log1p(max(0, song.listeners_count))



def _history(user_id: int, candidate_ids: set[int], limit: int = 40) -> list[PlayEvent]:
    return list(
        PlayEvent.objects.filter(user_id=user_id, song_id__in=candidate_ids)
        .select_related("song", "song__album", "song__artist")
        .order_by("-created_at")[:limit]
    )



def recommend_for_user(
    user_id: int,
    songs: Iterable[Song],
    limit: int = 6,
) -> list[tuple[Song, float, str]]:
    """Train on catalog metadata and rank songs from the user's real listening history."""
    songs = list(songs)
    if not songs or limit <= 0:
        return []

    model_data = train_model(songs)
    if model_data is None:
        return [(song, _popularity_score(song), "محبوب‌ترین آهنگ‌ها") for song in sorted(
            songs, key=_popularity_score, reverse=True
        )[:limit]]

    by_id = {song.id: song for song in songs}
    history = _history(user_id, set(by_id))
    if not history:
        popular = sorted(songs, key=_popularity_score, reverse=True)[:limit]
        return [(song, _popularity_score(song), "پیشنهاد بر اساس محبوبیت آهنگ‌ها") for song in popular]

    song_id_to_index = {song_id: index for index, song_id in enumerate(model_data.song_ids)}
    aggregated: dict[int, float] = defaultdict(float)
    reasons: dict[int, tuple[float, str]] = {}

    for position, event in enumerate(history):
        if event.song_id not in song_id_to_index:
            continue

        distance, neighbours = model_data.model.kneighbors(
            model_data.vectorizer.transform([_song_document(event.song)]),
            n_neighbors=min(12, len(songs)),
        )
        recency_weight = 1.0 / (1.0 + position * 0.35)

        for similarity_distance, neighbour_index in zip(distance[0], neighbours[0]):
            neighbour_id = model_data.song_ids[int(neighbour_index)]
            if neighbour_id == event.song_id:
                continue
            similarity = max(0.0, 1.0 - float(similarity_distance))
            score = similarity * recency_weight
            aggregated[neighbour_id] += score

            current = reasons.get(neighbour_id)
            if current is None or score > current[0]:
                reasons[neighbour_id] = (
                    score,
                    f"مشابه آهنگ‌هایی که اخیراً گوش داده‌اید: «{event.song.title}»",
                )

    played_ids = {event.song_id for event in history}
    unseen = [song for song in songs if song.id not in played_ids]
    pool = unseen if len(unseen) >= limit else songs

    def final_score(song: Song) -> float:
        model_score = aggregated.get(song.id, 0.0)
        popularity = _popularity_score(song)
        return model_score * 10.0 + popularity * 0.05

    ranked = sorted(pool, key=final_score, reverse=True)[:limit]
    result: list[tuple[Song, float, str]] = []
    for song in ranked:
        score = final_score(song)
        reason = reasons.get(song.id, (0.0, "پیشنهاد بر اساس الگوی سلیقه شما"))[1]
        result.append((song, score, reason))
    return result
