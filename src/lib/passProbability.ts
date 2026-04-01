/**
 * Client-side pass probability computation.
 * Port of aggregate_pass_probability() from lynki-backend/app/services/bkt/service.py
 *
 * Models each concept as a Bernoulli trial with probability p_i.
 * The fraction-correct score has:
 *   mu    = mean(p_i)
 *   sigma = sqrt( sum(p_i * (1 - p_i)) / N^2 )
 * P(score >= target) = 1 - Phi((target - mu) / sigma)
 */

/**
 * Error function approximation (Abramowitz & Stegun 7.1.26).
 * Max absolute error < 1.5e-7.
 */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const poly =
    t *
    (0.254829592 +
      t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-a * a));
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/**
 * Compute pass probability from an array of concept mastery values.
 *
 * @param masteryValues  p_mastery for each concept in scope (0..1).
 * @param target         Normalised target grade (0..1). Default 1.0.
 * @returns              Pass probability (0..1), or null if masteryValues is empty.
 */
export function computePassProbability(
  masteryValues: number[],
  target = 1.0,
): number | null {
  if (masteryValues.length === 0) return null;

  const n = masteryValues.length;
  const clamped = masteryValues.map((v) => Math.max(0, Math.min(1, v)));
  const mu = clamped.reduce((s, p) => s + p, 0) / n;
  const variance = clamped.reduce((s, p) => s + p * (1 - p), 0) / (n * n);
  const sigma = variance > 0 ? Math.sqrt(variance) : 0;
  const t = Math.max(0, Math.min(1, target));

  if (sigma === 0) return mu >= t ? 1.0 : 0.0;

  const z = (t - mu) / sigma;
  return Math.max(0, Math.min(1, 1 - normalCdf(z)));
}
