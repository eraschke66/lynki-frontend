-- documents had SELECT/INSERT/DELETE policies but no UPDATE policy, so any
-- client-side status/error_message write (e.g. the "mark as failed" fallback
-- in documentService.ts when triggerBackendProcessing exhausts its retries)
-- silently matched zero rows under RLS instead of erroring — leaving the
-- document stuck at its prior status with no visible failure.
CREATE POLICY "Users can update their own documents"
  ON public.documents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
