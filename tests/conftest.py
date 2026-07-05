import shutil
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kpi.config import load_config  # noqa: E402

FIXTURES = Path(__file__).parent / "fixtures"
FIXTURE_WEEKS = [f"2026-W{n:02d}" for n in range(14, 28)]
GENERATED_AT = "2026-07-06T10:45:00-04:00"


@pytest.fixture(scope="session")
def config():
    return load_config(FIXTURES / "config")


@pytest.fixture
def data_dir(tmp_path):
    """A scratch data dir seeded with the fixture sources + spend inputs."""
    shutil.copytree(FIXTURES / "sources", tmp_path / "sources")
    shutil.copytree(FIXTURES / "inputs" / "spend", tmp_path / "inputs" / "spend")
    return tmp_path


@pytest.fixture(scope="session")
def pipeline_run(tmp_path_factory, config):
    """Full pipeline over all fixture weeks, run once per test session."""
    from kpi import compute, history, spend

    root = tmp_path_factory.mktemp("pipeline")
    shutil.copytree(FIXTURES / "sources", root / "sources")
    shutil.copytree(FIXTURES / "inputs" / "spend", root / "inputs" / "spend")
    for wid in FIXTURE_WEEKS:
        spend.allocate_week(wid, root / "inputs" / "spend", config)
        compute.compute_week(wid, root, config, generated_at=GENERATED_AT)
    hist = history.rebuild(root)
    return root, hist
