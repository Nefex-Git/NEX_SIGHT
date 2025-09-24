# backend/db/session.py
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Default to your compose URL; can be overridden via env
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+asyncmy://nexuser:nexpass123@db:3306/login_details",
)

if not DATABASE_URL.startswith("mysql+asyncmy://"):
    raise RuntimeError(
        "DATABASE_URL must use the 'mysql+asyncmy' driver, e.g. "
        "mysql+asyncmy://user:pass@db:3306/login_details"
    )

class Base(DeclarativeBase):
    pass

# Create async engine & session maker
engine = create_async_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

__all__ = ["DATABASE_URL", "engine", "SessionLocal", "Base"]
