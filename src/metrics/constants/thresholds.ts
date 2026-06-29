/**
 * Shared completion thresholds used across all metric services.
 * percentageWatched is stored as 0–100 (e.g. 75 means 75%).
 */
export const WATCH_COMPLETED_THRESHOLD = 80; // ≥ 80 % = completed
export const WATCH_PARTIAL_THRESHOLD = 30;   // 30–80 % = partial
// < 30 % = dropped off
