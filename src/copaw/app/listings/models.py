# -*- coding: utf-8 -*-
"""Listing data models."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class Listing(BaseModel):
    """A single product listing."""

    id: str = Field(default_factory=lambda: uuid4().hex)
    asin: str = ""
    title: str = ""
    bullet_points: List[str] = Field(default_factory=list)
    description: str = ""
    search_terms: List[str] = Field(default_factory=list)
    price: str = ""
    image_url: str = ""
    platform: str = "amazon"
    marketplace: str = ""
    status: Literal["draft", "generated", "published", "archived"] = "draft"
    source_url: str = ""
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
    )
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
    )


class ListingGenerateRequest(BaseModel):
    """Request body for AI listing generation."""

    asin: Optional[str] = None
    keyword: Optional[str] = None
    platform: str = "amazon"
    marketplace: str = "us"


class ListingsFile(BaseModel):
    """Top-level envelope stored in listings.json."""

    version: int = 1
    listings: List[Listing] = Field(default_factory=list)
