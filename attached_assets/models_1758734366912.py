# backend/db/models.py
from __future__ import annotations

from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    String,
    BigInteger,
    Enum,
    Boolean,
    DateTime,
    TIMESTAMP,
    UniqueConstraint,
    text,
)

from .session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    # store a bcrypt/argon2 hash (NULL allowed for SSO-only accounts)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # optional SSO linkage
    sso_provider: Mapped[Optional[str]] = mapped_column(
        Enum("google", "microsoft", "github", name="sso_provider"),
        nullable=True,
    )
    sso_sub: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("1"))
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # match your MySQL schema:
    # created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    # updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )

    __table_args__ = (
        UniqueConstraint("sso_provider", "sso_sub", name="uq_users_sso"),
    )
