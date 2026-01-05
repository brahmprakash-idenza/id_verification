import os
import json
import hmac
import hashlib
import requests
from flask import Flask, request, jsonify # type: ignore
import uuid
app = Flask(__name__)
from flask_cors import CORS # type: ignore

app = Flask(__name__)

CORS(app, resources={
    r"/verification/*": {
        "origins": ["https://veriff-test-delta.vercel.app"]
    }
})

# ===============================
# 🔑 CONFIG (MOVE TO ENV LATER)
# ===============================
VERIFF_PUBLISHABLE_KEY = "8f61bbb8-4a5c-4368-a230-35868019ed10"
VERIFF_MASTER_SIGNATURE_KEY = "ca1bf8f8-2e0b-4f88-9270-bf060d08b9db"
VERIFICATION_UI_URL = "https://veriff-test-delta.vercel.app"
VERIFF_API = "https://stationapi.veriff.com"

# ===============================
# 📁 STORAGE
# ===============================
BASE_STORAGE = "veriff_storage"
os.makedirs(BASE_STORAGE, exist_ok=True)

def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)

def write_json(path: str, data: dict):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

# ===============================
# 🔐 HMAC VERIFICATION
# ===============================
def verify_veriff_signature(raw_body: bytes, received_signature: str) -> bool:
    if not received_signature:
        return False

    computed = hmac.new(
        VERIFF_MASTER_SIGNATURE_KEY.encode("utf-8"),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(computed, received_signature)

# ===============================
# 📡 WEBHOOK (SOURCE OF TRUTH)
# ===============================
@app.route("/veriff/webhook", methods=["POST"])
def veriff_webhook():
    raw_body = request.data
    received_signature = request.headers.get("X-HMAC-SIGNATURE")

    if not verify_veriff_signature(raw_body, received_signature):
        return "Invalid signature", 401

    payload = json.loads(raw_body.decode("utf-8"))
    verification = payload.get("verification", {})
    verification_id = verification.get("id")

    if not verification_id:
        return "Missing verification ID", 400

    print("✅ Verified webhook received")
    print(json.dumps(payload, indent=2))

    # Create verification folder
    verification_dir = os.path.join(BASE_STORAGE, verification_id)
    ensure_dir(verification_dir)

    # Store decision webhook
    write_json(
        os.path.join(verification_dir, "decision.json"),
        payload
    )

    vendor_data_raw = verification.get("vendorData")
    tracking_id = None

    if vendor_data_raw:
        try:
            vendor_data = json.loads(vendor_data_raw)
            tracking_id = vendor_data.get("trackingId")
        except Exception:
            pass
        
    if tracking_id:
        write_json(
            os.path.join(BASE_STORAGE, f"tracking_{tracking_id}.json"),
            {
                "verification_id": verification_id,
                "status": verification.get("status"),
                "updated_at": verification.get("decisionTime")
            }
        )

    print(f"📁 Stored verification {verification_id}")

    return "ok", 200


@app.route("/verification/status", methods=["GET"])
def verification_status():
    tracking_id = request.args.get("trackingId")

    if not tracking_id:
        return jsonify({"status": "missing_tracking_id"}), 400

    index_file = os.path.join(
        BASE_STORAGE,
        f"tracking_{tracking_id}.json"
    )

    # Not verified yet
    if not os.path.exists(index_file):
        return jsonify({"status": "pending"}), 200

    with open(index_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    return jsonify({
        "status": data.get("status"),
        "verificationId": data.get("verification_id")
    }), 200


from urllib.parse import quote

@app.route("/verification/create", methods=["POST"])
def create_verification():
    data = request.get_json(force=True)

    subscriber_id = data["subscriberId"]
    email = data["email"]          # RAW email
    first_name = data["firstName"]
    last_name = data["lastName"]

    tracking_id = str(uuid.uuid4())

    # Store RAW values (source of truth)
    context = {
        "trackingId": tracking_id,
        "subscriberId": subscriber_id,
        "email": email,
        "firstName": first_name,
        "lastName": last_name,
        "status": "started"
    }

    with open(f"veriff_storage/tracking_{tracking_id}.json", "w") as f:
        json.dump(context, f, indent=2)

    # Encode ONLY for URL safety
    verify_path = (
        f"{VERIFICATION_UI_URL}"
        f"/verify/"
        f"{quote(subscriber_id)}/"
        f"{quote(email)}/"
        f"{quote(first_name)}/"
        f"{quote(last_name)}/"
        f"{tracking_id}"
    )

    return jsonify({
        "trackingId": tracking_id,
        "verifyPath": verify_path
    })


# ===============================
# 🧪 HEALTH CHECK
# ===============================
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"}), 200

# ===============================
# 🚀 RUN SERVER
# ===============================
if __name__ == "__main__":
    app.run(debug=True)
