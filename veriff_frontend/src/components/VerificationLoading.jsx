import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const POLL_INTERVAL = 3000;        // 3s
const MAX_DURATION = 180000;       // 3 min

export default function VerificationLoading() {
  const navigate = useNavigate();

  const context = JSON.parse(
    localStorage.getItem("veriff_context") || "{}"
  );

  const { trackingId } = context;

  useEffect(() => {
    if (!trackingId) {
      navigate("/");
      return;
    }

    const startTime = Date.now();

    const interval = setInterval(async () => {
      try {
        // ⏱ Timeout check
        if (Date.now() - startTime > MAX_DURATION) {
          clearInterval(interval);
          navigate("/verification/timeout");
          return;
        }

        const res = await fetch(
          `/verification/status?trackingId=${trackingId}`
        );

        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "approved") {
          clearInterval(interval);
          navigate("/verification/success");
        }

        if (data.status === "declined") {
          clearInterval(interval);
          navigate("/verification/failure");
        }
        // pending → keep polling
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
