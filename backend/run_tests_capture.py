import sys
import pytest
from pathlib import Path

p = Path(__file__).parent / "pytest_capture.txt"
with p.open("w", encoding="utf8") as f:
    old_stdout, old_stderr = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = f, f
    try:
        # Run the full backend test suite (verbose, report all)
        tests_path = str(Path(__file__).parent / "tests")
        pytest.main(["-vv", "-ra", tests_path])
    finally:
        sys.stdout, sys.stderr = old_stdout, old_stderr
print(f"Wrote pytest output to: {p}")
