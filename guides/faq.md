---
title: "FAQ"
description: "Frequently asked questions about the Skill Verification Platform."
---

<AccordionGroup>
  <Accordion title="Is the Test environment the same as a sandbox?">
    Yes. The Test environment is the sandbox. It is fully isolated, uses test API keys, intercepts emails, and provides separate vault links for both web and mobile. Switch to Production keys when you are ready to go live — no other changes are required.
  </Accordion>

  <Accordion title="Why is email required for vault access?">
    Verified skills are stored and retrieved by email address. The vault session is created against the user's email, and OTP verification ensures the correct person is accessing the record. Even if you pass a phone number to the popup, the user will always be prompted for email inside the vault.
  </Accordion>

  <Accordion title="Can I pre-supply email to skip the popup prompt?">
    Yes. Pass `email` in the `openVaultPopup` call. If the email is already on record, the popup proceeds directly to OTP verification without asking the user to type their address.
  </Accordion>

  <Accordion title="What happens if the same skill is submitted twice for the same source and endorsement type?">
    The API returns a `409 Conflict` with a message indicating the duplicate. The user must change the source, change the endorsement type, or choose a different skill. This is enforced at the API level, not just in the SDK popup.
  </Accordion>

  <Accordion title="Can I submit a bundle of skills in one endorsement request?">
    Yes. Pass an array in the `skills` field. The system will automatically remove any skill from the bundle that has already been verified for the same source and endorsement type, and return a `partial_bundle` warning in the response listing the removed skills.
  </Accordion>

  <Accordion title="How do I display verified skills in my frontend without using the popup?">
    Call `GET /vault/:userId` with your API key. The response includes all verified skills, sources, touchpoints, and proof status for that user. Use this to render badges or trust signals in your own UI.
  </Accordion>

  <Accordion title="Are webhook signatures required?">
    Validation is strongly recommended. All payloads include an `x-svp-signature` header. Reject any request where the HMAC-SHA256 digest does not match.
  </Accordion>

  <Accordion title="Do mobile apps use a different SDK?">
    Mobile apps use the same Test and Production vault links. A mobile-specific SDK is available for React Native and Flutter. All edge case validation and endorsement logic is handled server-side and is identical across web and mobile.
  </Accordion>
</AccordionGroup>