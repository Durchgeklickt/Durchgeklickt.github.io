import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from collections import defaultdict
import time

app = FastAPI()

ALLOWED_ORIGINS = [
    "https://durchgeklickt.com",
    "https://www.durchgeklickt.com",
    "https://durchgeklickt.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

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

_rate_limit: dict = defaultdict(list)
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX = 10

def check_rate_limit(ip: str) -> bool:
    now = time.time()
    _rate_limit[ip] = [t for t in _rate_limit[ip] if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limit[ip]) >= RATE_LIMIT_MAX:
        return False
    _rate_limit[ip].append(now)
    return True


class ChatRequest(BaseModel):
    message: str
    history: list = []


@app.post("/chat")
async def chat(req: ChatRequest, request: Request):
    ip = request.client.host if request.client else "unknown"

    if not check_rate_limit(ip):
        raise HTTPException(429, "Zu viele Anfragen, bitte kurz warten.")

    msg = req.message.strip()
    if not msg:
        raise HTTPException(400, "Leere Nachricht.")
    if len(msg) > 600:
        raise HTTPException(400, "Nachricht zu lang (max. 600 Zeichen).")

    safe_history = []
    for turn in req.history[-6:]:
        if (
            isinstance(turn, dict)
            and turn.get("role") in ("user", "model")
            and isinstance(turn.get("parts"), list)
        ):
            safe_history.append(turn)

    try:
        model = genai.GenerativeModel(
            "gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )
        chat_session = model.start_chat(history=safe_history)
        response = chat_session.send_message(msg)
        return {"reply": response.text, "ok": True}
    except Exception:
        raise HTTPException(500, "Antwort konnte nicht abgerufen werden.")


@app.get("/health")
async def health():
    return {"status": "ok"}
