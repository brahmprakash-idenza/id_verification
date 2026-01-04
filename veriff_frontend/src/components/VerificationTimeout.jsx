import { useNavigate } from "react-router-dom";

export default function VerificationTimeout() {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Clear stale attempt
    localStorage.removeItem("veriff_context");

    // Send user back to start
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50">
      <div className="bg-white rounded-full p-6 shadow mb-6">
        <svg
          className="h-10 w-10 text-yellow-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
        </svg>
      </div>

      <h2 className="text-2xl font-semibold text-gray-900">
        Verification taking longer than expected
      </h2>

      <p className="mt-2 text-gray-600 text-sm text-center max-w-md">
        Sometimes verification can take a little longer. You can retry or come
        back later.
      </p>

      <button
        onClick={handleRetry}
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Retry verification
      </button>
    </div>
  );
}
