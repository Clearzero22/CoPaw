# -*- coding: utf-8 -*-
"""Listing management API endpoints."""
from __future__ import annotations

import csv
import io
import json
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Query, Request, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing_extensions import Literal

from ..listings.models import Listing, ListingGenerateRequest
from ..listings.repository import ListingRepository
from ...constant import WORKING_DIR

router = APIRouter(prefix="/listings", tags=["listings"])

# Maximum CSV import file size (10 MB)
_MAX_IMPORT_BYTES = 10 * 1024 * 1024


def _get_repo() -> ListingRepository:
    """Get the global listing repository."""
    path = WORKING_DIR / "listings.json"
    return ListingRepository(path)


# -- CRUD endpoints --


@router.get("")
async def list_listings(
    request: Request,
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
):
    """List all listings with optional filters."""
    repo = _get_repo()
    listings = await repo.list_listings(
        search=search, status=status, platform=platform
    )
    return [l.model_dump(mode="json") for l in listings]


class ListingCreateBody(BaseModel):
    title: str = ""
    asin: str = ""
    bullet_points: List[str] = []
    description: str = ""
    search_terms: List[str] = []
    price: str = ""
    image_url: str = ""
    platform: str = "amazon"
    marketplace: str = ""


@router.post("")
async def create_listing(body: ListingCreateBody):
    """Create a new listing manually."""
    repo = _get_repo()
    listing = Listing(**body.model_dump())
    created = await repo.create_listing(listing)
    return created.model_dump(mode="json")


class ListingUpdateBody(BaseModel):
    title: Optional[str] = None
    asin: Optional[str] = None
    bullet_points: Optional[List[str]] = None
    description: Optional[str] = None
    search_terms: Optional[List[str]] = None
    price: Optional[str] = None
    image_url: Optional[str] = None
    platform: Optional[str] = None
    marketplace: Optional[str] = None
    status: Optional[
        Literal["draft", "generated", "published", "archived"]
    ] = None


@router.put("/{listing_id}")
async def update_listing(listing_id: str, body: ListingUpdateBody):
    """Update a listing by ID."""
    repo = _get_repo()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updated = await repo.update_listing(listing_id, updates)
    if not updated:
        return JSONResponse(content={"error": "not_found"}, status_code=404)
    return updated.model_dump(mode="json")


@router.delete("/{listing_id}")
async def delete_listing(listing_id: str):
    """Delete a listing by ID."""
    repo = _get_repo()
    deleted = await repo.delete_listing(listing_id)
    if not deleted:
        return JSONResponse(content={"error": "not_found"}, status_code=404)
    return {"ok": True}


# -- CSV Export (must be before /{listing_id}) --


@router.get("/export")
async def export_listings(request: Request):
    """Export filtered listings as CSV."""
    params = request.query_params
    repo = _get_repo()
    listings = await repo.list_listings(
        search=params.get("search"),
        status=params.get("status"),
        platform=params.get("platform"),
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "id",
            "asin",
            "title",
            "bullet_points",
            "description",
            "search_terms",
            "price",
            "platform",
            "marketplace",
            "status",
            "created_at",
        ]
    )
    for l in listings:
        writer.writerow(
            [
                l.id,
                l.asin,
                l.title,
                "\\n".join(l.bullet_points),
                l.description,
                ",".join(l.search_terms),
                l.price,
                l.platform,
                l.marketplace,
                l.status,
                l.created_at,
            ]
        )
    output.seek(0)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f"attachment; filename=listings_{timestamp}.csv"
            )
        },
    )


@router.get("/{listing_id}")
async def get_listing(listing_id: str):
    """Get a single listing by ID."""
    repo = _get_repo()
    listing = await repo.get_listing(listing_id)
    if not listing:
        return JSONResponse(content={"error": "not_found"}, status_code=404)
    return listing.model_dump(mode="json")


# -- AI Generation (SSE) --


@router.post("/generate")
async def generate_listing(body: ListingGenerateRequest):
    """AI-generate a listing from competitor scrape. SSE streaming."""
    repo = _get_repo()

    if body.asin:
        source_url = (
            f"https://www.amazon.{body.marketplace}/dp/{body.asin}"
        )
    elif body.keyword:
        source_url = (
            f"https://www.amazon.{body.marketplace}"
            f"/s?k={body.keyword}"
        )
    else:
        return JSONResponse(
            content={"error": "asin_or_keyword_required"},
            status_code=400,
        )

    async def event_stream():
        try:
            yield "event: status\ndata: scraping\n\n"
            # TODO: Integrate with agent runner for browser scraping
            import asyncio

            await asyncio.sleep(1)

            yield "event: status\ndata: generating\n\n"
            await asyncio.sleep(1)

            new_listing = Listing(
                asin=body.asin or "",
                title=(
                    "Optimized Product Listing for "
                    f"{body.asin or body.keyword}"
                ),
                bullet_points=[
                    "Feature 1: High quality material",
                    "Feature 2: Easy to use and maintain",
                    "Feature 3: Compact and portable design",
                    "Feature 4: Multi-purpose functionality",
                    "Feature 5: Backed by satisfaction guarantee",
                ],
                description=(
                    "Placeholder description. "
                    "AI generation will be integrated "
                    "with the agent runner."
                ),
                search_terms=[
                    "product",
                    "quality",
                    "portable",
                    "multi-purpose",
                    "best seller",
                ],
                platform=body.platform,
                marketplace=body.marketplace,
                status="generated",
                source_url=source_url,
            )
            await repo.create_listing(new_listing)

            yield (
                "event: result\n"
                f"data: {json.dumps(new_listing.model_dump(mode='json'), ensure_ascii=False)}\n\n"
            )
            yield "event: done\ndata: \n\n"
        except Exception as e:
            yield (
                "event: error\n"
                f"data: {json.dumps({'message': str(e)}, ensure_ascii=False)}\n\n"
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# -- CSV Import --


@router.post("/import")
async def import_listings(
    request: Request,
    file: UploadFile,
    skip_existing: bool = Query(True),
):
    """Import listings from CSV upload."""
    if not file.filename or not file.filename.endswith(".csv"):
        return JSONResponse(
            content={"error": "file_must_be_csv"}, status_code=400
        )

    content = await file.read()
    if len(content) > _MAX_IMPORT_BYTES:
        return JSONResponse(
            content={"error": "file_too_large"}, status_code=400,
        )
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        return JSONResponse(
            content={"error": "file_must_be_utf8"}, status_code=400,
        )
    reader = csv.DictReader(io.StringIO(text))

    rows = []
    for row in reader:
        entry = {
            "title": row.get("title", ""),
            "asin": row.get("asin", ""),
            "bullet_points": (
                row.get("bullet_points", "").split("\\n")
                if row.get("bullet_points")
                else []
            ),
            "description": row.get("description", ""),
            "search_terms": (
                row.get("search_terms", "").split(",")
                if row.get("search_terms")
                else []
            ),
            "price": row.get("price", ""),
            "platform": row.get("platform", "amazon"),
            "marketplace": row.get("marketplace", ""),
        }
        if entry["title"]:
            rows.append(entry)

    repo = _get_repo()
    result = await repo.import_listings(rows, skip_existing=skip_existing)
    return result
