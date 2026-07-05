import pytest

from kpi.config import ConfigError, load_config


@pytest.fixture
def cfg():
    return load_config("tests/fixtures/config")


def test_loads_fixture_config(cfg):
    assert {r.key for r in cfg.reps} >= {"jsmith", "mgarcia"}
    assert cfg.default_channel == "other"
    assert cfg.stage("Contract Signed").cls == "sold"


def test_channel_for_source_mapping(cfg):
    assert cfg.channel_for_source("FB Lead Ad") == ("facebook", True)
    assert cfg.channel_for_source("  google ads ") == ("google", True)
    assert cfg.channel_for_source("yardsign") == ("other", False)
    assert cfg.channel_for_source(None) == ("other", False)


def test_division_and_stage_lookups(cfg):
    assert cfg.division_for("Insurance Restoration") == "insurance"
    assert cfg.division_for("Cash") == "retail"
    assert cfg.division_for("mystery") is None
    assert cfg.stage("lost").cls == "lost"
    assert cfg.stage("Nonexistent Stage") is None


def test_rep_lookup_by_system(cfg):
    rep = cfg.rep_by("companycam", "67890")
    assert rep is not None and rep.key == "jsmith"
    assert cfg.rep_by("leap", "no-such-id") is None


def test_real_config_dir_loads():
    # The committed production config must always at least parse.
    cfg = load_config("config")
    assert cfg.stages


def test_bad_stage_class_rejected(tmp_path):
    src = __import__("pathlib").Path("tests/fixtures/config")
    for f in src.glob("*.yaml"):
        (tmp_path / f.name).write_text(f.read_text())
    stages = tmp_path / "leap_stages.yaml"
    stages.write_text(stages.read_text().replace("class: sold", "class: won", 1))
    with pytest.raises(ConfigError, match="class"):
        load_config(tmp_path)


def test_duplicate_source_mapping_rejected(tmp_path):
    src = __import__("pathlib").Path("tests/fixtures/config")
    for f in src.glob("*.yaml"):
        (tmp_path / f.name).write_text(f.read_text())
    channels = tmp_path / "channels.yaml"
    text = channels.read_text().replace(
        'ghl_sources: ["Referral"', 'ghl_sources: ["Referral", "Facebook"', 1
    )
    channels.write_text(text)
    with pytest.raises(ConfigError, match="mapped to both"):
        load_config(tmp_path)
