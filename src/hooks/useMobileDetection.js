import { useState, useEffect } from "react";

/**
 * Hook per rilevare viewport e device type
 */
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [orientation, setOrientation] = useState("portrait");

  useEffect(() => {
    const checkDevice = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const smallScreen = window.innerWidth < 768;
      const orient = window.innerHeight > window.innerWidth ? "portrait" : "landscape";

      setIsMobile(mobile);
      setIsSmallScreen(smallScreen);
      setOrientation(orient);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    window.addEventListener("orientationchange", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("orientationchange", checkDevice);
    };
  }, []);

  return { isMobile, isSmallScreen, orientation };
};

/**
 * Hook per gestire safe area insets
 */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(style.getPropertyValue("--safe-area-inset-top")) || 0,
        right: parseInt(style.getPropertyValue("--safe-area-inset-right")) || 0,
        bottom: parseInt(style.getPropertyValue("--safe-area-inset-bottom")) || 0,
        left: parseInt(style.getPropertyValue("--safe-area-inset-left")) || 0,
      });
    };

    updateSafeArea();
    window.addEventListener("resize", updateSafeArea);

    return () => window.removeEventListener("resize", updateSafeArea);
  }, []);

  return safeArea;
};

/**
 * Hook per gestire lo stato online/offline
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
};
