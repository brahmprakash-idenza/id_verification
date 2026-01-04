import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import VeriffVerification from "./components/VeriffVerificationHero";
import VerificationLoading from "./components/VerificationLoading";
import VerificationSuccess from "./components/VerificationSuccess";
import VerificationFailure from "./components/VerificationFailure";

/**
 * Step 1: Start Veriff
 * Save context → launch Veriff
 */
function VerifyPage() {
  const { subscriberId, email, firstName, lastName, trackingId } = useParams();

  // Persist context for later screens
  localStorage.setItem(
    "veriff_context",
    JSON.stringify({
      subscriberId,
      email,
      trackingId
    })
  );

  return (
    <VeriffVerification
      subscriberId={subscriberId}
      email={email}
      firstName={firstName}
      lastName={lastName}
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
          path="/verify/:subscriberId/:email/:firstName/:lastName"
          element={<VerifyPage />}
        />

        {/* After Veriff finishes */}
        <Route
          path="/verification/loading"
          element={<VerificationLoading />}
        />

        {/* Final states */}
        <Route
          path="/verification/success"
          element={<VerificationSuccess />}
        />
        <Route
          path="/verification/failure"
          element={<VerificationFailure />}
        />
      </Routes>
    </BrowserRouter>
  );
}
