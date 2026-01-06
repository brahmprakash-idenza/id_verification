import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function VerificationFailure() {
  const navigate = useNavigate();
  const location = useLocation();

  const reason = location.state?.reason;
  const reasonCode = location.state?.reasonCode;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
      <div className="bg-white rounded-full p-6 shadow mb-6">
        <svg className="h-10 w-10 text-red-600" viewBox="0 0 24 24">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-semibold text-gray-900">
        Verification failed
      </h2>

      <p className="mt-2 text-gray-600 text-sm text-center max-w-md">
        {reason
          ? reason
          : "We couldn’t verify your identity. Please try again or contact support."}
      </p>

      {reasonCode && (
        <p className="mt-1 text-xs text-gray-400">
          Reason code: {reasonCode}
        </p>
      )}

      <p className="mt-4 text-xs text-gray-400">
        Redirecting you in 5 seconds…
      </p>
    </div>
  );
}
