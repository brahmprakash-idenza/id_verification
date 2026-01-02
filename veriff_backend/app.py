import os
import json
import hmac
import hashlib
import datetime
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# ===============================
# 🔑 CONFIG — REPLACE THESE
# ===============================
VERIFF_PUBLISHABLE_KEY = "8f61bbb8-4a5c-4368-a230-35868019ed10"
VERIFF_PRIVATE_KEY = "Yca1bf8f8-2e0b-4f88-9270-bf060d08b9db"  # if required by your plan
VERIFF_MASTER_SIGNATURE_KEY = "YOUR_MASTER_SIGNATURE_KEY"
BASE_URL = "https://YOUR_PUBLIC_URL"  # ngrok or prod

VERIFF_API = "https://stationapi.veriff.com/v1"

# ===============================
# STORAGE (TXT FILES FOR NOW)
# ===============================
STORAGE_DIR = "storage"
os.makedirs(STORAGE_DIR, exist_ok=True)

def write_txt(name, data):
    path = os.path.join(STORAGE_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, indent=2, default=str))

# ===============================
# 1️⃣ CREATE VERIFF SESSION
# ===============================
@app.route("/veriff/session", methods=["POST"])
def create_session():
    data = request.json

    payload = {
        "verification": {
            "vendorData": data["userId"],
            "callback": f"{BASE_URL}/veriff/webhook",
            "person": {
                "firstName": data["firstName"],
                "lastName": data["lastName"],
                "email": data["email"]
            }
        }
    }

    headers = {
        "Content-Type": "application/json",
        "X-AUTH-CLIENT": VERIFF_PUBLISHABLE_KEY
    }

    res = requests.post(
        f"{VERIFF_API}/sessions/",
        headers=headers,
        json=payload,
        timeout=10
    )
    res.raise_for_status()

    verification = res.json()["verification"]

    # ---- STORE SESSION METADATA (DB LATER) ----
    write_txt(f"{verification['id']}_session.txt", verification)

    return jsonify({
        "verification": verification,
        "publicKey": VERIFF_PUBLISHABLE_KEY
    })

# ===============================
# 2️⃣ WEBHOOK (SOURCE OF TRUTH)
# ===============================
def verify_signature(payload, signature):
    mac = hmac.new(
        VERIFF_MASTER_SIGNATURE_KEY.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(mac, signature)

@app.route("/veriff/webhook", methods=["POST"])
def veriff_webhook():
    payload = request.data
    signature = request.headers.get("X-HMAC-SIGNATURE")

    if not signature or not verify_signature(payload, signature):
        return "Invalid signature", 401

    event = json.loads(payload)
    verification = event["verification"]
    vid = verification["id"]

    # ---- STORE RAW WEBHOOK (AUDIT LOG) ----
    write_txt(f"{vid}_webhook.txt", event)

    # OPTIONAL: Auto-fetch data & media after completion
    if verification["status"] == "completed":
        fetch_verification_data(vid)
        fetch_verification_media(vid)

    return jsonify({"ok": True})

# ===============================
# 3️⃣ FETCH EXTRACTED DATA (OCR, METADATA)
# ===============================
def fetch_verification_data(verification_id):
    headers = {
        "X-AUTH-CLIENT": VERIFF_PUBLISHABLE_KEY
    }

    res = requests.get(
        f"{VERIFF_API}/verifications/{verification_id}",
        headers=headers,
        timeout=10
    )
    res.raise_for_status()

    data = res.json()

    # ---- STORE EXTRACTED DATA ----
    write_txt(f"{verification_id}_data.txt", data)

    return data

@app.route("/veriff/data/<verification_id>", methods=["GET"])
def get_verification_data(verification_id):
    fetch_verification_data(verification_id)
    return jsonify({"ok": True})

# ===============================
# 4️⃣ FETCH MEDIA (DOC IMAGES, SELFIES)
# ===============================
def fetch_verification_media(verification_id):
    headers = {
        "X-AUTH-CLIENT": VERIFF_PUBLISHABLE_KEY
    }

    res = requests.get(
        f"{VERIFF_API}/media/{verification_id}",
        headers=headers,
        timeout=10
    )
    res.raise_for_status()

    media = res.json()

    # ---- STORE MEDIA METADATA / URLS ----
    write_txt(f"{verification_id}_media.txt", media)

    return media

@app.route("/veriff/media/<verification_id>", methods=["GET"])
def get_verification_media(verification_id):
    fetch_verification_media(verification_id)
    return jsonify({"ok": True})

# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    app.run(debug=True)
