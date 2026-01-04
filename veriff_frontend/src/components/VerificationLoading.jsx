import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function VerificationLoading() {
  const navigate = useNavigate();

  const context = JSON.parse(
    localStorage.getItem("veriff_context") || "{}"
  );

  const { subscriberId } = context;

  useEffect(() => {
    if (!subscriberId) {
      navigate("/");
      return;
    }

    const interval = setInterval(async () => {
      const res = await fetch(
        `/verification/status?subscriberId=${subscriberId}`
      );
      const data = await res.json();

      if (data.status === "approved") {
        clearInterval(interval);
        navigate("/verification/success");
      }

      if (data.status === "declined") {
        clearInterval(interval);
        navigate("/verification/failure");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [subscriberId, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 mb-4" />
      <p>Verifying your identity…</p>
    </div>
  );
}
