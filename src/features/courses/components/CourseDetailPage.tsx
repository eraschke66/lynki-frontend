Fix the email fallback UX in the shryn-email app.

Problem:
- “Open Mailto” opens Apple Mail with broken encoding:
  - spaces become +
  - line breaks are mangled
  - Apple Mail opens with the wrong From account
- The real Send Email path should be Resend.
- Mailto should be fallback only, not the main send path.
- The UI should stop pretending mailto is a polished send flow.

Do this exactly:

1. Keep the primary button as:
   - Send Email
   This should only call the app’s real send route (Resend-backed).

2. Rename the current “Open Mailto” button to:
   - Open in Mail (fallback)

3. Fix mailto encoding:
   - subject and body must use encodeURIComponent
   - spaces must become %20, not +
   - preserve paragraph breaks as %0A%0A
   - do not manually replace spaces with +
   - do not use URLSearchParams if it introduces + behavior

4. Do NOT try to force a From address inside mailto.
   - mailto should only include:
     - to
     - subject
     - body
   - never attempt to prefill From
   - the user’s mail client will choose the account

5. Add UI copy under the fallback button:
   - “This opens your default mail app and may use your default sending account.”

6. Keep these buttons:
   - Copy Subject
   - Copy Body
   - Copy Full Email
   They should remain unchanged and continue to work.

7. Improve fallback behavior:
   - Open in Mail (fallback) should be treated as a basic escape hatch only
   - do not auto-trigger it after Send Email fails

8. If there is a shared helper for mailto creation, centralize it and use it everywhere.

9. If possible, on Mac only:
   - prefer Apple Mail / AppleScript handoff path when available
   - otherwise fall back to standard mailto
   But do not break non-Mac behavior.

10. Update the queue/prospect detail UI text so it says:
   - Send through Resend here, or use the copy tools as fallbacks.

11. Run:
   - npm run build
   Confirm it passes.

12. Then commit with:
   - git add .
   - git commit -m "Fix email fallback and mailto encoding"
   - git push origin main

Files likely involved:
- lib/mailto.ts or equivalent helper
- components/prospect-actions.tsx
- components/queue-actions.tsx
- any send/fallback UI components

Important:
- Do not touch the working copy buttons except to keep them wired correctly.
- Do not remove the real Send Email button.
- Do not make mailto the main path.
