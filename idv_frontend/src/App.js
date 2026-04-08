import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { useEffect } from "react";
import VeriffVerification from "./components/VeriffVerificationHero";
import VerificationLoading from "./components/VerificationLoading";
import VerificationSuccess from "./components/VerificationSuccess";
import VerificationFailure from "./components/VerificationFailure";
import VerificationTimeout from "./components/VerificationTimeout";
import VerificationStart from "./components/VerificationStart";

function VerifyPage() {
  const {
    subscriberId,
    email,
    firstName,
    lastName,
    trackingId,
  } = useParams();

  const decodedEmail     = decodeURIComponent(email);
  const decodedFirstName = decodeURIComponent(firstName);
  const decodedLastName  = decodeURIComponent(lastName);

  useEffect(() => {
    // ✅ Read existing context first so we don't lose veriffUrl
    let existing = {};
    try {
      const raw = localStorage.getItem("veriff_context");
      if (raw) existing = JSON.parse(raw);
    } catch (_) {}

    // Merge URL params into existing context — preserves veriffUrl
    localStorage.setItem(
      "veriff_context",
      JSON.stringify({
        ...existing,              // ← keeps veriffUrl from CreateVerification
        subscriberId,
        email:     decodedEmail,
        firstName: decodedFirstName,
        lastName:  decodedLastName,
        trackingId,
      })
    );
  }, [subscriberId, decodedEmail, decodedFirstName, decodedLastName, trackingId]);

  return (
    <VeriffVerification
      subscriberId={subscriberId}
      email={decodedEmail}
      firstName={decodedFirstName}
      lastName={decodedLastName}
      trackingId={trackingId}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VerificationStart />} />
        <Route
          path="/verify/:subscriberId/:email/:firstName/:lastName/:trackingId"
          element={<VerifyPage />}
        />
        <Route path="/verification/loading" element={<VerificationLoading />} />
        <Route path="/verification/success"  element={<VerificationSuccess />} />
        <Route path="/verification/failure"  element={<VerificationFailure />} />
        <Route path="/verification/timeout"  element={<VerificationTimeout />} />
      </Routes>
    </BrowserRouter>
  );
}