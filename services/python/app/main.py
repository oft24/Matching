from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import matchmaking

app = FastAPI(title="Matching Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(matchmaking.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "service": "matching-python"}
