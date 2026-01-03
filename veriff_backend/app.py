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
VERIFF_PUBLISHABLE_KEY = "f680f797-4076-4e73-9ee4-d54d3a635ac1"
VERIFF_PRIVATE_KEY = "c277b5fe-76e1-4fe8-92e3-0336dde350b5"  # if required by your plan
VERIFF_MASTER_SIGNATURE_KEY = "c277b5fe-76e1-4fe8-92e3-0336dde350b5"
BASE_URL = "https://b991b57b56d3.ngrok-free.app"  # ngrok or prod

VERIFF_API = "https://stationapi.veriff.com/v1"
import hmac
import hashlib


def verify_veriff_signature(raw_body: bytes, received_signature: str) -> bool:
    """
    Veriff HMAC verification
    """
    if not received_signature:
        return False

    computed_signature = hmac.new(
        VERIFF_MASTER_SIGNATURE_KEY.encode("utf-8"),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(computed_signature, received_signature)

# ===============================
# STORAGE (TXT FOR NOW)
# ===============================
STORAGE_DIR = "storage"
os.makedirs(STORAGE_DIR, exist_ok=True)

def write_txt(name, data):
    with open(os.path.join(STORAGE_DIR, name), "w", encoding="utf-8") as f:
        f.write(json.dumps(data, indent=2))

# ===============================
# SIGNATURE VERIFICATION
# ===============================
def verify_signature(payload, received_signature):
    mac = hmac.new(
        VERIFF_MASTER_SIGNATURE_KEY.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(mac, received_signature)

# ===============================
# WEBHOOK (SOURCE OF TRUTH)
# ===============================
@app.route("/veriff/webhook", methods=["POST"])
def veriff_webhook():
    raw_body = request.data
    received_signature = request.headers.get("X-HMAC-SIGNATURE")

    if not received_signature:
        print("❌ No signature header")
        return "Missing signature", 401

    if not verify_veriff_signature(raw_body, received_signature):
        print("❌ Invalid signature")
        return "Invalid signature", 401

    payload = json.loads(raw_body.decode())
    print("✅ Verified webhook:", payload["verification"]["id"])

    return "ok", 200



    return jsonify({"ok": True})

# ===============================
# FETCH EXTRACTED DATA (OCR ETC.)
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
    write_txt(f"{verification_id}_data.txt", data)
    return data

# ===============================
# FETCH MEDIA (DOCS, SELFIES)
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
    write_txt(f"{verification_id}_media.txt", media)
    return media

# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    app.run(debug=True)