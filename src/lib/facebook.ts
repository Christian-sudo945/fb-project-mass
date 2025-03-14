export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  limit: number;
  tasks: string[];
  picture: {
    data: {
      url: string;
    };
  };
  fan_count: number;
}

const CACHE_KEYS = {
  CONVERSATIONS: (pageId: string) => `fb_conversations_${pageId}`,
  PAGES: 'fb_pages',
  USER: 'fb_user',
  CACHE_TIMESTAMP: (key: string) => `${key}_timestamp`,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

function getFromCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  const timestampKey = CACHE_KEYS.CACHE_TIMESTAMP(key);
  const timestamp = localStorage.getItem(timestampKey);
  const data = localStorage.getItem(key);
  
  if (!timestamp || !data) return null;
  
  if (Date.now() - Number(timestamp) > CACHE_DURATION) {
    localStorage.removeItem(key);
    localStorage.removeItem(timestampKey);
    return null;
  }
  
  return JSON.parse(data);
}

function setToCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(key, JSON.stringify(data));
  localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP(key), Date.now().toString());
}

export async function getPages(accessToken: string): Promise<FacebookPage[]> {
  const cacheKey = CACHE_KEYS.PAGES;
  const cachedPages = getFromCache<FacebookPage[]>(cacheKey);
  
  if (cachedPages) {
    return cachedPages;
  }

  try {
    const fields = 'name,access_token,tasks,picture,fan_count,limit';
    let allPages: FacebookPage[] = [];
    let url = `https://graph.facebook.com/v16.0/me/accounts?fields=${fields}&access_token=${accessToken}&limit=1000`;

    while (url) {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 0 }
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to fetch pages:', data);
        throw new Error(data.error?.message || 'Failed to fetch pages');
      }

      allPages = allPages.concat(data.data || []);
      url = data.paging?.next || null; // Get next page URL if it exists
    }

    setToCache(cacheKey, allPages);
    return allPages;
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

export interface MessageResponse {
  recipient_id: string;
  message_id: string;
  error?: {
    message: string;
    code: number;
  };
}

export async function sendBulkMessage(
  pageId: string,
  pageToken: string,
  recipients: string[],
  message: string,
  tag: 'CONFIRMED_EVENT_UPDATE' | 'POST_PURCHASE_UPDATE' | 'ACCOUNT_UPDATE',
  onProgress?: (sent: boolean, recipientId: string, error?: string) => void
): Promise<MessageResponse[]> {
  const responses: MessageResponse[] = [];
  
  for (const recipientId of recipients) {
    try {
      const response = await fetch(`https://graph.facebook.com/v16.0/${pageId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          messaging_type: 'MESSAGE_TAG',
          tag: tag,
          access_token: pageToken
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        onProgress?.(false, recipientId, data.error.message);
        console.error(`Error sending to ${recipientId}:`, data.error);
      } else {
        responses.push({
          recipient_id: recipientId,
          message_id: data.message_id
        });
        onProgress?.(true, recipientId);
      }

      // Add delay between messages to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onProgress?.(false, recipientId, errorMessage);
      console.error(`Error sending to ${recipientId}:`, errorMessage);
    }
  }

  return responses;
}

export async function fetchConversations(pageId: string, pageToken: string) {
  const cacheKey = CACHE_KEYS.CONVERSATIONS(pageId);
  const cachedConversations = getFromCache<Conversation[]>(cacheKey);
  
  if (cachedConversations) {
    return {
      data: cachedConversations,
      success: true,
      total: cachedConversations.length,
      fromCache: true
    };
  }

  try {
    let allConversations: Conversation[] = [];
    let nextUrl = `https://graph.facebook.com/v16.0/${pageId}/conversations`;
    
    while (nextUrl) {
      // Parse the URL and get/create search params
      const url = new URL(nextUrl);
      const searchParams = url.searchParams;

      // Only add these params if they don't exist (first request)
      if (!searchParams.has('access_token')) {
        searchParams.set('access_token', pageToken);
        searchParams.set('fields', 'id,unread_count,updated_time,participants,snippet,can_reply');
        searchParams.set('limit', '1000');
      }

      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      // Add conversations from current page
      allConversations = allConversations.concat(data.data || []);
      
      // Get the next page URL directly from the response
      nextUrl = data.paging?.next || null;

      // Add delay between requests to avoid rate limiting
      if (nextUrl) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const result = {
      data: allConversations,
      success: true,
      total: allConversations.length,
      fromCache: false
    };
    
    setToCache(cacheKey, allConversations);
    return result;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false,
      fromCache: false
    };
  }
}

export interface Conversation {
  id: string;
  participants: {
    data: Array<{
      name: string;
      id: string;
    }>;
  };
  updated_time: string;
  snippet: string;
  unread_count: number;
  can_reply: boolean;
  labels?: string[];
}

export interface FacebookUser {
  id: string;
  name: string;
  email: string;
  picture: {
    data: {
      url: string;
      width: number;
      height: number;
    }
  };
}

export function getTokenFromUrl(): string | null {
  if (typeof window !== 'undefined') {
    // Check multiple possible parameter names
    const params = new URLSearchParams(window.location.search);
    const possibleTokens = [
      params.get('access_token'),
      params.get('token'),
      params.get('Token'),
      params.get('code')
    ];
    
    const token = possibleTokens.find(t => t !== null);
    return token ? decodeURIComponent(token) : null;
  }
  return null;
}

export async function getCurrentUser(token: string): Promise<FacebookUser | null> {
  const cacheKey = CACHE_KEYS.USER;
  const cachedUser = getFromCache<FacebookUser>(cacheKey);
  
  if (cachedUser) {
    return cachedUser;
  }

  try {
    // Try both with and without v16.0
    const urls = [
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`,
      `https://graph.facebook.com/v16.0/me?fields=id,name,email,picture&access_token=${token}`
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (!data.error) {
            setToCache(cacheKey, data);
            return data;
          }
        }
      } catch (e) {
        console.warn('Failed attempt:', e);
      }
    }
    throw new Error('Failed to fetch user data after all attempts');
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}
