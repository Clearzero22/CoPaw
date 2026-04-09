# -*- coding: utf-8 -*-
"""Proxy router for Prompt Templates API."""
from __future__ import annotations

import json
import logging

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/prompt-templates", tags=["prompt-templates"]
)

_CRAWLER_BASE = "http://localhost:8000"
_TIMEOUT = 10.0


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
            "Prompt templates proxy error: %s", e
        )
        return JSONResponse(
            content={"error": "proxy_error"},
            status_code=502,
        )


@router.get("/list")
async def list_templates(request: Request):
    """List prompt templates."""
    params = dict(request.query_params)
    return await _proxy("GET", "/api/prompt-templates/", params=params)


@router.get("/item/{template_id}")
async def get_template(template_id: int):
    """Get a single prompt template."""
    return await _proxy(
        "GET", f"/api/prompt-templates/{template_id}"
    )


@router.post("/create")
async def create_template(request: Request):
    """Create a prompt template."""
    body = await request.json()
    return await _proxy(
        "POST",
        "/api/prompt-templates/",
        json_body=body,
    )


@router.put("/update/{template_id}")
async def update_template(
    template_id: int, request: Request,
):
    """Update a prompt template."""
    body = await request.json()
    return await _proxy(
        "PUT",
        f"/api/prompt-templates/{template_id}",
        json_body=body,
    )


@router.delete("/delete/{template_id}")
async def delete_template(template_id: int):
    """Delete a prompt template."""
    return await _proxy(
        "DELETE", f"/api/prompt-templates/{template_id}"
    )


@router.post("/set-default/{template_id}")
async def set_default(template_id: int):
    """Set a template as default."""
    return await _proxy(
        "POST",
        f"/api/prompt-templates/set-default/{template_id}",
    )


@router.post("/batch-delete")
async def batch_delete(request: Request):
    """Batch delete templates."""
    body = await request.json()
    return await _proxy(
        "POST",
        "/api/prompt-templates/batch-delete",
        json_body=body,
    )
