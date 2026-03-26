import { useCallback, useEffect, useState } from "react";

const STORAGE_KEYS = {
  WELCOME_SHOWN: "copaw_welcome_shown",
  WELCOME_VERSION: "copaw_welcome_version",
  LAST_SEEN: "copaw_welcome_last_seen",
} as const;

const CURRENT_VERSION = "1.0.0";

export function useWelcomePersistence() {
  const [hasSeen, setHasSeen] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem(STORAGE_KEYS.WELCOME_SHOWN);
    const version = localStorage.getItem(STORAGE_KEYS.WELCOME_VERSION);
    setHasSeen(!!shown && version === CURRENT_VERSION);
  }, []);

  const shouldShowWelcome = useCallback(() => {
    const shown = localStorage.getItem(STORAGE_KEYS.WELCOME_SHOWN);
    const version = localStorage.getItem(STORAGE_KEYS.WELCOME_VERSION);
    return !shown || version !== CURRENT_VERSION;
  }, []);

  const markAsShown = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.WELCOME_SHOWN, "true");
    localStorage.setItem(STORAGE_KEYS.WELCOME_VERSION, CURRENT_VERSION);
    localStorage.setItem(STORAGE_KEYS.LAST_SEEN, Date.now().toString());
    setHasSeen(true);
  }, []);

  const resetWelcome = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.WELCOME_SHOWN);
    localStorage.removeItem(STORAGE_KEYS.WELCOME_VERSION);
    localStorage.removeItem(STORAGE_KEYS.LAST_SEEN);
    setHasSeen(false);
  }, []);

  return {
    hasSeen,
    shouldShowWelcome,
    markAsShown,
    resetWelcome,
  };
}
