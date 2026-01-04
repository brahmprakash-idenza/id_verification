import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import VeriffVerification from "./components/VeriffVerificationHero";
import VerificationLoading from "./components/VerificationLoading";
import VerificationSuccess from "./components/VerificationSuccess";
import VerificationFailure from "./components/VerificationFailure";
import VerificationTimeout from "./components/VerificationTimeout";
/**
 * Step 1: Start Veriff
 * Save context → launch Veriff
 */
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import VeriffVerification from "./components/VeriffVerificationHero";

export default function VerifyPage() {
  const {
    subscriberId,
    email,
    firstName,
    lastName,
    trackingId,
  } = useParams();

  // 🔓 Decode URL-encoded params
  const decodedEmail = decodeURIComponent(email);
  const decodedFirstName = decodeURIComponent(firstName);
  const decodedLastName = decodeURIComponent(lastName);

  // 💾 Persist context ONCE for later screens
  useEffect(() => {
    localStorage.setItem(
      "veriff_context",
      JSON.stringify({
        subscriberId,
        email: decodedEmail,     // RAW email
        firstName: decodedFirstName,
        lastName: decodedLastName,
        trackingId,
      })
    );
  }, [
    subscriberId,
    decodedEmail,
    decodedFirstName,
    decodedLastName,
    trackingId,
  ]);

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
        {/* Start verification */}
        <Route
          path="/verify/:subscriberId/:email/:firstName/:lastName/:trackingId"
          element={<VerifyPage />}
        />

        {/* After Veriff finishes */}
        <Route path="/verification/loading" element={<VerificationLoading />} />

        {/* Final states */}
        <Route path="/verification/success" element={<VerificationSuccess />} />
        <Route path="/verification/failure" element={<VerificationFailure />} />
        <Route path="/verification/timeout" element={<VerificationTimeout />} />
      </Routes>
    </BrowserRouter>
  );
}
