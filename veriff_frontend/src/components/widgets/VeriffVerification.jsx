import { useEffect, useRef } from "react";
import { Veriff } from "@veriff/js-sdk";

export default function VeriffVerification({ subscriberId, email, firstName, lastName }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 🔑 Pack everything you want back into vendorData
    const vendorData = JSON.stringify({
      subscriberId,
      email,
      
    });

    const veriff = Veriff({
      apiKey: 'f680f797-4076-4e73-9ee4-d54d3a635ac1',
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

  return <div id="veriff-root" />;
}
