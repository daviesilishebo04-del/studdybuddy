/**
 * Hybrid Difficulty Prioritization Engine
 * 
 * 1. Bootstrap:
 *    - On onboarding, self-reported "hard" subjects start at priority = 1.0
 *    - Other subjects start at priority = 0.3
 * 
 * 2. Real Performance Refinement (Exponential Moving Average of error):
 *    - For attempt accuracy A in [0, 1] (where 100% = 1.0, 60% = 0.6):
 *      Error signal = (1 - A)
 *    - We keep up to the last 5 attempts: window size N = 5
 *    - Alpha smoothing factor = 2 / (N + 1) = 2 / (5 + 1) = 1/3 ≈ 0.3333
 *    - P_t = alpha * (1 - A_t) + (1 - alpha) * P_{t-1}
 *    - Clamp priority between [0.05, 1.00]
 */

export const INITIAL_PRIORITY_HARD = 1.0;
export const INITIAL_PRIORITY_NORMAL = 0.3;
export const MAX_ATTEMPTS_WINDOW = 5;
export const EMA_ALPHA = 2 / (MAX_ATTEMPTS_WINDOW + 1); // 1/3 ≈ 0.3333

export function calculateUpdatedPriority(
  previousPriority: number,
  accuracy: number // value between 0 and 1
): { newPriority: number; errorSignal: number } {
  // Clamp accuracy
  const clampedAccuracy = Math.min(Math.max(0, accuracy), 1);
  const errorSignal = 1 - clampedAccuracy; // lower accuracy raises priority

  const rawNewPriority = EMA_ALPHA * errorSignal + (1 - EMA_ALPHA) * previousPriority;
  const newPriority = Math.round(Math.min(Math.max(0.05, rawNewPriority), 1.0) * 1000) / 1000;

  return {
    newPriority,
    errorSignal,
  };
}

/**
 * Worked Example Demonstrating the Math Over a Real 5-Attempt Sequence:
 * 
 * Subject: Mathematics (Bootstrapped as HARD -> P0 = 1.000)
 * 
 * Attempt 1: Accuracy 60% (A1 = 0.6)
 *   Error = 1 - 0.6 = 0.4
 *   P1 = (1/3)*0.4 + (2/3)*1.000 = 0.1333 + 0.6667 = 0.800
 * 
 * Attempt 2: Accuracy 80% (A2 = 0.8)
 *   Error = 1 - 0.8 = 0.2
 *   P2 = (1/3)*0.2 + (2/3)*0.800 = 0.0667 + 0.5333 = 0.600
 * 
 * Attempt 3: Accuracy 100% (A3 = 1.0)
 *   Error = 1 - 1.0 = 0.0
 *   P3 = (1/3)*0.0 + (2/3)*0.600 = 0.0000 + 0.4000 = 0.400  <-- Priority steadily decreases as mastery improves!
 * 
 * Attempt 4: Accuracy 40% (A4 = 0.4) [Struggled with multi-step equations]
 *   Error = 1 - 0.4 = 0.6
 *   P4 = (1/3)*0.6 + (2/3)*0.400 = 0.2000 + 0.2667 = 0.467  <-- Priority immediately rises to resurface topic!
 * 
 * Attempt 5: Accuracy 90% (A5 = 0.9)
 *   Error = 1 - 0.9 = 0.1
 *   P5 = (1/3)*0.1 + (2/3)*0.467 = 0.0333 + 0.3113 = 0.345
 */
export function runPrioritizationWorkedExample(): Array<{
  attemptIndex: number;
  accuracy: number;
  errorSignal: number;
  previousPriority: number;
  newPriority: number;
}> {
  const attempts = [0.6, 0.8, 1.0, 0.4, 0.9];
  let currentPriority = INITIAL_PRIORITY_HARD; // 1.0
  const history = [];

  for (let i = 0; i < attempts.length; i++) {
    const accuracy = attempts[i];
    const prev = currentPriority;
    const { newPriority, errorSignal } = calculateUpdatedPriority(prev, accuracy);
    history.push({
      attemptIndex: i + 1,
      accuracy,
      errorSignal,
      previousPriority: prev,
      newPriority,
    });
    currentPriority = newPriority;
  }

  return history;
}
