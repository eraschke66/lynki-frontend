# Classroom self-serve — static HTML frontend

Plain, dependency-light HTML (no framework, no build step). Each file talks
directly to the deployed edge functions on the Shryn project
(`cmoamdistlpbahcryjda`). Drop them on the shryn.ai web host (or any static host).

## Files
- **`portal.html`** — the professor self-serve flow (the piece the spec called
  "Lovable", built here as full HTML):
  1. Sign in (Supabase email+password or magic link). The logged-in user's JWT is
     sent to the edge functions, which now require the subject owner (or service role).
  2. New-lecture form: subject picker, optional course, title→slug autofill, video
     file, public/private (private reveals a password field).
  3. POSTs multipart to `lecture-create`, then polls `lecture-status` every 3s and
     drives a progress bar (`transcribing → generating_prompt → seeding → ready`),
     showing `error_message` on failure.
  4. Preview: plays the video with a captions track (`crossorigin="anonymous"`),
     a Q&A check box (`classroom-ask`), an editable teaching-prompt box (saves via
     `classroom-write` `update_lecture`), and the seed "Class questions" feed.
  5. Publish (`classroom-write` `update_lecture` → `is_public:true`) + Share link.

- **`lecture.html`** — public lecture viewer (`?subject=…&slug=…` or
  `/classroom/{subject}/{slug}`): reads the published row via the anon REST API,
  plays video + captions, Q&A panel (`classroom-ask`), and the class-questions feed
  (`classroom-feed`). Public lectures only; per-lecture private-password gating needs
  a server-side verifier that doesn't exist yet (see note below).

## Config
Both files embed the public project URL + anon key (safe to expose). Change
`PUBLIC_BASE` in `portal.html` if the share-link base isn't `https://shryn.ai/classroom`.

## Notes
- These call the **hardened** functions: `lecture-create` / `lecture-status` /
  `classroom-write` require the owner's login, so `portal.html` must be used signed in.
- Private lectures: `lecture.html` shows a password gate that calls
  `lecture-verify-password` (server-side hash check; the password is never sent to or
  stored on the client). Note the video file is in a public bucket, so the gate
  controls page access, not the raw storage URL — fully private video would need a
  private bucket + signed URLs (larger change).
