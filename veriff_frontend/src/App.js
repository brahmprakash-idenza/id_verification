import "./App.css";
import VeriffVerification from "./components/widgets/VeriffVerification";

function App() {
  return (
    <div className="App">
      <VeriffVerification
        userId={`user_${Date.now()}`}
        firstName="John"
        lastName="Doe"
        email="john@example.com"
        onComplete={() => alert("Verification submitted")}
      />
    </div>
  );
}

export default App;
