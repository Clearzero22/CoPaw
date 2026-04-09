# -*- coding: utf-8 -*-
"""JSON file repository for listings."""
from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import List, Optional

from .models import Listing, ListingsFile


class ListingRepository:
    """JSON file storage for listings with atomic writes.

    Follows the same pattern as JsonJobRepository in crons/repo/json_repo.py.
    """

    def __init__(self, path: Path | str):
        if isinstance(path, str):
            path = Path(path)
        self._path = path.expanduser()

    @property
    def path(self) -> Path:
        return self._path

    async def load(self) -> ListingsFile:
        """Load listings from JSON file. Returns empty if file missing."""
        if not self._path.exists():
            return ListingsFile(version=1, listings=[])
        data = json.loads(self._path.read_text(encoding="utf-8"))
        return ListingsFile.model_validate(data)

    async def save(self, data: ListingsFile) -> None:
        """Save listings to JSON file with atomic write."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self._path.with_suffix(self._path.suffix + ".tmp")
        payload = data.model_dump(mode="json")
        tmp_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True),
            encoding="utf-8",
        )
        shutil.move(str(tmp_path), str(self._path))

    # -- CRUD helpers --

    async def list_listings(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        platform: Optional[str] = None,
    ) -> List[Listing]:
        """List all listings with optional filters."""
        data = await self.load()
        results = data.listings
        if search:
            s = search.lower()
            results = [
                l
                for l in results
                if s in l.title.lower()
                or s in l.asin.lower()
                or s in l.description.lower()
            ]
        if status:
            results = [l for l in results if l.status == status]
        if platform:
            results = [l for l in results if l.platform == platform]
        return results

    async def get_listing(self, listing_id: str) -> Optional[Listing]:
        """Get a single listing by ID."""
        data = await self.load()
        for listing in data.listings:
            if listing.id == listing_id:
                return listing
        return None

    async def create_listing(self, listing: Listing) -> Listing:
        """Add a new listing. Returns the listing with generated fields."""
        data = await self.load()
        data.listings.append(listing)
        await self.save(data)
        return listing

    async def update_listing(
        self, listing_id: str, updates: dict
    ) -> Optional[Listing]:
        """Update a listing by ID with partial fields."""
        data = await self.load()
        for i, listing in enumerate(data.listings):
            if listing.id == listing_id:
                updated = listing.model_copy(update=updates)
                data.listings[i] = updated
                await self.save(data)
                return updated
        return None

    async def delete_listing(self, listing_id: str) -> bool:
        """Delete a listing by ID. Returns True if found and deleted."""
        data = await self.load()
        original_len = len(data.listings)
        data.listings = [l for l in data.listings if l.id != listing_id]
        if len(data.listings) < original_len:
            await self.save(data)
            return True
        return False

    async def import_listings(
        self,
        new_listings: List[dict],
        skip_existing: bool = True,
    ) -> dict:
        """Import listings from dicts. Returns stats dict."""
        data = await self.load()
        existing_asins = {l.asin for l in data.listings if l.asin}
        imported = 0
        skipped = 0
        for raw in new_listings:
            listing = Listing(**raw)
            if skip_existing and listing.asin and listing.asin in existing_asins:
                skipped += 1
                continue
            data.listings.append(listing)
            imported += 1
        await self.save(data)
        return {"imported": imported, "skipped": skipped, "total": len(new_listings)}
