from pydantic import BaseModel, Field
from typing import Optional


class SearchFilters(BaseModel):
    game: str = "lol"
    region: str = "LAN"
    language: str = "Español"
    matchType: str = "Ranked"
    rank: str = "Gold"
    role: str = "Any"
    age: str = "18-25"
    availability: str = "Noches"
    verifiedOnly: bool = False
    playstyle: str = "Competitivo"
    objectives: str = "Subir de rango"
    activityLevel: str = "Alto"
    hasMic: bool = True


class PlayerResult(BaseModel):
    id: str
    username: str
    avatar: str
    rank: str
    roles: list[str]
    languages: list[str]
    region: str
    game: str
    playstyle: str
    objectives: str
    activityLevel: str
    hasMic: bool
    verified: bool
    reputation: float
    badges: list[str]
    lastSeen: str
    online: bool
    age: int
    availability: str
    compatibility: int = Field(ge=0, le=100)
