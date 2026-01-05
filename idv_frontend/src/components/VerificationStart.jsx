import { useState } from "react";

const SERVER_URL = "https://fd60f8b9b8e0.ngrok-free.app"
export default function CreateVerification() {
  const [form, setForm] = useState({
    subscriberId: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${SERVER_URL}/verification/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to create verification");
      }

      const data = await res.json();

      // 🔁 Redirect to Veriff verification flow
      window.location.href = data.verifyPath;
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-semibold text-gray-900">
          Start verification
        </h1>

        <input
          name="subscriberId"
          placeholder="Subscriber ID"
          value={form.subscriberId}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />

        <input
          name="firstName"
          placeholder="First name"
          value={form.firstName}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />

        <input
          name="lastName"
          placeholder="Last name"
          value={form.lastName}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Starting…" : "Start verification"}
        </button>
      </form>
    </div>
  );
}
