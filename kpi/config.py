"""Load and validate the four YAML config files.

Fails loud on structural problems (missing keys, bad classes, duplicate
mappings) so config drift is caught at load time, not as silent bad numbers.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path

import yaml

VALID_STAGE_CLASSES = {"open", "sold", "lost"}
VALID_PIPELINE_ROLES = {"appointment_set", "appointment_run", "estimate_given", "contract_signed"}
VALID_PRODUCTION_ROLES = {"started", "in_production", "completed"}

_ENV_RE = re.compile(r"\$\{([A-Z0-9_]+)\}")


class ConfigError(Exception):
    pass


def _interpolate_env(value):
    if isinstance(value, str):
        return _ENV_RE.sub(lambda m: os.environ.get(m.group(1), ""), value)
    if isinstance(value, dict):
        return {k: _interpolate_env(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_interpolate_env(v) for v in value]
    return value


@dataclass
class Rep:
    key: str
    name: str
    active: bool
    leap_user_id: str
    companycam_user_id: str
    ghl_user_id: str


@dataclass
class Channel:
    key: str
    label: str
    qb_account: str | None
    ghl_sources: list[str]


@dataclass
class Stage:
    name: str
    cls: str
    pipeline: str | None = None
    production: str | None = None


@dataclass
class Config:
    settings: dict
    reps: list[Rep]
    unmapped_policy: str
    channels: list[Channel]
    default_channel: str
    stages: list[Stage]
    division_field: str
    division_values: dict[str, list[str]]
    source_field: str
    _source_to_channel: dict[str, str] = field(default_factory=dict)
    _stage_by_name: dict[str, Stage] = field(default_factory=dict)

    # --- lookup helpers used by compute ---

    def channel_for_source(self, source_raw: str | None) -> tuple[str, bool]:
        """(channel key, was_mapped). Empty/unknown sources -> default channel."""
        key = (source_raw or "").strip().lower()
        if key and key in self._source_to_channel:
            return self._source_to_channel[key], True
        return self.default_channel, False

    def stage(self, stage_raw: str | None) -> Stage | None:
        return self._stage_by_name.get((stage_raw or "").strip().lower())

    def division_for(self, value_raw: str | None) -> str | None:
        v = (value_raw or "").strip().lower()
        for division, values in self.division_values.items():
            if v in [x.lower() for x in values]:
                return division
        return None

    def rep_by(self, system: str, user_id) -> Rep | None:
        attr = f"{system}_user_id"
        uid = str(user_id)
        for rep in self.reps:
            if getattr(rep, attr) == uid:
                return rep
        return None

    def channel_by_qb_account(self, account_name: str) -> Channel | None:
        for ch in self.channels:
            if ch.qb_account and ch.qb_account.lower() == account_name.lower():
                return ch
        return None


def _load_yaml(path: Path):
    if not path.exists():
        raise ConfigError(f"missing config file: {path}")
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def load_config(config_dir: str | Path = "config") -> Config:
    config_dir = Path(config_dir)
    settings = _interpolate_env(_load_yaml(config_dir / "settings.yaml"))
    reps_doc = _load_yaml(config_dir / "reps.yaml")
    channels_doc = _load_yaml(config_dir / "channels.yaml")
    stages_doc = _load_yaml(config_dir / "leap_stages.yaml")

    reps = []
    seen_keys: set[str] = set()
    for r in reps_doc.get("reps", []):
        for req in ("key", "name"):
            if not r.get(req):
                raise ConfigError(f"reps.yaml: rep missing '{req}': {r}")
        if r["key"] in seen_keys:
            raise ConfigError(f"reps.yaml: duplicate rep key {r['key']!r}")
        seen_keys.add(r["key"])
        reps.append(
            Rep(
                key=r["key"],
                name=r["name"],
                active=bool(r.get("active", True)),
                leap_user_id=str(r.get("leap_user_id", "")),
                companycam_user_id=str(r.get("companycam_user_id", "")),
                ghl_user_id=str(r.get("ghl_user_id", "")),
            )
        )
    unmapped_policy = reps_doc.get("unmapped_policy", "warn")
    if unmapped_policy not in ("warn", "error"):
        raise ConfigError(f"reps.yaml: unmapped_policy must be warn|error, got {unmapped_policy!r}")

    channels = []
    source_to_channel: dict[str, str] = {}
    channel_keys: set[str] = set()
    for c in channels_doc.get("channels", []):
        if not c.get("key"):
            raise ConfigError(f"channels.yaml: channel missing 'key': {c}")
        if c["key"] in channel_keys:
            raise ConfigError(f"channels.yaml: duplicate channel key {c['key']!r}")
        channel_keys.add(c["key"])
        ch = Channel(
            key=c["key"],
            label=c.get("label", c["key"]),
            qb_account=c.get("qb_account"),
            ghl_sources=[str(s) for s in c.get("ghl_sources", [])],
        )
        channels.append(ch)
        for s in ch.ghl_sources:
            norm = s.strip().lower()
            if norm in source_to_channel and source_to_channel[norm] != ch.key:
                raise ConfigError(
                    f"channels.yaml: source {s!r} mapped to both "
                    f"{source_to_channel[norm]!r} and {ch.key!r}"
                )
            source_to_channel[norm] = ch.key
    default_channel = channels_doc.get("default_channel", "other")
    if default_channel not in channel_keys:
        raise ConfigError(
            f"channels.yaml: default_channel {default_channel!r} is not a defined channel"
        )

    stages = []
    stage_by_name: dict[str, Stage] = {}
    for s in stages_doc.get("stages", []):
        if not s.get("name"):
            raise ConfigError(f"leap_stages.yaml: stage missing 'name': {s}")
        cls = s.get("class")
        if cls not in VALID_STAGE_CLASSES:
            raise ConfigError(
                f"leap_stages.yaml: stage {s['name']!r} has class {cls!r}, "
                f"must be one of {sorted(VALID_STAGE_CLASSES)}"
            )
        pipeline = s.get("pipeline")
        if pipeline is not None and pipeline not in VALID_PIPELINE_ROLES:
            raise ConfigError(f"leap_stages.yaml: bad pipeline role {pipeline!r} on {s['name']!r}")
        production = s.get("production")
        if production is not None and production not in VALID_PRODUCTION_ROLES:
            raise ConfigError(
                f"leap_stages.yaml: bad production role {production!r} on {s['name']!r}"
            )
        st = Stage(name=s["name"], cls=cls, pipeline=pipeline, production=production)
        norm = st.name.strip().lower()
        if norm in stage_by_name:
            raise ConfigError(f"leap_stages.yaml: duplicate stage name {st.name!r}")
        stage_by_name[norm] = st
        stages.append(st)
    if not stages:
        raise ConfigError("leap_stages.yaml: no stages defined")

    division_values = stages_doc.get("division_values", {})
    for div in ("retail", "insurance"):
        if not division_values.get(div):
            raise ConfigError(f"leap_stages.yaml: division_values.{div} is required")

    return Config(
        settings=settings,
        reps=reps,
        unmapped_policy=unmapped_policy,
        channels=channels,
        default_channel=default_channel,
        stages=stages,
        division_field=stages_doc.get("division_field", "job_type"),
        division_values=division_values,
        source_field=stages_doc.get("source_field", "referred_by"),
        _source_to_channel=source_to_channel,
        _stage_by_name=stage_by_name,
    )
