import { useEffect, useRef } from "react";
import { Veriff } from "@veriff/js-sdk";

export default function VeriffVerification({
  userId,
  firstName,
  lastName,
  email,
  onComplete,
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const veriff = Veriff({
      apiKey: "f680f797-4076-4e73-9ee4-d54d3a635ac1", // publishable key only
      parentId: "veriff-root",

      onSession: function (err, response) {
        if (err) {
          console.error("Veriff error:", err);
          return;
        }

        // 🔑 Start verification (redirect to hosted page)
        window.location.href = response.verification.url;

        // OR (if you want in-context iframe instead of redirect)
        // window.veriffSDK.createVeriffFrame({
        //   url: response.verification.url,
        //   onComplete,
        // });
      },
    });

    // Pass known data to Veriff
    veriff.setParams({
      vendorData: userId,
      person: {
        givenName: firstName,
        lastName: lastName,
        email: email,
      },
    });

    // Mount Veriff UI
    veriff.mount({
      formLabel: {
        givenName: "First name",
        lastName: "Family name",
        vendorData: "Unique id of an end-user",
      },
      submitBtnText: "START YOUR SESSION",
      loadingText: "Please wait...",
    });
  }, [userId, firstName, lastName, email, onComplete]);

  return <div id="veriff-root" />;
}
