'use client';

export type TextSize = 'SMALL' | 'NORMAL' | 'LARGE';

const STORAGE_KEY_TEXT_SIZE = 'studybuddy_text_size';
const STORAGE_KEY_REDUCED_MOTION = 'studybuddy_reduced_motion';

/**
 * Applies text size across the entire application by modifying
 * the HTML root dataset attribute and persisting to localStorage.
 */
export function applyTextSize(size: string): void {
  if (typeof window === 'undefined') return;

  const normalized = size.toUpperCase() as TextSize;
  const attrValue = ['SMALL', 'NORMAL', 'LARGE'].includes(normalized)
    ? normalized.toLowerCase()
    : 'normal';

  document.documentElement.setAttribute('data-text-size', attrValue);

  try {
    localStorage.setItem(STORAGE_KEY_TEXT_SIZE, normalized);
  } catch (e) {
    console.warn('Unable to access localStorage for text size:', e);
  }

  // Broadcast event so active views/modals can update reactive states
  window.dispatchEvent(
    new CustomEvent('studybuddy:textsize', { detail: { size: normalized } })
  );
}

/**
 * Applies reduced motion preference to HTML dataset and persists to localStorage.
 */
export function applyReducedMotion(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  document.documentElement.setAttribute('data-reduced-motion', String(enabled));

  try {
    localStorage.setItem(STORAGE_KEY_REDUCED_MOTION, String(enabled));
  } catch (e) {
    console.warn('Unable to access localStorage for reduced motion:', e);
  }

  window.dispatchEvent(
    new CustomEvent('studybuddy:motion', { detail: { reducedMotion: enabled } })
  );
}

/**
 * Initializes accessibility settings from localStorage on client load.
 */
export function initAccessibility(fallbackTextSize: string = 'NORMAL', fallbackReducedMotion: boolean = false): void {
  if (typeof window === 'undefined') return;

  try {
    const storedSize = localStorage.getItem(STORAGE_KEY_TEXT_SIZE) || fallbackTextSize;
    applyTextSize(storedSize);

    const storedMotion = localStorage.getItem(STORAGE_KEY_REDUCED_MOTION);
    const motionEnabled = storedMotion !== null ? storedMotion === 'true' : fallbackReducedMotion;
    applyReducedMotion(motionEnabled);
  } catch {
    applyTextSize(fallbackTextSize);
    applyReducedMotion(fallbackReducedMotion);
  }
}
