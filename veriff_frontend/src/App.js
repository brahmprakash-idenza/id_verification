import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import VeriffVerification from "./components/widgets/VeriffVerification";

function VerifyPage() {
  const { subscriberId, email, firstName, lastName } = useParams();

  return (
    <VeriffVerification
      subscriberId={subscriberId}
      email={email}
      firstName={firstName}
      lastName={lastName}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/verify/:subscriberId/:email/:firstName/:lastName" element={<VerifyPage />} />
      </Routes>
    </BrowserRouter>
  );
}
