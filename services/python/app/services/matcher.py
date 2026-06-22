from app.models import SearchFilters

PLAYERS = [
    {
        "id": "1", "username": "ShadowBlade",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=ShadowBlade",
        "rank": "Diamond II", "roles": ["ADC", "Support"],
        "languages": ["Español", "Inglés"], "region": "LAN", "game": "lol",
        "playstyle": "Competitivo", "objectives": "Subir de rango",
        "activityLevel": "Alto", "hasMic": True, "verified": True,
        "reputation": 4.8, "badges": ["verified", "good-teammate", "active"],
        "lastSeen": "En línea", "online": True, "age": 22,
        "availability": "Noches y fines de semana",
    },
    {
        "id": "2", "username": "NovaStrike",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=NovaStrike",
        "rank": "Platinum I", "roles": ["Mid", "Jungle"],
        "languages": ["Español"], "region": "LAN", "game": "lol",
        "playstyle": "Casual competitivo", "objectives": "Diversión en equipo",
        "activityLevel": "Medio", "hasMic": True, "verified": True,
        "reputation": 4.6, "badges": ["verified", "good-teammate"],
        "lastSeen": "Hace 5 min", "online": True, "age": 19,
        "availability": "Tardes",
    },
    {
        "id": "3", "username": "IronWolf",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=IronWolf",
        "rank": "Gold III", "roles": ["Top", "Fill"],
        "languages": ["Español", "Portugués"], "region": "LAN", "game": "lol",
        "playstyle": "Estratégico", "objectives": "Mejorar habilidades",
        "activityLevel": "Alto", "hasMic": False, "verified": False,
        "reputation": 4.2, "badges": ["active"],
        "lastSeen": "Hace 1 hora", "online": False, "age": 25,
        "availability": "Fines de semana",
    },
    {
        "id": "4", "username": "ValkyrieX",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=ValkyrieX",
        "rank": "Immortal 2", "roles": ["Duelist", "Initiator"],
        "languages": ["Inglés", "Español"], "region": "NA", "game": "valorant",
        "playstyle": "Agresivo", "objectives": "Ranked grind",
        "activityLevel": "Alto", "hasMic": True, "verified": True,
        "reputation": 4.9, "badges": ["verified", "good-teammate", "active"],
        "lastSeen": "En línea", "online": True, "age": 21,
        "availability": "Diario",
    },
    {
        "id": "5", "username": "PixelRush",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=PixelRush",
        "rank": "Master", "roles": ["Support", "Flex"],
        "languages": ["Español"], "region": "LAN", "game": "lol",
        "playstyle": "Cooperativo", "objectives": "Torneos amateur",
        "activityLevel": "Medio", "hasMic": True, "verified": True,
        "reputation": 4.7, "badges": ["verified", "good-teammate"],
        "lastSeen": "Hace 15 min", "online": True, "age": 24,
        "availability": "Noches",
    },
    {
        "id": "6", "username": "StormRider",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=StormRider",
        "rank": "Diamond I", "roles": ["Jungle"],
        "languages": ["Español", "Inglés"], "region": "LAN", "game": "lol",
        "playstyle": "Objetivos", "objectives": "Climb ranked",
        "activityLevel": "Alto", "hasMic": True, "verified": True,
        "reputation": 4.5, "badges": ["verified", "active"],
        "lastSeen": "En línea", "online": True, "age": 20,
        "availability": "Tardes y noches",
    },
]

RANK_TIERS = {
    "Iron": 0, "Bronze": 1, "Silver": 2, "Gold": 3,
    "Platinum": 4, "Diamond": 5, "Master": 6,
    "Immortal": 7, "Radiant": 8,
}


def _rank_value(rank: str) -> int:
    for name, val in RANK_TIERS.items():
        if name.lower() in rank.lower():
            return val
    return 3


def calculate_compatibility(player: dict, filters: SearchFilters) -> int:
    score = 50.0

    if player["game"] == filters.game:
        score += 15
    if player["region"] == filters.region:
        score += 10
    if filters.language in player["languages"]:
        score += 10
    if filters.role == "Any" or filters.role in player["roles"]:
        score += 8

    rank_diff = abs(_rank_value(player["rank"]) - _rank_value(filters.rank))
    score += max(0, 10 - rank_diff * 3)

    if player["playstyle"].lower() in filters.playstyle.lower() or filters.playstyle.lower() in player["playstyle"].lower():
        score += 5
    if player["objectives"].lower() in filters.objectives.lower() or filters.objectives.lower() in player["objectives"].lower():
        score += 5
    if player["activityLevel"] == filters.activityLevel:
        score += 4
    if player["hasMic"] == filters.hasMic:
        score += 3
    if player["verified"]:
        score += 3
    if player["online"]:
        score += 5

    score += (player["reputation"] - 4.0) * 5

    return min(99, max(60, int(score)))


def find_matches(filters: SearchFilters) -> list[dict]:
    results = []
    for player in PLAYERS:
        if filters.verifiedOnly and not player["verified"]:
            continue
        if filters.game and player["game"] != filters.game:
            continue

        compatibility = calculate_compatibility(player, filters)
        results.append({**player, "compatibility": compatibility})

    results.sort(key=lambda x: x["compatibility"], reverse=True)
    return results
