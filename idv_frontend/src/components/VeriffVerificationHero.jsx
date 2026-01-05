import { useEffect, useRef } from "react";
import { Veriff } from "@veriff/js-sdk";
import Logo from "../assets/logo.svg";

export default function VeriffVerification({
  subscriberId,
  email,
  firstName,
  lastName,
  trackingId
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 🔑 Pack everything you want back into vendorData
    const vendorData = JSON.stringify({
      subscriberId,
      email,
      trackingId
    });

    const veriff = Veriff({
      apiKey: "f680f797-4076-4e73-9ee4-d54d3a635ac1",
      parentId: "veriff-root",

      onSession: (err, response) => {
        if (err) {
          console.error("Veriff error:", err);
          return;
        }
        window.location.href = response.verification.url;
      },
    });

    // 🔴 ONLY vendorData is round-tripped
    veriff.setParams({
      vendorData: vendorData,
      person: {
        givenName: firstName,
        lastName: lastName,
      },
    });

    // Names editable
    veriff.mount({
      submitBtnText: "🔒 Get verified",
      loadingText: "Please wait...",
    });
  }, [subscriberId, email, firstName, lastName]);

   return (
    <section className="min-h-screen bg-gr flex items-center justify-center">
      <div className="h-full max-w-6xl px-6 bg-slate-100" >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center ">

          {/* Left content */}
          <div className="bg-white p-8 mt-10 mb-10 rounded-2xl">
            {/* Logo */}
            <img
              src={Logo}
              alt="Company logo"
              className="h-20 mb-10"
            />

            <h1 className="text-4xl font-semibold text-gray-900 leading-tight">
              Identity verification
            </h1>

            <p className="mt-4 text-lg text-gray-600 max-w-md">
              Secure identity checks to protect your account and meet compliance
              requirements.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-gray-500">
              <li>• Takes less than 2 minutes</li>
              <li>• Keep your govt ID with you</li>
              <li>• Please check if your camera is working</li>
            </ul>
          </div>

          {/* Right card */}
          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-2xl bg-white p-8">
              <div id="veriff-root" style={{scale: "1.1"}}/>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
