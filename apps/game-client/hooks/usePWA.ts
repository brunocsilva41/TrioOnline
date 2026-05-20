"use client";

import { useEffect, useState } from 'react';

/**
 * TRIO ONLINE - usePWA Hook
 * Handles Service Worker registration and Installation Prompt for AAA experience.
 */
export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = () => {
        navigator.serviceWorker
          .register('/service-worker.js') // Assuming it's served from root after build
          .then((registration) => {
            console.log('[PWA] ServiceWorker registered:', registration.scope);
          })
          .catch((error) => {
            console.error('[PWA] ServiceWorker registration failed:', error);
          });
      };

      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker, { once: true });
      }
    }

    // Capture Installation Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`[PWA] User response to the install prompt: ${outcome}`);
    setInstallPrompt(null);
  };

  return { installPrompt, triggerInstall };
}
