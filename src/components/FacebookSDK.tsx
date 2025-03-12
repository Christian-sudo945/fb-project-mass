'use client'
import { useEffect } from 'react'

declare global {
  interface Window {
    FB: {
      init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
    };
    fbAsyncInit: () => void;
  }
}

export function FacebookSDK() {
  useEffect(() => {
    window.fbAsyncInit = function() {
      const appId = process.env.NEXT_PUBLIC_FB_APP_ID;
      if (!appId) {
        console.error('Facebook App ID is not configured');
        return;
      }

      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v16.0'
      });
    };

    const loadScript = () => {
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
    };

    loadScript();
  }, []);

  return null;
}
