import { useEffect } from "react";

export default function VerificationSuccess() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "https://google.com";
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
      <div className="bg-white rounded-full p-6 shadow mb-6">
        <svg className="h-10 w-10 text-green-600" viewBox="0 0 24 24">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-semibold text-gray-900">
        Verification successful
      </h2>

      <p className="mt-2 text-gray-600 text-sm">
        Redirecting you shortly…
      </p>
    </div>
  );
}
