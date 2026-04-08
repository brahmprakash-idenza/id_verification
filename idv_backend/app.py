import os
import json
import hmac
import hashlib
import uuid
from urllib.parse import quote
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests as http_requests   # pip install requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)

ALLOWED_ORIGINS = [
    "https://veriff-test-delta.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS(
    app,
    origins=ALLOWED_ORIGINS,
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-HMAC-SIGNATURE"],
    supports_credentials=False,
    max_age=600,
    automatic_options=True,
)

VERIFF_PUBLISHABLE_KEY      = os.environ.get("VERIFF_PUBLISHABLE_KEY")
VERIFF_MASTER_SIGNATURE_KEY = os.environ.get("VERIFF_MASTER_SIGNATURE_KEY")
VERIFF_API                  = os.environ.get("VERIFF_API", "https://stationapi.veriff.com")

_raw_ui_url = os.environ.get("VERIFICATION_UI_URL", "").strip().rstrip("/")

if not _raw_ui_url:
    raise RuntimeError(
        "VERIFICATION_UI_URL env var is not set.\n"
        "Add it to your .env file:  VERIFICATION_UI_URL=http://localhost:3000\n"
        "Then restart gunicorn."
    )
VERIFICATION_UI_URL = _raw_ui_url

BASE_STORAGE = "veriff_storage"
os.makedirs(BASE_STORAGE, exist_ok=True)


def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def write_json(path: str, data: dict):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def make_callback_url(tracking_id: str) -> str:
    """
    Veriff only accepts HTTPS callback URLs (error code 1302).
    In production VERIFICATION_UI_URL is already https://.
    In local dev we swap the scheme so Veriff accepts it — the browser
    will follow the redirect back to localhost normally.
    """
    base = VERIFICATION_UI_URL
    base = base.replace("http://localhost", "https://localhost", 1).replace(
        "http://127.0.0.1", "https://127.0.0.1", 1
    )
    return f"{base}/verification/loading?trackingId={quote(tracking_id)}"


def sign_payload(payload_bytes: bytes) -> str:
    """HMAC-SHA256 hex signature of a JSON payload using the master signature key."""
    return hmac.new(
        VERIFF_MASTER_SIGNATURE_KEY.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()


def verify_veriff_signature(raw_body: bytes, received_signature: str) -> bool:
    if not received_signature or not VERIFF_MASTER_SIGNATURE_KEY:
        return False
    computed = sign_payload(raw_body)
    return hmac.compare_digest(computed, received_signature)


@app.route("/idv/verification/session", methods=["POST"])
def create_session():
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    required = ["subscriberId", "email", "firstName", "lastName", "trackingId"]
    missing  = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    tracking_id   = data["trackingId"]
    subscriber_id = data["subscriberId"]
    email         = data["email"]
    first_name    = data["firstName"]
    last_name     = data["lastName"]

    callback_url = make_callback_url(tracking_id)

    session_payload = {
        "verification": {
            "callback":   callback_url,
            "vendorData": json.dumps({
                "trackingId":   tracking_id,
                "subscriberId": subscriber_id,
                "email":        email,
            }),
            "person": {
                "firstName": first_name,
                "lastName":  last_name,
            },
        }
    }

    payload_bytes = json.dumps(session_payload).encode("utf-8")
    signature     = sign_payload(payload_bytes)

    print("=" * 60)
    print("→ Veriff API URL  :", f"{VERIFF_API}/v1/sessions")
    print("→ Publishable key :", VERIFF_PUBLISHABLE_KEY)
    print("→ Signature key set:", bool(VERIFF_MASTER_SIGNATURE_KEY))
    print("→ Payload         :", json.dumps(session_payload, indent=2))
    print("→ Signature       :", signature)
    print("=" * 60)

    try:
        resp = http_requests.post(
            f"{VERIFF_API}/v1/sessions",
            data=payload_bytes,
            headers={
                "Content-Type":     "application/json",
                "X-AUTH-CLIENT":    VERIFF_PUBLISHABLE_KEY,
                "X-HMAC-SIGNATURE": signature,
            },
            timeout=10,
        )

        print("=" * 60)
        print("← Veriff status   :", resp.status_code)
        print("← Veriff headers  :", dict(resp.headers))
        print("← Veriff body     :", resp.text)
        print("=" * 60)

        resp.raise_for_status()

    except http_requests.exceptions.HTTPError as e:
        try:
            veriff_error = resp.json()
        except Exception:
            veriff_error = resp.text
        print(f"Veriff HTTP error: {e}")
        return jsonify({
            "error":         "Veriff session creation failed",
            "veriff_status": resp.status_code,
            "veriff_error":  veriff_error,
        }), 502

    except http_requests.RequestException as e:
        print(f"Network error reaching Veriff: {e}")
        return jsonify({"error": f"Network error: {str(e)}"}), 502

    veriff_data = resp.json()
    print("Veriff session created successfully:", json.dumps(veriff_data, indent=2))

    session_url = veriff_data.get("verification", {}).get("url", "").replace(
        "https://localhost", "http://localhost", 1
    ).replace("https://127.0.0.1", "http://127.0.0.1", 1)

    session_id = veriff_data.get("verification", {}).get("id")

    if not session_url:
        print("Veriff response had no URL:", veriff_data)
        return jsonify({"error": "Veriff returned no session URL", "response": veriff_data}), 502

    # ✅ FIX: Only store veriffSessionId and verification_id.
    #    Do NOT overwrite "status" here — the webhook sets the real status
    #    (approved/declined/etc.). Overwriting it with "session_created" was
    #    causing the polling endpoint to return a status the frontend never
    #    acted on, and verificationId was always null.
    index_file = os.path.join(BASE_STORAGE, f"tracking_{tracking_id}.json")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            existing = json.load(f)
        existing["veriffSessionId"]  = session_id
        existing["verification_id"]  = session_id   # ✅ so status endpoint can return it immediately
        # Do NOT touch existing["status"] here
        write_json(index_file, existing)

    return jsonify({"url": session_url}), 201


@app.route("/veriff/webhook", methods=["POST", "OPTIONS"])
def veriff_webhook():
    if request.method == "OPTIONS":
        return "", 204

    raw_body           = request.data
    received_signature = request.headers.get("X-HMAC-SIGNATURE")

    if not verify_veriff_signature(raw_body, received_signature):
        return "Invalid signature", 401

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return "Invalid JSON body", 400

    verification    = payload.get("verification", {})
    verification_id = verification.get("id")

    if not verification_id:
        return "Missing verification ID", 400

    print("✅ Webhook received")
    print(json.dumps(payload, indent=2))

    verification_dir = os.path.join(BASE_STORAGE, verification_id)
    ensure_dir(verification_dir)
    write_json(os.path.join(verification_dir, "decision.json"), payload)

    vendor_data_raw = verification.get("vendorData")
    tracking_id     = None

    if vendor_data_raw:
        try:
            vendor_data = json.loads(vendor_data_raw)
            tracking_id = vendor_data.get("trackingId")
        except (json.JSONDecodeError, TypeError):
            pass

    if tracking_id:
        index_file = os.path.join(BASE_STORAGE, f"tracking_{tracking_id}.json")

        # ✅ FIX: Merge into existing tracking file instead of overwriting it,
        #    so we preserve subscriberId/email/name fields set during create_verification.
        existing = {}
        if os.path.exists(index_file):
            try:
                with open(index_file, "r", encoding="utf-8") as f:
                    existing = json.load(f)
            except (json.JSONDecodeError, OSError):
                pass

        existing.update({
            "verification_id": verification_id,   # ✅ key the status endpoint reads
            "veriffSessionId": verification_id,
            "status":          verification.get("status"),
            "updated_at":      verification.get("decisionTime"),
        })

        write_json(index_file, existing)
        print(f"📁 Updated tracking {tracking_id} → {verification.get('status')}")

    return "ok", 200


@app.route("/idv/verification/create", methods=["POST", "OPTIONS"])
def create_verification():
    if request.method == "OPTIONS":
        return "", 204

    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    required = ["subscriberId", "email", "firstName", "lastName"]
    missing  = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    subscriber_id = data["subscriberId"]
    email         = data["email"]
    first_name    = data["firstName"]
    last_name     = data["lastName"]
    tracking_id   = str(uuid.uuid4())

    write_json(
        os.path.join(BASE_STORAGE, f"tracking_{tracking_id}.json"),
        {
            "trackingId":   tracking_id,
            "subscriberId": subscriber_id,
            "email":        email,
            "firstName":    first_name,
            "lastName":     last_name,
            "status":       "started",
        },
    )

    verify_path = (
        f"{VERIFICATION_UI_URL}"
        f"/verify"
        f"/{quote(str(subscriber_id))}"
        f"/{quote(email)}"
        f"/{quote(first_name)}"
        f"/{quote(last_name)}"
        f"/{tracking_id}"
    )

    return jsonify({"trackingId": tracking_id, "verifyPath": verify_path}), 201


@app.route("/idv/verification/status", methods=["GET", "OPTIONS"])
def verification_status():
    if request.method == "OPTIONS":
        return "", 204

    tracking_id = request.args.get("trackingId")
    if not tracking_id:
        return jsonify({"status": "missing_tracking_id"}), 400

    index_file = os.path.join(BASE_STORAGE, f"tracking_{tracking_id}.json")
    if not os.path.exists(index_file):
        return jsonify({"status": "pending"}), 200

    try:
        with open(index_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return jsonify({"status": "error", "detail": "Corrupt status file"}), 500

    return jsonify({
        "status":         data.get("status"),
        "verificationId": data.get("verification_id"),
    }), 200


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"}), 200


if __name__ == "__main__":
    app.run(debug=True)