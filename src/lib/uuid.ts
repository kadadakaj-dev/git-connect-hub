export const generateId = () => {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  // Fallback for non-secure contexts (http on IP)
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
