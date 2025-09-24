# backend/main.py
from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from backend.db.session import engine, Base
import backend.db.models  # IMPORTANT: register models
from backend.services import auth as auth_router
from backend.services import query_api, upload_api, list_api
from backend.services import superset_connect as superset_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ----- startup (retry DB create_all) -----
    print("[lifespan] initializing…")
    attempts, delay = 0, 1.0
    while attempts < 20:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("[lifespan] DB ready")
            break
        except OperationalError as e:
            attempts += 1
            print(f"[lifespan] DB not ready (attempt {attempts}) -> {e}")
            await asyncio.sleep(delay)
            delay = min(delay * 1.6, 5.0)
    else:
        # Give up after retries but still start the API so /docs & /healthz work
        print("[lifespan] DB not reachable after retries — starting API anyway")

    yield
    # ----- shutdown -----
    print("[lifespan] disposing engine…")
    await engine.dispose()
    print("[lifespan] bye")

app = FastAPI(
    title="NEX AI Backend",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS for your Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router.router)
app.include_router(upload_api.router)
app.include_router(list_api.router)
app.include_router(query_api.router)
app.include_router(superset_router.router)

@app.get("/healthz")
async def healthz():
    return {"ok": True}

app.include_router(superset_router.router, prefix="/superset", tags=["superset"])