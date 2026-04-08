import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const POLL_INTERVAL = 3000;
const MAX_DURATION = 180000;
const SERVER_URL = process.env.REACT_APP_SERVER_URL;

// Veriff terminal statuses that map to success
const APPROVED_STATUSES = new Set(["approved"]);

// Veriff terminal statuses that map to failure
const DECLINED_STATUSES = new Set([
  "declined",
  "resubmission_requested",
  "abandoned",
  "expired",
]);

export default function VerificationLoading() {
  const navigate = useNavigate();

  function getVeriffContext() {
    try {
      const raw = localStorage.getItem("veriff_context");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  const { trackingId } = getVeriffContext();

  useEffect(() => {
    if (!trackingId) {
      navigate("/verification/timeout");
      return;
    }

    const startTime = Date.now();

    const interval = setInterval(async () => {
      try {
        // ── Timeout guard ───────────────────────────────────────────────────
        if (Date.now() - startTime > MAX_DURATION) {
          clearInterval(interval);
          navigate("/verification/timeout");
          return;
        }

        const res = await fetch(
          `${SERVER_URL}/idv/verification/status?trackingId=${trackingId}`
        );

        console.log(
          "Polling response:",
          res.status,
          res.headers.get("content-type")
        );

        if (!res.ok) return;

        let data;
        const contentType = res.headers.get("content-type") || "";

        try {
          if (contentType.includes("application/json")) {
            data = await res.json();
          } else {
            const text = await res.text();
            console.error("❌ Non-JSON response:", text);
            return;
          }
        } catch (err) {
          console.error("❌ Failed to parse response:", err);
          return;
        }

        const { status } = data;

        // ✅ FIX: Log every intermediate status so stalls are visible in devtools
        console.log("⏳ Verification status:", status);

        // ── Terminal: success ───────────────────────────────────────────────
        if (APPROVED_STATUSES.has(status)) {
          clearInterval(interval);
          navigate("/verification/success");
          return;
        }

        // ── Terminal: failure ───────────────────────────────────────────────
        if (DECLINED_STATUSES.has(status)) {
          clearInterval(interval);
          navigate("/verification/failure", {
            state: {
              reason:     data.reason,
              reasonCode: data.reasonCode,
            },
          });
          return;
        }

        // ── Non-terminal statuses: keep polling ─────────────────────────────
        // "started", "submitted", "processing", "session_created", "pending", etc.
        // Nothing to do — the interval will fire again in POLL_INTERVAL ms.

      } catch (err) {
        console.error("Polling error:", err);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [trackingId, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="animate-spin h-10 w-10 border-4 border-gray-200 border-b-blue-600 rounded-full mb-4" />
      <h2 className="text-lg font-medium text-gray-900">
        Verifying your identity
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        This usually takes less than a minute
      </p>
    </div>
  );
}