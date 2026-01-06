import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const POLL_INTERVAL = 3000;
const MAX_DURATION = 180000;
const SERVER_URL = "http://192.168.0.245:8080";

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
        if (Date.now() - startTime > MAX_DURATION) {
          clearInterval(interval);
          navigate("/verification/timeout");
          return;
        }

        const res = await fetch(
          `${SERVER_URL}/idv/verification/status?trackingId=${trackingId}&ngrok-skip-browser-warning=1`
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

        if (data.status === "approved") {
          clearInterval(interval);
          navigate("/verification/success");
        }

        if (data.status === "declined") {
          clearInterval(interval);
          navigate("/verification/failure", {
            state: {
              reason: data.reason,
              reasonCode: data.reasonCode,
            },
          });
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [trackingId, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 mb-4" />
      <h2 className="text-lg font-medium text-gray-900">
        Verifying your identity
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        This usually takes less than a minute
      </p>
    </div>
  );
}
