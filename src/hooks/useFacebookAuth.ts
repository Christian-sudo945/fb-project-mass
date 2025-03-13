'use client'
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function useFacebookAuth() {
  const [status, setStatus] = useState<'connected' | 'not_authorized' | 'unknown'>('unknown');
  const { setToken, clearToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('fb_access_token');
      if (token) {
        setStatus('connected');
        setToken(token);
        if (window.location.pathname === '/') {
          router.push('/dashboard');
        }
      }
    };

    checkAuth();
  }, [router, setToken]);

  const login = () => {
    const appId = process.env.NEXT_PUBLIC_FB_APP_ID;
    const baseUrl = process.env.NEXT_PUBLIC_URL?.replace(/\/$/, '');
    
    if (!appId) {
      console.error('Facebook App ID is not configured');
      return;
    }

    // The redirect URI must match exactly what's configured in Facebook App settings
    const redirectUri = `${baseUrl}/dashboard`;
    const scope = 'pages_messaging,pages_manage_metadata,pages_show_list,pages_read_engagement,email';

    const facebookUrl = `https://www.facebook.com/v16.0/dialog/oauth` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&response_type=token` + // Changed to token for implicit flow
      `&auth_type=rerequest`;

    window.location.href = facebookUrl;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Clear all storage
      localStorage.removeItem('fb_access_token');
      Cookies.remove('fb_token');
      clearToken();
      
      // Redirect to home
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/');
    }
  };

  return { status, login, logout };
}

