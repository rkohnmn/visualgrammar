/**
 * VisualGrammar — Local-First Browser Storage & Privacy Manager (storage.js)
 * Conforms strictly to APPLICATION_GUIDELINES.md Section B.3 and Part 17.3.
 * All localStorage operations are wrapped in try/catch blocks and respect user consent.
 */

const STORAGE_KEY_PREFS = 'datasense_visualgrammar_prefs_v1';
const STORAGE_KEY_WORK = 'datasense_visualgrammar_recent_v1';
const STORAGE_KEY_LITERACY = 'datasense_visualgrammar_literacy_v1';

export function loadPreferences() {
  try {
    if (typeof localStorage === 'undefined') return { theme: 'light', explanationLevel: 'standard', allowLocalSave: true };
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (!raw) return { theme: 'light', explanationLevel: 'standard', allowLocalSave: true };
    return { theme: 'light', explanationLevel: 'standard', allowLocalSave: true, ...JSON.parse(raw) };
  } catch {
    return { theme: 'light', explanationLevel: 'standard', allowLocalSave: true };
  }
}

export function savePreferences(prefs) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

export function saveRecentWorkspace(snapshot, allowLocalSave = true) {
  if (!allowLocalSave) return false;
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(STORAGE_KEY_WORK, JSON.stringify({
      savedAt: new Date().toISOString(),
      ...snapshot
    }));
    return true;
  } catch {
    return false;
  }
}

export function loadRecentWorkspace() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY_WORK);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLiteracyProgress(progressObj) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(STORAGE_KEY_LITERACY, JSON.stringify(progressObj));
    return true;
  } catch {
    return false;
  }
}

export function loadLiteracyProgress() {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY_LITERACY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function clearAllLocalData() {
  try {
    if (typeof localStorage === 'undefined') return true;
    localStorage.removeItem(STORAGE_KEY_PREFS);
    localStorage.removeItem(STORAGE_KEY_WORK);
    localStorage.removeItem(STORAGE_KEY_LITERACY);
    return true;
  } catch {
    return false;
  }
}
