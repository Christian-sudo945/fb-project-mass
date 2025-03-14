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
      // Check hash for access token
      const hash = window.location.hash;
      let token = null;

      if (hash) {
        const match = hash.match(/access_token=([^&]+)/);
        if (match) {
          
          token = decodeURIComponent(match[1]);
          localStorage.setItem('fb_access_token', token);
          Cookies.set('fb_access_token', token, { 
            path: '/',
            sameSite: 'lax',
            secure: true
          });
          setToken(token);
          setStatus('connected');
          window.history.replaceState({}, document.title, '/dashboard');
          router.replace('/dashboard');
          return;
        }
      }

      // Check search params
      const urlParams = new URLSearchParams(window.location.search);
      const queryToken = urlParams.get('Token');
      if (queryToken) {
        token = decodeURIComponent(queryToken);
        localStorage.setItem('fb_access_token', token);
        Cookies.set('fb_access_token', token, { 
          path: '/',
          sameSite: 'lax',
          secure: true
        });
        setToken(token);
        setStatus('connected');
        window.history.replaceState({}, document.title, '/dashboard');
        return;
      }

      const storedToken = localStorage.getItem('fb_access_token');
      if (storedToken) {
        setToken(storedToken);
        setStatus('connected');
        if (window.location.pathname === '/') {
          router.replace('/dashboard');
        }
      } else if (window.location.pathname === '/dashboard') {
        router.replace('/');
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

    const redirectUri = `${baseUrl}`;
    const scope = 'pages_messaging,pages_manage_metadata,pages_show_list,pages_read_engagement,email';

    const facebookUrl = `https://www.facebook.com/v16.0/dialog/oauth` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&response_type=token` +
      `&auth_type=rerequest`;

    window.location.href = facebookUrl;
  };

  const logout = async () => {
    try {
      // Clear all token storage
      localStorage.removeItem('fb_access_token');
      Cookies.remove('fb_access_token', { path: '/' });
      Cookies.remove('fb_token', { path: '/' });
      clearToken();
      setStatus('unknown');
      
      // Force reload to clear any cached states
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/');
    }
  };

  return { status, login, logout };
}

