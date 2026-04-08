import { useState } from "react";
import idenza_logo from "../assets/idenza_logo.png";

export default function VeriffVerification({
  subscriberId, email, firstName, lastName, trackingId,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleVerification = () => {
    setError("");
    setLoading(true);
    try {
      // Read veriffUrl stored by CreateVerification when the session was created
      const raw = localStorage.getItem("veriff_context");
      const ctx = raw ? JSON.parse(raw) : {};

      if (!ctx.veriffUrl) {
        throw new Error("Veriff session URL not found. Please restart the verification.");
      }

      // Navigate to Veriff — no extra API call needed
      window.location.href = ctx.veriffUrl;

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <section
      className="min-h-screen flex items-center justify-center p-10"
      style={{ background: "linear-gradient(145deg,#f0f4f9 0%,#e8eef5 50%,#f0f4f9 100%)" }}
    >
      <div className="bg-white rounded-2xl p-11 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* Left — branding & instructions */}
        <div className="relative overflow-hidden">
          <div className="w-13 h-13 rounded-xl flex mb-4">
            <img src={idenza_logo} alt="Idenza" className="h-16" />
          </div>
          <h1
            className="text-4xl leading-tight mb-4"
            style={{ fontFamily: "'DM Serif Display', serif", color: "#0f2544" }}
          >
            Identity Verification
          </h1>
          <p className="text-base mb-6" style={{ color: "#5a6a80", lineHeight: 1.65, maxWidth: 340 }}>
            You're almost there. Review your details and start the identity check.
          </p>
          <ul className="space-y-3">
            {[
              "Takes less than 2 minutes",
              "Have your government-issued ID ready",
              "Ensure your camera is working",
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 rounded-lg flex items-center justify-center"
                  style={{ width: 28, height: 28, background: "#e0f2ec" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d6e5a" strokeWidth="2" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm pt-1" style={{ color: "#5a6a80" }}>{s}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — confirmation & verification trigger */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-8" style={{ border: "0.5px solid rgba(15,37,68,0.1)" }}>

            <div
              className="inline-flex items-center gap-2 rounded-full mb-5"
              style={{ background: "#e6f1fb", padding: "3px 12px 3px 3px" }}
            >
              <div
                className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                style={{ width: 22, height: 22, background: "#185FA5", fontSize: 10 }}
              >
                2
              </div>
              <span className="text-xs font-medium" style={{ color: "#0C447C" }}>
                Step 2 of 2 — Confirm &amp; verify
              </span>
            </div>

            <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "#8c9db0" }}>
              Verifying as
            </p>

            <div className="flex items-center gap-3 mb-3">
              <div
                className="rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                style={{ width: 42, height: 42, background: "#e6f1fb", color: "#185FA5" }}
              >
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "#0f2544" }}>
                  {firstName} {lastName}
                </p>
                <p className="text-xs" style={{ color: "#8c9db0" }}>{email}</p>
              </div>
            </div>

            <div style={{ height: "0.5px", background: "rgba(15,37,68,0.08)", margin: "12px 0" }} />

            <div className="flex flex-col mb-5" style={{ gap: 2 }}>
              {[
                ["Subscriber Name", "Idenza"],
                ["Session type",    "Document + Selfie"],
              ].map(([key, val]) => (
                <div
                  key={key}
                  className="flex justify-between items-center py-2"
                  style={{ borderBottom: "0.5px solid rgba(15,37,68,0.07)" }}
                >
                  <span className="text-xs" style={{ color: "#8c9db0" }}>{key}</span>
                  <span className="text-xs font-medium" style={{ color: "#0f2544" }}>{val}</span>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-xs mb-3" style={{ color: "#dc2626" }}>{error}</p>
            )}

            <button
              onClick={handleVerification}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-white transition-all disabled:opacity-55"
              style={{ background: "#0C447C" }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#185FA5"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#0C447C"; }}
            >
              {!loading && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
              {loading ? "Starting…" : "Start verification"}
            </button>
          </div>

          {/* Security note */}
          <div
            className="rounded-2xl p-5 flex gap-3"
            style={{ background: "#f8fafc", border: "0.5px solid rgba(15,37,68,0.1)" }}
          >
            <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="#0d6e5a" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className="text-xs" style={{ color: "#5a6a80", lineHeight: 1.6 }}>
              <strong style={{ color: "#0f2544", fontWeight: 500 }}>Your data is safe.</strong>{" "}
              All personal information is encrypted in transit and processed only for identity verification.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}