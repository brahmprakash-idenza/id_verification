import { useState } from "react";
import idenza_logo from "../assets/idenza_logo.png";

const SERVER_URL = process.env.REACT_APP_SERVER_URL;

export default function CreateVerification() {
  const [form, setForm] = useState({
    subscriberId: "1",   // set dynamically from auth context in production
    email: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/idv/verification/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create verification");
      }
      const data = await res.json();
      window.location.href = data.verifyPath;
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: "#ffffff", border: "1px solid #d1d5db", color: "#0f2544" };
  const inputFocus = (e) => { e.target.style.border = "1px solid #185FA5"; e.target.style.boxShadow = "0 0 0 3px rgba(24,95,165,0.12)"; };
  const inputBlur  = (e) => { e.target.style.border = "1px solid #d1d5db"; e.target.style.boxShadow = "none"; };

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
            Secure, automated identity checks to protect your account and satisfy compliance requirements.
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

        {/* Right — form */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-8" style={{ border: "0.5px solid rgba(15,37,68,0.1)" }}>

            {/* Step badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full mb-5"
              style={{ background: "#e0f2ec", padding: "3px 12px 3px 3px" }}
            >
              <div
                className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                style={{ width: 22, height: 22, background: "#0d6e5a", fontSize: 10 }}
              >
                1
              </div>
              <span className="text-xs font-medium" style={{ color: "#0d6e5a" }}>
                Step 1 of 2 — Enter your details
              </span>
            </div>

            <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: "#8c9db0" }}>
              Get started
            </p>
            <p className="text-sm mb-5" style={{ color: "#5a6a80" }}>
              Enter your details to begin the verification process.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 tracking-wide" style={{ color: "#374151" }}>
                  Email address
                </label>
                <input
                  name="email" type="email" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5 tracking-wide" style={{ color: "#374151" }}>
                    First name
                  </label>
                  <input
                    name="firstName" type="text" placeholder="Jane"
                    value={form.firstName} onChange={handleChange} required
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 tracking-wide" style={{ color: "#374151" }}>
                    Last name
                  </label>
                  <input
                    name="lastName" type="text" placeholder="Smith"
                    value={form.lastName} onChange={handleChange} required
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
              </div>

              {error && <p className="text-xs" style={{ color: "#dc2626" }}>{error}</p>}

              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-all disabled:opacity-55"
                style={{ background: loading ? "#0C447C" : "#185FA5" }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#0C447C"; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#185FA5"; }}
              >
                {!loading && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
                {loading ? "Starting…" : "Continue to verification"}
              </button>
            </form>
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