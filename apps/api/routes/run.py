# server.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import yfinance as yf
import pandas as pd

import tempfile, os, uuid, subprocess, shutil


router = APIRouter()

DEFAULT_TIMEOUT_MS = 60000

class RunRequest(BaseModel):
    code: str
    stdin: str | None = None
    timeout_ms: int | None = DEFAULT_TIMEOUT_MS

MAX_CODE_BYTES = 200_000       # 200 KB
MAX_STDOUT_BYTES = 1_000_000   # 1 MB
CPU_LIMIT = "1"                # 1 vCPU
MEM_LIMIT = "256m"             # 256 MB
PIDS_LIMIT = "128"

def _trim(b: bytes, limit: int) -> bytes:
    return b if len(b) <= limit else b[:limit] + b"\n[truncated]\n"

@router.post("/run")
def run_code(req: RunRequest):
    if len(req.code.encode("utf-8")) > MAX_CODE_BYTES:
        raise HTTPException(413, "Code too large")
    
    if req.timeout_ms is None:
        req.timeout_ms = DEFAULT_TIMEOUT_MS

    job = f"sand-{uuid.uuid4().hex[:12]}"
    tmp = tempfile.mkdtemp(prefix=job + "-")
    main_py = os.path.join(tmp, "main.py")
    try:
        with open(main_py, "w", encoding="utf-8") as f:
            f.write(req.code)

        # Build a locked-down docker run command
        # NOTE: we invoke `timeout` on the HOST to stop runaway containers.
        timeout_s = max(1, min(60, req.timeout_ms // 1000))  # clamp 1..60s

        cmd = [
            "docker", "run", "--rm", "-i",
            "--name", job,
            "--network=none",
            "--cpus", CPU_LIMIT,
            "--memory", MEM_LIMIT,
            "--pids-limit", PIDS_LIMIT,
            "--read-only",
            "--security-opt", "no-new-privileges",
            "--cap-drop", "ALL",
            "--user", "65534:65534",  # nobody
            "--workdir", "/workspace",
            "--tmpfs", "/tmp:rw,noexec,nosuid,nodev",
            "--tmpfs", "/run:rw,noexec,nosuid,nodev",
            "-v", f"{tmp}:/workspace:rw,delegated",
            "--ulimit", "nofile=256",
            "--ulimit", "nproc=64",
            "sandbox:latest",
            "python", "/workspace/main.py",
        ]

        print("Running command:", " ".join(cmd))

        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        stdin_bytes = (req.stdin or "").encode("utf-8")
        out, err = proc.communicate(input=stdin_bytes, timeout=req.timeout_ms // 1000)

        print("Command output:", out.decode("utf-8", errors="replace"))
        print("Command error output:", err.decode("utf-8", errors="replace"))

        # Did the host timeout kill it?
        timed_out = (proc.returncode == 124)  # GNU timeout exit code
        # Trim outputs
        out = _trim(out, MAX_STDOUT_BYTES)
        err = _trim(err, MAX_STDOUT_BYTES)

        # Best-effort cleanup in case of races
        if timed_out:
            subprocess.run(["docker", "rm", "-f", job], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        return {
            "timedOut": timed_out,
            "exitCode": None if timed_out else proc.returncode,
            "stdout": out.decode("utf-8", errors="replace"),
            "stderr": err.decode("utf-8", errors="replace"),
        }

    finally:
        shutil.rmtree(tmp, ignore_errors=True)
