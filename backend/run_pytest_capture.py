import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent
out = root / "pytest_run.txt"
cmd = [r"d:/hackquest/.venv/Scripts/python.exe", "-m", "pytest", str(root / "tests" / "test_api.py"), "-vv", "-ra"]
with out.open("wb") as f:
    print('Running:', ' '.join(cmd))
    subprocess.run(cmd, stdout=f, stderr=subprocess.STDOUT)
    print('Wrote pytest output to', out)
