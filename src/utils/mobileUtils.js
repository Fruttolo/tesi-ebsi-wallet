/**
 * Utility per gestione funzionalità mobile
 */

/**
 * Previene il comportamento di pull-to-refresh su mobile
 */
export const preventPullToRefresh = () => {
  document.body.style.overscrollBehavior = "contain";
};

/**
 * Verifica se l'app è in esecuzione su dispositivo mobile
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Verifica se l'app è in esecuzione come PWA
 */
export const isPWA = () => {
  return (
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
  );
};

/**
 * Ottiene le safe area insets del dispositivo
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue("--safe-area-inset-top")) || 0,
    right: parseInt(style.getPropertyValue("--safe-area-inset-right")) || 0,
    bottom: parseInt(style.getPropertyValue("--safe-area-inset-bottom")) || 0,
    left: parseInt(style.getPropertyValue("--safe-area-inset-left")) || 0,
  };
};

/**
 * Fornisce feedback tattile (vibrazione)
 * @param {string} type - 'light', 'medium', 'heavy'
 */
export const hapticFeedback = (type = "medium") => {
  if (!navigator.vibrate) return;

  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
  };

  navigator.vibrate(patterns[type] || patterns.medium);
};

/**
 * Blocca lo scroll del body (utile per modali)
 */
export const lockBodyScroll = () => {
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
};

/**
 * Sblocca lo scroll del body
 */
export const unlockBodyScroll = () => {
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
};

/**
 * Copia testo negli appunti con feedback
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    hapticFeedback("light");
    return true;
  } catch (err) {
    // Fallback per browser che non supportano clipboard API
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    if (success) hapticFeedback("light");
    return success;
  }
};

/**
 * Formatta DID per display mobile (più corto)
 */
export const formatDIDForMobile = (did, prefixLength = 12, suffixLength = 8) => {
  if (!did) return "";
  if (did.length <= prefixLength + suffixLength + 3) return did;
  return `${did.slice(0, prefixLength)}...${did.slice(-suffixLength)}`;
};

/**
 * Ottimizza immagini per display mobile
 */
export const optimizeImageForMobile = (url, width = 800) => {
  // Placeholder - da implementare con servizio di ottimizzazione immagini
  return url;
};
