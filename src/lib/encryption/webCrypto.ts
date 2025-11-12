/**
 * Web Crypto API utility
 * Provides a consistent way to access Web Crypto API in both browser and Node.js environments
 */

let webCryptoInstance: Crypto | null = null;

export function getWebCrypto(): Crypto {
  // Return cached instance if available
  if (webCryptoInstance) {
    return webCryptoInstance;
  }

  // Browser environment
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    webCryptoInstance = window.crypto;
    return webCryptoInstance;
  }

  // Node.js environment - try globalThis.crypto (Node.js 15+)
  if (typeof globalThis !== "undefined") {
    const globalCrypto = (globalThis as any).crypto;
    if (globalCrypto && globalCrypto.subtle) {
      webCryptoInstance = globalCrypto;
      return webCryptoInstance;
    }
  }

  // Node.js - try to import from crypto module
  try {
    // Use Function constructor to avoid bundler issues
    const requireFunc = new Function('return require')();
    const nodeCrypto = requireFunc('crypto');
    
    // Check for webcrypto property (Node.js 15-18)
    if (nodeCrypto?.webcrypto?.subtle) {
      webCryptoInstance = nodeCrypto.webcrypto;
      return webCryptoInstance;
    }
    
    // Check if crypto itself has subtle (Node.js 19+)
    if (nodeCrypto?.subtle) {
      webCryptoInstance = nodeCrypto as any;
      return webCryptoInstance;
    }
  } catch (e) {
    // Ignore require errors (might be in browser or ES module context)
  }

  // Last resort - try global crypto
  if (typeof crypto !== "undefined") {
    const globalCrypto = crypto as any;
    if (globalCrypto?.subtle) {
      webCryptoInstance = globalCrypto as Crypto;
      return webCryptoInstance;
    }
  }

  throw new Error(
    "Web Crypto API is not available. " +
    "Please ensure you're using Node.js 15+ (for server-side) or a modern browser (for client-side)."
  );
}

