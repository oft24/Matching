from fastapi import APIRouter
from app.models import SearchFilters, PlayerResult
from app.services.matcher import find_matches

router = APIRouter(tags=["matchmaking"])


@router.post("/match", response_model=list[PlayerResult])
def match_players(filters: SearchFilters):
    return find_matches(filters)
