# -*- coding: utf-8 -*-
"""Proxy router that forwards requests to the Amazon Crawler API."""
from __future__ import annotations

import json
import logging
import re

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

from ...constant import WORKING_DIR

router = APIRouter(prefix="/crawler", tags=["crawler"])

# Crawler API base URL (configurable via env var)
_CRAWLER_BASE = "http://localhost:8000"
_TIMEOUT = 10.0

# Input validation patterns
_ASIN_RE = re.compile(r"^[A-Z0-9]{10}$")
_JOB_ID_RE = re.compile(r"^[a-f0-9\-]+$")
_INT_ID_RE = re.compile(r"^\d+$")


def _crawler_url(path: str) -> str:
    """Build full URL to crawler API."""
    return f"{_CRAWLER_BASE}{path}"


def _safe_json(resp: httpx.Response) -> dict | list | None:
    """Parse JSON from response, returning None on failure."""
    if not resp.content:
        return None
    try:
        return resp.json()
    except (json.JSONDecodeError, ValueError):
        logger.warning(
            "Non-JSON response from crawler: %s",
            resp.content[:200],
        )
        return None


async def _proxy(
    method: str,
    path: str,
    *,
    params: dict | None = None,
    json_body: dict | None = None,
    timeout: float = _TIMEOUT,
) -> JSONResponse:
    """Forward a request to the crawler API and return its response."""
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            trust_env=False,
        ) as client:
            resp = await client.request(
                method,
                _crawler_url(path),
                params=params,
                json=json_body,
            )
        return JSONResponse(
            content=_safe_json(resp),
            status_code=resp.status_code,
        )
    except httpx.ConnectError as e:
        logger.warning("Crawler unavailable: %s", e)
        return JSONResponse(
            content={"error": "crawler_unavailable"},
            status_code=502,
        )
    except httpx.TimeoutException as e:
        logger.warning("Crawler timeout: %s", e)
        return JSONResponse(
            content={"error": "crawler_timeout"},
            status_code=504,
        )
    except Exception as e:
        logger.exception("Crawler proxy error: %s", e)
        return JSONResponse(
            content={"error": "crawler_error"},
            status_code=502,
        )


# -- Products --


@router.get("/products")
async def list_products(request: Request):
    """List products with pagination and filtering."""
    params = dict(request.query_params)
    return await _proxy("GET", "/api/products/", params=params)


@router.get("/products/stats")
async def product_stats():
    """Product statistics overview."""
    return await _proxy("GET", "/api/products/stats/overview")


@router.get("/products/{asin}")
async def get_product(asin: str):
    """Get single product by ASIN."""
    if not _ASIN_RE.match(asin):
        return JSONResponse(
            content={"error": "invalid_asin"},
            status_code=400,
        )
    return await _proxy("GET", f"/api/products/{asin}")


# -- Scraping Jobs --


@router.get("/jobs")
async def jobs_status():
    """Overall scraping status (running + recent jobs)."""
    return await _proxy("GET", "/api/scraping/status")


@router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Get status of a specific job."""
    if not _JOB_ID_RE.match(job_id):
        return JSONResponse(
            content={"error": "invalid_job_id"},
            status_code=400,
        )
    return await _proxy("GET", f"/api/scraping/jobs/{job_id}")


@router.post("/jobs/search")
async def trigger_search(request: Request):
    """Trigger a search scrape."""
    body = await request.json()
    return await _proxy(
        "POST", "/api/scraping/search", json_body=body
    )


@router.post("/jobs/detail")
async def trigger_detail(request: Request):
    """Trigger a single detail scrape."""
    body = await request.json()
    return await _proxy(
        "POST", "/api/scraping/detail", json_body=body
    )


@router.post("/jobs/batch-detail")
async def trigger_batch_detail(request: Request):
    """Trigger batch detail scrape."""
    body = await request.json()
    return await _proxy(
        "POST", "/api/scraping/batch-detail", json_body=body
    )


@router.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a running/pending job."""
    if not _JOB_ID_RE.match(job_id):
        return JSONResponse(
            content={"error": "invalid_job_id"},
            status_code=400,
        )
    return await _proxy(
        "DELETE", f"/api/scraping/jobs/{job_id}"
    )


# -- Notifications --


@router.get("/notifications")
async def list_notifications(request: Request):
    """List notifications with pagination."""
    params = dict(request.query_params)
    return await _proxy("GET", "/api/notifications/", params=params)


@router.get("/notifications/unread-count")
async def unread_count():
    """Get unread notification count."""
    return await _proxy("GET", "/api/notifications/unread-count")


@router.patch("/notifications/{notification_id}/read")
async def mark_read(notification_id: str):
    """Mark a notification as read."""
    if not _INT_ID_RE.match(notification_id):
        return JSONResponse(
            content={"error": "invalid_notification_id"},
            status_code=400,
        )
    return await _proxy(
        "PATCH",
        f"/api/notifications/{notification_id}/read",
    )


@router.post("/notifications/mark-all-read")
async def mark_all_read():
    """Mark all notifications as read."""
    return await _proxy("POST", "/api/notifications/mark-all-read")


@router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str):
    """Delete a notification."""
    if not _INT_ID_RE.match(notification_id):
        return JSONResponse(
            content={"error": "invalid_notification_id"},
            status_code=400,
        )
    return await _proxy(
        "DELETE",
        f"/api/notifications/{notification_id}",
    )


# -- Generate Listings from Crawler Data --


@router.post("/generate")
async def generate_listings(request: Request):
    """Generate listings from crawler product data.

    Fetches product details from crawler API, maps fields to Listing
    model, and saves to listings.json via ListingRepository.
    """
    from ..listings.models import Listing
    from ..listings.repository import ListingRepository

    body = await request.json()
    asins = body.get("asins", [])

    if not asins:
        return JSONResponse(
            content={"error": "asins_required"},
            status_code=400,
        )

    # Validate ASINs upfront
    invalid = [a for a in asins if not _ASIN_RE.match(a)]
    if invalid:
        return JSONResponse(
            content={
                "error": "invalid_asins",
                "detail": invalid,
            },
            status_code=400,
        )

    repo = ListingRepository(WORKING_DIR / "listings.json")
    generated = []
    skipped = []

    # Reuse a single client for all requests
    try:
        async with httpx.AsyncClient(
            timeout=_TIMEOUT,
            trust_env=False,
        ) as client:
            for asin in asins:
                try:
                    resp = await client.get(
                        _crawler_url(f"/api/products/{asin}")
                    )
                    if resp.status_code != 200:
                        skipped.append(
                            {"asin": asin, "reason": "not_found"}
                        )
                        continue

                    product = _safe_json(resp)
                    if not isinstance(product, dict):
                        skipped.append(
                            {
                                "asin": asin,
                                "reason": "invalid_response",
                            }
                        )
                        continue

                    images = product.get("all_images") or []
                    title = (
                        product.get("full_title")
                        or product.get("title", "")
                    )

                    listing = Listing(
                        asin=asin,
                        title=title,
                        bullet_points=(
                            product.get("about_this_item") or []
                        ),
                        description=(
                            product.get("product_description") or ""
                        ),
                        search_terms=[],
                        price=product.get("price") or "",
                        image_url=(
                            images[0] if images else ""
                        ),
                        platform="amazon",
                        marketplace="",
                        status="draft",
                        source_url=(
                            product.get("product_url") or ""
                        ),
                    )
                    created = await repo.create_listing(
                        listing
                    )
                    generated.append(
                        created.model_dump(mode="json")
                    )
                except httpx.TimeoutException:
                    skipped.append(
                        {
                            "asin": asin,
                            "reason": "crawler_timeout",
                        }
                    )
                except Exception as e:
                    logger.warning(
                        "Generate failed for %s: %s", asin, e
                    )
                    skipped.append(
                        {"asin": asin, "reason": str(e)}
                    )
    except httpx.ConnectError:
        return JSONResponse(
            content={"error": "crawler_unavailable"},
            status_code=502,
        )
    except httpx.TimeoutException:
        return JSONResponse(
            content={"error": "crawler_timeout"},
            status_code=504,
        )

    return {
        "generated": len(generated),
        "skipped": len(skipped),
        "listings": generated,
        "skipped_details": skipped,
    }


# -- Dify Recognition History --


_BATCH_ID_RE = re.compile(r"^[\w\-]+$")


@router.post("/dify/history")
async def dify_save_history(request: Request):
    """Save Dify batch recognition results."""
    body = await request.json()
    return await _proxy(
        "POST", "/api/dify/history", json_body=body
    )


@router.get("/dify/history/batches")
async def dify_list_batches(request: Request):
    """List Dify recognition batches with summary."""
    params = dict(request.query_params)
    return await _proxy(
        "GET", "/api/dify/history/batches", params=params
    )


@router.get("/dify/history/batches/{batch_id}")
async def dify_batch_detail(
    batch_id: str,
    request: Request,
):
    """Get all results for a specific batch."""
    if not _BATCH_ID_RE.match(batch_id):
        return JSONResponse(
            content={"error": "invalid_batch_id"},
            status_code=400,
        )
    params = dict(request.query_params)
    return await _proxy(
        "GET", f"/api/dify/history/batches/{batch_id}", params=params
    )


@router.delete("/dify/history/batches/{batch_id}")
async def dify_delete_batch(batch_id: str):
    """Delete all records for a specific batch."""
    if not _BATCH_ID_RE.match(batch_id):
        return JSONResponse(
            content={"error": "invalid_batch_id"},
            status_code=400,
        )
    return await _proxy(
        "DELETE", f"/api/dify/history/batches/{batch_id}"
    )


@router.patch("/dify/history/{record_id}")
async def dify_update_record(
    record_id: str,
    request: Request,
):
    """Edit result / status / error of a single record."""
    if not _INT_ID_RE.match(record_id):
        return JSONResponse(
            content={"error": "invalid_record_id"},
            status_code=400,
        )
    body = await request.json()
    return await _proxy(
        "PATCH", f"/api/dify/history/{record_id}", json_body=body
    )
