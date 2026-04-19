import asyncio
import fcntl
import json
import logging
import os
import pty
import struct
import termios

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.oidc import oidc_verifier

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/terminal", tags=["terminal"])

SCRIPTS: dict[str, dict] = {
    "hf": {
        "name": "HuggingFace Model Manager",
        "cmd": ["python3", "-u", "/app/hf_scripts/hf.py"],
        "cwd": "/app/hf_scripts",
    },
}


@router.websocket("/{script_id}")
async def terminal_ws(websocket: WebSocket, script_id: str) -> None:
    await websocket.accept()

    # Pierwsza wiadomość musi zawierać token autoryzacyjny
    try:
        raw = await asyncio.wait_for(websocket.receive_text(), timeout=10.0)
        data = json.loads(raw)
        token = data.get("token", "")
        claims = await oidc_verifier.verify_access_token(token)
        roles: set[str] = set(claims.get("roles", []))
        if "hub-admin" not in roles:
            await websocket.send_text("\r\nBrak uprawnień (wymagana rola hub-admin).\r\n")
            await websocket.close(code=4003)
            return
    except Exception as exc:
        await websocket.send_text(f"\r\nBłąd autoryzacji: {exc}\r\n")
        await websocket.close(code=4001)
        return

    if script_id not in SCRIPTS:
        await websocket.send_text(f"\r\nNieznany skrypt: {script_id}\r\n")
        await websocket.close(code=4004)
        return

    script = SCRIPTS[script_id]

    # Utwórz PTY (pseudo-terminal)
    master_fd, slave_fd = pty.openpty()
    _set_winsize(master_fd, 24, 80)

    try:
        proc = await asyncio.create_subprocess_exec(
            *script["cmd"],
            stdin=slave_fd,
            stdout=slave_fd,
            stderr=slave_fd,
            cwd=script.get("cwd"),
            close_fds=True,
            env={**os.environ, "TERM": "xterm-256color", "PYTHONUNBUFFERED": "1"},
        )
    except Exception as exc:
        os.close(slave_fd)
        os.close(master_fd)
        await websocket.send_text(f"\r\nNie udało się uruchomić skryptu: {exc}\r\n")
        await websocket.close()
        return

    os.close(slave_fd)

    # master_fd jako nieblokujący
    fl = fcntl.fcntl(master_fd, fcntl.F_GETFL)
    fcntl.fcntl(master_fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

    loop = asyncio.get_event_loop()
    stop_event = asyncio.Event()

    async def read_output() -> None:
        while not stop_event.is_set():
            try:
                chunk = await loop.run_in_executor(None, _safe_read, master_fd)
                if chunk:
                    await websocket.send_bytes(chunk)
                else:
                    await asyncio.sleep(0.01)
            except OSError:
                break
            except Exception as exc:
                logger.error("PTY read error: %s", exc)
                break
        stop_event.set()

    async def write_input() -> None:
        try:
            while not stop_event.is_set():
                message = await websocket.receive()
                if message["type"] == "websocket.disconnect":
                    break
                if message.get("bytes"):
                    os.write(master_fd, message["bytes"])
                elif message.get("text"):
                    try:
                        msg = json.loads(message["text"])
                        if msg.get("type") == "resize":
                            _set_winsize(master_fd, int(msg["rows"]), int(msg["cols"]))
                    except Exception:
                        pass
        except WebSocketDisconnect:
            pass
        except Exception as exc:
            logger.error("WS input error: %s", exc)
        finally:
            stop_event.set()

    try:
        await asyncio.gather(read_output(), write_input())
    finally:
        try:
            proc.kill()
        except Exception:
            pass
        try:
            os.close(master_fd)
        except Exception:
            pass
        await proc.wait()
        try:
            msg = f"\r\n\x1b[33m[Skrypt zakończony z kodem {proc.returncode}]\x1b[0m\r\n"
            await websocket.send_bytes(msg.encode())
        except Exception:
            pass


def _safe_read(fd: int) -> bytes:
    try:
        return os.read(fd, 4096)
    except BlockingIOError:
        return b""


def _set_winsize(fd: int, rows: int, cols: int) -> None:
    try:
        winsize = struct.pack("HHHH", rows, cols, 0, 0)
        fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)
    except Exception:
        pass
