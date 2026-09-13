"""Player statistics endpoint."""

from fastapi import APIRouter, Depends

from ..auth import current_user, get_store
from ..models import PlayerStats
from ..store import InMemoryStore, UserRecord


router = APIRouter(prefix="/player", tags=["Player statistics"])


@router.get("/stats", response_model=PlayerStats, response_model_exclude_none=True)
def get_player_stats(
    user: UserRecord = Depends(current_user),
    store: InMemoryStore = Depends(get_store),
) -> PlayerStats:
    return store.stats_for_user(user)

