"""HTTP session wrapper shared by all collectors.

Provides per-API request pacing, 429 handling honoring Retry-After, and
exponential backoff on 5xx/connection errors. The transport is injectable so
tests never touch the network.
"""
from __future__ import annotations

import time
from typing import Any, Callable

import requests

MAX_ATTEMPTS = 5


class CollectorError(Exception):
    """Raised when an API call fails after all retries."""


class ApiSession:
    def __init__(
        self,
        base_url: str,
        headers: dict[str, str] | None = None,
        min_interval_s: float = 0.25,
        transport: Callable[..., requests.Response] | None = None,
        sleep: Callable[[float], None] = time.sleep,
        timeout_s: float = 60.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.min_interval_s = min_interval_s
        self.timeout_s = timeout_s
        self._sleep = sleep
        self._last_request_at = 0.0
        if transport is None:
            session = requests.Session()
            session.headers.update(headers or {})
            self._transport = session.request
        else:
            self._headers = headers or {}
            self._transport = transport

    def _pace(self) -> None:
        wait = self.min_interval_s - (time.monotonic() - self._last_request_at)
        if wait > 0:
            self._sleep(wait)
        self._last_request_at = time.monotonic()

    def request(self, method: str, path: str, **kwargs: Any) -> Any:
        url = path if path.startswith("http") else f"{self.base_url}/{path.lstrip('/')}"
        kwargs.setdefault("timeout", self.timeout_s)
        if hasattr(self, "_headers"):  # injected transport: merge headers manually
            merged = dict(self._headers)
            merged.update(kwargs.pop("headers", {}))
            kwargs["headers"] = merged

        backoff = 2.0
        last_error = "unknown"
        for attempt in range(1, MAX_ATTEMPTS + 1):
            self._pace()
            try:
                resp = self._transport(method=method, url=url, **kwargs)
            except requests.RequestException as e:
                last_error = f"connection error: {e}"
            else:
                if resp.status_code == 429:
                    retry_after = resp.headers.get("Retry-After")
                    try:
                        delay = float(retry_after) if retry_after else backoff
                    except ValueError:
                        delay = backoff
                    last_error = f"429 rate limited (Retry-After: {retry_after})"
                    if attempt < MAX_ATTEMPTS:
                        self._sleep(delay)
                    backoff *= 2
                    continue
                if resp.status_code >= 500:
                    last_error = f"HTTP {resp.status_code}"
                elif resp.status_code >= 400:
                    raise CollectorError(
                        f"{method} {url} -> HTTP {resp.status_code}: {resp.text[:500]}"
                    )
                else:
                    return resp.json()
            if attempt < MAX_ATTEMPTS:
                self._sleep(backoff)
                backoff *= 2
        raise CollectorError(f"{method} {url} failed after {MAX_ATTEMPTS} attempts: {last_error}")

    def get(self, path: str, **kwargs: Any) -> Any:
        return self.request("GET", path, **kwargs)

    def post(self, path: str, **kwargs: Any) -> Any:
        return self.request("POST", path, **kwargs)
