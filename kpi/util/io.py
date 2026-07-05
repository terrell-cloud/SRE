"""Atomic, canonical JSON file IO so committed data diffs stay clean."""
from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path


def dumps_canonical(obj) -> str:
    return json.dumps(obj, indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def write_json(path: str | Path, obj) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(dumps_canonical(obj))
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise
    return path


def read_json(path: str | Path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)
