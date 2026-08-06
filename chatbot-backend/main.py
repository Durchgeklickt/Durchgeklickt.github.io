import os
import time
from collections import defaultdict
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, field_validator

# Disable FastAPI auto-docs — no info leakage via /docs /redoc /openapi.json
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

ALLOWED_ORIGINS = [
    "https://durchgeklickt.com",
    "https://www.durchgeklickt.com",
    "https://durchgeklickt.github.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

client = Groq(api_key=os.environ["GROQ_API_KEY"])

SYSTEM_PROMPT = """Du bist der Assistent von Durchgeklickt — einem lokalen Dienstleister aus Fürth, der kleinen Betrieben (Friseuren, Kosmetikstudios, Praxen, Massagestudios, Nagelstudios) Online-Terminbuchungs-Systeme einrichtet.

Was du weißt:
- Durchgeklickt ist zertifizierter Partner von Shore, Fresha, SumUp, Jimdo und myPOS
- Die Einrichtung ist 0 € für den Betrieb — Durchgeklickt wird vom Tool-Anbieter durch eine Partnerprovision bezahlt
- Kein Vertrag mit Durchgeklickt nötig, nur mit dem jeweiligen Tool-Anbieter
- Leistungen: Tool-Auswahl, komplette Einrichtung, 30 Tage Nachbetreuung
- Einsatzgebiet: Fürth, Nürnberg, Erlangen und Umgebung
- Kontakt: D.Durchgeklickt@gmail.com | Lehmusstraße 35, 90766 Fürth

Tool-Empfehlungen nach Betriebsart:
- Friseur / Kosmetik / Nagelstudio: Shore (sehr beliebt, App für Kunden) oder Fresha (kostenlos für Betriebe, modern)
- Arztpraxis / Heilpraktiker / Physio: Shore (DSGVO-konform, Pufferzeiten, Erinnerungen)
- Einzelhandel / Café mit Beratungsterminen: Jimdo (Website + Buchung aus einer Hand)
- Betriebe die Kartenzahlung brauchen: SumUp oder myPOS (inkl. Online-Buchung)

Deine Aufgabe:
- Beantworte kurze Fragen zu Buchungssystemen, Tools, Kosten, Ablauf — freundlich und direkt
- Halte Antworten kurz (2-3 Sätze), kein Marketing-Sprech
- Wenn jemand konkretes Interesse zeigt: lade sie ein, das Kontaktformular auf der Seite auszufüllen oder direkt zu schreiben an D.Durchgeklickt@gmail.com
- Erfinde keine konkreten Preise oder Provisionsbeträge — sag "das klären wir im persönlichen Gespräch"
- Gib dich nicht als Mensch aus — du bist ein digitaler Assistent
- Antworte immer auf Deutsch"""

# ── Rate Limiting ──────────────────────────────────────────────────────────────
_rate_limit: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60        # Sekunden
RATE_LIMIT_MAX    = 10        # Requests pro IP pro Minute
RATE_LIMIT_DAILY  = 80        # Tages-Obergrenze pro IP (Schutz gegen langsame Floods)
_rate_limit_daily: dict[str, list[float]] = defaultdict(list)
_last_cleanup = 0.0
CLEANUP_INTERVAL = 300        # alle 5 Minuten alten State bereinigen


def _real_ip(request: Request) -> str:
    """Railway sitzt hinter einem Reverse Proxy — X-Forwarded-For auswerten."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Nur erste IP nehmen; Rest kann durch Angreifer gesetzt sein
        ip = forwarded.split(",")[0].strip()
        # Grundlegende Sanity-Check: nicht leer, nicht zu lang
        if ip and len(ip) < 50:
            return ip
    return request.client.host if request.client else "unknown"


def _cleanup_stale() -> None:
    """Entfernt abgelaufene Einträge — verhindert unbegrenztes RAM-Wachstum."""
    global _last_cleanup
    now = time.time()
    if now - _last_cleanup < CLEANUP_INTERVAL:
        return
    _last_cleanup = now
    day = 86400
    stale_min = [k for k, v in _rate_limit.items() if not v or now - v[-1] > RATE_LIMIT_WINDOW * 2]
    stale_day = [k for k, v in _rate_limit_daily.items() if not v or now - v[-1] > day]
    for k in stale_min:
        del _rate_limit[k]
    for k in stale_day:
        del _rate_limit_daily[k]


def _check_rate_limit(ip: str) -> bool:
    now = time.time()
    _cleanup_stale()

    # Minuten-Fenster
    _rate_limit[ip] = [t for t in _rate_limit[ip] if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limit[ip]) >= RATE_LIMIT_MAX:
        return False

    # Tages-Fenster
    _rate_limit_daily[ip] = [t for t in _rate_limit_daily[ip] if now - t < 86400]
    if len(_rate_limit_daily[ip]) >= RATE_LIMIT_DAILY:
        return False

    _rate_limit[ip].append(now)
    _rate_limit_daily[ip].append(now)
    return True


# ── Security Headers Middleware ────────────────────────────────────────────────
_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
}


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    for key, value in _SECURITY_HEADERS.items():
        response.headers[key] = value
    return response


# ── Request Models ─────────────────────────────────────────────────────────────
MAX_MSG_LEN = 500
MAX_HISTORY_TURNS = 4      # letzte 4 Hin-und-Her-Paare = 8 Nachrichten
MAX_HISTORY_MSG_LEN = 300  # pro History-Nachricht


class ChatRequest(BaseModel):
    message: str
    history: list[Any] = []

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("empty")
        if len(v) > MAX_MSG_LEN:
            raise ValueError("too long")
        return v

    @field_validator("history")
    @classmethod
    def cap_history(cls, v: list) -> list:
        return v[-(MAX_HISTORY_TURNS * 2):]


def _to_openai_history(raw: list) -> list:
    """Handles both OpenAI format {role, content} and Gemini format {role, parts}."""
    result = []
    for turn in raw:
        if not isinstance(turn, dict):
            continue
        role = turn.get("role")
        if role == "model":
            role = "assistant"
        if role not in ("user", "assistant"):
            continue
        # OpenAI format: {role, content}
        content = turn.get("content", "")
        if not content:
            # Gemini format: {role, parts: [{text: "..."}]}
            parts = turn.get("parts", [])
            if isinstance(parts, list) and parts:
                content = parts[0].get("text", "") if isinstance(parts[0], dict) else str(parts[0])
            elif isinstance(parts, str):
                content = parts
        content = str(content).strip()[:MAX_HISTORY_MSG_LEN]
        if content:
            result.append({"role": role, "content": content})
    return result


# ── Endpoints ──────────────────────────────────────────────────────────────────
@app.post("/chat")
async def chat(req: ChatRequest, request: Request):
    ip = _real_ip(request)
    if not _check_rate_limit(ip):
        raise HTTPException(429, "Zu viele Anfragen, bitte kurz warten.")

    history = _to_openai_history(req.history)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history + [
        {"role": "user", "content": req.message}
    ]

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            max_tokens=300,
            temperature=0.7,
        )
        return {"reply": completion.choices[0].message.content, "ok": True}
    except Exception:
        raise HTTPException(500, "Antwort konnte nicht abgerufen werden.")


@app.get("/health")
async def health():
    return {"status": "ok"}
