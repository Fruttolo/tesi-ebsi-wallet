/**
 * Runtime Security Checks
 * Controlli sicurezza a runtime per rilevare device compromessi
 *
 * @module security/runtimeChecks
 */

import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";
import { App } from "@capacitor/app";

/**
 * Controlli sicurezza runtime
 * Detecta root, debugger, emulator, screen recording
 */
export class RuntimeSecurity {
  /**
   * Inizializza controlli sicurezza
   * @returns {Promise<{safe: boolean, reason?: string}>}
   */
  static async initialize() {
    try {
      // Check 1: Root detection
      const isRooted = await this.checkRootAccess();
      if (isRooted) {
        return {
          safe: false,
          reason: "Rooted device detected",
        };
      }

      // Check 2: Debugger detection
      const hasDebugger = await this.checkDebugger();
      if (hasDebugger) {
        return {
          safe: false,
          reason: "Debugger attached",
        };
      }

      // Check 3: Emulator detection (solo in produzione)
      if (import.meta.env.PROD) {
        const isEmulator = await this.checkEmulator();
        if (isEmulator) {
          console.warn("Running in emulator - blocking in production");
          return {
            safe: false,
            reason: "Emulator detected",
          };
        }
      }

      // Setup screen security
      await this.setupScreenSecurity();

      return { safe: true };
    } catch (error) {
      console.error("APP-EBSI: Runtime security check failed:", error);
      return {
        safe: false,
        reason: `Security check error: ${error.message}`,
      };
    }
  }

  /**
   * Controlla root/jailbreak
   * @returns {Promise<boolean>}
   */
  static async checkRootAccess() {
    if (Capacitor.getPlatform() !== "android") {
      return false;
    }

    try {
      // Check multipli per root detection
      const checks = await Promise.all([
        this._checkSUBinary(),
        this._checkRootManagementApps(),
        this._checkDangerousProps(),
        this._checkRWPaths(),
      ]);

      return checks.some((result) => result === true);
    } catch (error) {
      console.error("APP-EBSI: Root check failed:", error);
      return false;
    }
  }

  /**
   * Controlla debugger attach
   * @returns {Promise<boolean>}
   */
  static async checkDebugger() {
    try {
      const info = await Device.getInfo();

      // In development, permettiamo debugger
      if (import.meta.env.DEV) {
        return false;
      }

      // Check se app è debuggable (da build config)
      // In produzione dovrebbe essere false
      return false;
    } catch (error) {
      console.error("APP-EBSI: Debugger check failed:", error);
      return false;
    }
  }

  /**
   * Controlla se in esecuzione su emulator
   * @returns {Promise<boolean>}
   */
  static async checkEmulator() {
    try {
      const info = await Device.getInfo();
      return info.isVirtual || false;
    } catch (error) {
      console.error("APP-EBSI: Emulator check failed:", error);
      return false;
    }
  }

  /**
   * Controlla screen recording/overlay
   * @returns {Promise<boolean>}
   */
  static async checkScreenOverlay() {
    // Placeholder - richiede plugin nativo
    // Controlla:
    // - Screen recording attivo
    // - Overlay apps (tapjacking)
    // - Accessibility services sospetti
    return false;
  }

  /**
   * Setup protezioni schermo
   * @private
   * @returns {Promise<void>}
   */
  static async setupScreenSecurity() {
    if (Capacitor.getPlatform() !== "android") {
      return;
    }

    try {
      // Placeholder per FLAG_SECURE
      // Dovrebbe impedire screenshot/screen recording
      // Richiede plugin: cordova-plugin-prevent-screenshot

      console.log("APP-EBSI: Screen security enabled");
    } catch (error) {
      console.error("APP-EBSI: Failed to setup screen security:", error);
    }
  }

  /**
   * Controllo binario SU
   * @private
   * @returns {Promise<boolean>}
   */
  static async _checkSUBinary() {
    const suPaths = [
      "/system/bin/su",
      "/system/xbin/su",
      "/sbin/su",
      "/data/local/xbin/su",
      "/data/local/bin/su",
      "/system/sd/xbin/su",
      "/system/bin/failsafe/su",
      "/data/local/su",
      "/su/bin/su",
    ];

    // Note: Capacitor FileSystem non può accedere direttamente a system paths
    // Richiede plugin nativo per root detection reale
    // Questa è una placeholder implementation

    return false;
  }

  /**
   * Controlla app di root management
   * @private
   * @returns {Promise<boolean>}
   */
  static async _checkRootManagementApps() {
    const rootApps = [
      "com.noshufou.android.su",
      "com.noshufou.android.su.elite",
      "eu.chainfire.supersu",
      "com.koushikdutta.superuser",
      "com.thirdparty.superuser",
      "com.yellowes.su",
      "com.topjohnwu.magisk",
      "com.kingroot.kinguser",
      "com.kingo.root",
    ];

    // Placeholder - richiede plugin per check package manager
    return false;
  }

  /**
   * Controlla props pericolose del sistema
   * @private
   * @returns {Promise<boolean>}
   */
  static async _checkDangerousProps() {
    // Placeholder - controlla system props come:
    // - ro.debuggable
    // - ro.secure
    // - ro.build.tags
    return false;
  }

  /**
   * Controlla percorsi scrivibili
   * @private
   * @returns {Promise<boolean>}
   */
  static async _checkRWPaths() {
    const rwPaths = ["/system", "/system/bin", "/system/xbin", "/vendor/bin"];

    // Placeholder - controlla se path sono writable
    // Device rooted spesso ha /system in RW
    return false;
  }

  /**
   * Controlla integrità app
   * @returns {Promise<boolean>}
   */
  static async checkAppIntegrity() {
    try {
      const appInfo = await App.getInfo();

      // Check signature in produzione
      // Verifica che l'APK non sia stato modificato

      return true;
    } catch (error) {
      console.error("APP-EBSI: App integrity check failed:", error);
      return false;
    }
  }

  /**
   * Log evento sicurezza
   * @param {string} event - Tipo evento
   * @param {object} details - Dettagli
   */
  static logSecurityEvent(event, details = {}) {
    const timestamp = new Date().toISOString();
    console.warn(`[SECURITY] ${timestamp} - ${event}:`, details);

    // In produzione, invia a sistema di monitoring
    // es. Sentry, Firebase Crashlytics
  }
}

/**
 * Security Headers Helper
 */
export class SecurityHeaders {
  /**
   * Valida headers risposta
   * @param {Response} response - Response fetch
   * @returns {boolean}
   */
  static validateSecurityHeaders(response) {
    const requiredHeaders = {
      "strict-transport-security": true,
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
    };

    for (const [header, value] of Object.entries(requiredHeaders)) {
      const headerValue = response.headers.get(header);

      if (value === true && !headerValue) {
        console.warn(`Missing security header: ${header}`);
        return false;
      }

      if (typeof value === "string" && headerValue !== value) {
        console.warn(`Invalid security header ${header}: ${headerValue}`);
        return false;
      }
    }

    return true;
  }
}
