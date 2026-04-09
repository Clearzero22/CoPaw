# -*- coding: utf-8 -*-
"""Proxy router for XiYouZhaoCi keyword research API."""
from __future__ import annotations

import json
import logging
import re

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/xiyouzhaoci", tags=["xiyouzhaoci"])

_CRAWLER_BASE = "http://localhost:8000"
_TIMEOUT = 10.0
_ASIN_RE = re.compile(r"^[A-Z0-9]{10}$")


def _crawler_url(path: str) -> str:
    """Build full URL to crawler API."""
    return f"{_CRAWLER_BASE}{path}"


def _safe_json(resp: httpx.Response):
    """Parse JSON from response safely."""
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
    """Forward request to crawler API."""
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
        logger.exception(
            "XiYouZhaoCi proxy error: %s", e
        )
        return JSONResponse(
            content={"error": "proxy_error"},
            status_code=502,
        )


# -- Keywords --


@router.get("/keywords")
async def list_keywords(request: Request):
    """List keywords with pagination and filtering."""
    params = dict(request.query_params)
    return await _proxy("GET", "/api/keywords/", params=params)


@router.get("/keywords/stats")
async def keyword_stats():
    """Keyword statistics overview."""
    return await _proxy("GET", "/api/keywords/stats")


@router.post("/keywords/batch-delete")
async def batch_delete_keywords(request: Request):
    """Batch delete keywords for multiple ASINs."""
    body = await request.json()
    asins = body.get("asins", [])
    for asin in asins:
        if not _ASIN_RE.match(str(asin).upper()):
            return JSONResponse(
                content={"error": "invalid_asin"},
                status_code=400,
            )
    return await _proxy(
        "POST",
        "/api/keywords/batch-delete",
        json_body=body,
    )


@router.delete("/keywords/{asin}")
async def delete_keywords(asin: str):
    """Delete all keywords for an ASIN."""
    if not _ASIN_RE.match(asin):
        return JSONResponse(
            content={"error": "invalid_asin"},
            status_code=400,
        )
    return await _proxy(
        "DELETE", f"/api/keywords/{asin}"
    )


# -- Scraping --


@router.post("/scrape")
async def trigger_scrape(request: Request):
    """Trigger keyword scraping for given ASINs."""
    body = await request.json()
    return await _proxy(
        "POST",
        "/api/keywords/scrape",
        json_body=body,
        timeout=30.0,
    )


@router.get("/scrape/status")
async def scrape_status():
    """Get current scrape task status."""
    return await _proxy(
        "GET", "/api/keywords/scrape/status"
    )
