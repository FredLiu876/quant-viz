# server.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import yfinance as yf
import pandas as pd
import json

import tempfile, os, uuid, subprocess, shutil


router = APIRouter()

DEFAULT_TIMEOUT_MS = 60000
RESULT_PATH = "/output/result.json"

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
    tmp_out = tempfile.mkdtemp(prefix=job + "-out-")
    alpha_py = os.path.join(tmp, "alpha.py")
    try:
        with open(alpha_py, "w", encoding="utf-8") as f:
            f.write(req.code)

        # Build a locked-down docker run command
        cmd = [
            "docker", "run", "--rm", "-i",
            "--name", job,
            #"--network=none", # Make an allowlist for yfinance in the future
            "--cpus", CPU_LIMIT,
            "--memory", MEM_LIMIT,
            "--pids-limit", PIDS_LIMIT,
            "--read-only",
            "--security-opt", "no-new-privileges",
            "--cap-drop", "ALL",
            "--user", "65534:65534",  # nobody
            "--workdir", "/code",
            "--tmpfs", "/tmp:rw,noexec,nosuid,nodev",
            "--tmpfs", "/run:rw,noexec,nosuid,nodev",
            "-v", f"{tmp}:/code:rw,delegated",
            "-v", f"{tmp_out}:/output:rw,delegated",
            "-e", f"RESULT_PATH={RESULT_PATH}",
            "--ulimit", "nofile=256",
            "--ulimit", "nproc=64",
            "sandbox:latest",
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

        out = out.decode("utf-8", errors="replace")
        err = err.decode("utf-8", errors="replace")
        
        print(out)
        print(err)

        # Trim outputs
        out = _trim(out, MAX_STDOUT_BYTES)
        err = _trim(err, MAX_STDOUT_BYTES)

        json_path = os.path.join(tmp_out, "result.json")
        parsed = None
        json_err = None

        try:
            with open(json_path, "rb") as f:
                raw = f.read()
            parsed = json.loads(raw.decode("utf-8"))
        except FileNotFoundError:
            json_err = "Result file not found (script did not write to RESULT_PATH)."
        except json.JSONDecodeError as e:
            json_err = f"Invalid JSON result: {e}"
        except Exception as e:
            json_err = f"Error reading result: {e}"

        print(parsed)

        return {
            "exitCode": proc.returncode,
            "stdout": out,
            "stderr": err,
        }

    finally:
        shutil.rmtree(tmp, ignore_errors=True)
