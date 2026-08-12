from __future__ import annotations

from datetime import date
from decimal import Decimal
from django.conf import settings
from django.db.models import Count, Sum
from django.utils import timezone
from apps.accounts.models import ArtistStatusChoices, RoleChoices, User
from apps.billing.models import Payment, PaymentStatus
from apps.catalog.models import PlayEvent, Song, SubscriptionPlan
from apps.support.models import Ticket, TicketStatus
from .models import Payout, PayoutStatus

def current_month() -> str:
    return timezone.localdate().strftime('%Y-%m')

def _month_bounds(month: str) -> tuple[date, date]:
    year, mon = (int(part) for part in month.split('-'))
    start = date(year, mon, 1)
    end = date(year + (mon == 12), (mon % 12) + 1, 1)
    return start, end

def reward_for(unique_listeners: int, streams: int) -> Decimal:
    return Decimal(unique_listeners) * settings.PAYOUT_PER_LISTENER + Decimal(
        streams
    ) * settings.PAYOUT_PER_STREAM

def artist_report(artist: User, month: str | None = None) -> dict:
    """Everything the artist studio shows, aggregated in the database."""
    month = month or current_month()
    start, end = _month_bounds(month)
    plays = PlayEvent.objects.filter(artist=artist)
    monthly = plays.filter(created_at__date__gte=start, created_at__date__lt=end)
    songs = Song.objects.filter(artist=artist)
    totals = songs.aggregate(
        streams=Sum('streams_count'), listeners=Sum('listeners_count'), revenue=Sum('revenue')
    )
    return {
        'month': month,
        'song_count': songs.count(),
        'album_count': artist.albums.count(),
        'follower_count': artist.follower_links.count(),
        'total_streams': totals['streams'] or 0,
        'total_listeners': totals['listeners'] or 0,
        'total_revenue': totals['revenue'] or Decimal('0.00'),
        'unique_listeners': plays.values('user').distinct().count(),
        'monthly_streams': monthly.count(),
        'monthly_unique_listeners': monthly.values('user').distinct().count(),
        'top_songs': list(
            songs.order_by('-streams_count').values(
                'id', 'title', 'streams_count', 'listeners_count', 'revenue'
            )[:5]
        ),
    }

def admin_overview() -> dict:
    plans = {plan.code: plan for plan in SubscriptionPlan.objects.all()}
    tier_counts = {
        row['subscription_tier']: row['total']
        for row in User.objects.values('subscription_tier').annotate(total=Count('id'))
    }
    counts = {code: tier_counts.get(code, 0) for code in ('basic', 'silver', 'gold')}
    monthly_revenue = sum(
        (plans[code].monthly_price * counts[code] for code in counts if code in plans),
        Decimal('0.00'),
    )
    paid_revenue = Payment.objects.filter(
        status=PaymentStatus.PAID, created_at__date__gte=_month_bounds(current_month())[0]
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    gold = plans.get('gold')
    return {
        'tier_counts': counts,
        'total_accounts': sum(counts.values()),
        'monthly_revenue': monthly_revenue,
        'collected_this_month': paid_revenue,
        'currency': gold.currency if gold else 'تومان',
        'pending_artists': User.objects.filter(
            artist_profile__status=ArtistStatusChoices.PENDING
        ).count(),
        'open_tickets': Ticket.objects.exclude(status=TicketStatus.CLOSED).count(),
        'pending_payout': Payout.objects.filter(status=PayoutStatus.PENDING).aggregate(
            total=Sum('reward_amount')
        )['total'] or Decimal('0.00'),
    }

def build_payouts(month: str | None = None) -> list[Payout]:
    """Refreshes the audit rows for `month` from the recorded play events."""
    month = month or current_month()
    start, end = _month_bounds(month)
    artists = User.objects.filter(role=RoleChoices.ARTIST, artist_profile__verified=True)
    payouts = []
    for artist in artists:
        monthly = PlayEvent.objects.filter(
            artist=artist, created_at__date__gte=start, created_at__date__lt=end
        )
        streams = monthly.count()
        listeners = monthly.values('user').distinct().count()
        payout, _ = Payout.objects.get_or_create(artist=artist, month=month)
        if payout.status == PayoutStatus.PENDING:
            payout.unique_listeners = listeners
            payout.monthly_streams = streams
            payout.reward_amount = reward_for(listeners, streams)
            payout.save(update_fields=['unique_listeners', 'monthly_streams', 'reward_amount'])
        payouts.append(payout)
    return payouts
