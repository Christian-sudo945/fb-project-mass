export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  tasks: string[];
  picture: {
    data: {
      url: string;
    };
  };
  fan_count: number;
}

export async function getPages(accessToken: string): Promise<FacebookPage[]> {
  try {
    const fields = 'name,access_token,tasks,picture,fan_count';
    const response = await fetch(
      `https://graph.facebook.com/v12.0/me/accounts?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`,
      { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.data || [];
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

export interface MessageResponse {
  recipient_id: string;
  message_id: string;
}

export async function sendBulkMessage(
  pageId: string,
  pageToken: string,
  recipients: string[],
  message: string,
  tag: 'CONFIRMED_EVENT_UPDATE' | 'POST_PURCHASE_UPDATE' | 'ACCOUNT_UPDATE' = 'CONFIRMED_EVENT_UPDATE'
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
        throw new Error(data.error.message);
      }
      responses.push(data);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  return responses;
}

export async function fetchConversations(pageId: string, pageToken: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v16.0/${pageId}/conversations?` +
      `access_token=${pageToken}&` +
      `fields=id,unread_count,updated_time,participants,snippet,can_reply&` +
      `limit=50`
    );
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.data || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
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
