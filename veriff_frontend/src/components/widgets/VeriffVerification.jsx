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

    async function init() {
      const res = await fetch("/veriff/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          firstName,
          lastName,
          email,
        }),
      });

      const session = await res.json();

      const veriff = Veriff({
        apiKey: "API_KEY",
        parentId: "veriff-root",
        onSession: function (err, response) {
          // received the response, verification can be started now
        },
      });
      veriff.mount({
        formLabel: {
          givenName: "First name",
          lastName: "Family name",
          vendorData: "Unique id of an end-user",
        },
        submitBtnText: "START YOUR SESSION",
        loadingText: "Please wait...",
      });
    }

    init();
  }, [userId, firstName, lastName, email, onComplete]);

  return <div id="veriff-root" />;
}
