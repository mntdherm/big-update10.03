import { v4 as uuidv4 } from 'uuid';

/**
 * Generate an anonymous session ID for non-authenticated users
 */
export const generateSessionId = (): string => {
  return uuidv4();
};

/**
 * Get or create a session ID from localStorage
 */
export const getSessionId = (): string => {
  const storageKey = 'bilo_session_id';
  let sessionId = localStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
};

/**
 * Get device and browser information
 */
export const getDeviceInfo = (): {
  userAgent: string;
  screenSize: string;
  language: string;
  referrer: string;
  platform: string;
} => {
  return {
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
    referrer: document.referrer,
    platform: navigator.platform
  };
};
