import axiosInstance from '@/shared/config/axiosConfig';

/**
 * Chat Service for RaashiLink.AI
 * Handles user messaging, chat history, and real-time communication.
 */
const chatService = {
/**
 * Send a message to the RaashiBot assistant with Server-Sent Events (SSE) streaming.
 * @param {string} message - The user's message.
 * @param {string} language - Language code ('en', 'si', 'ta').
 * @param {Array} history - Conversation history as array of {role, content}.
 * @param {function} onChunk - Callback function called for each streamed text chunk.
 * @returns {Promise<string>} - The full assembled response.
 */
sendStreamingMessage: async (
  message: string,
  language: string = 'en',
  history: Array<{ role: string; content: string }> = [],
  onChunk: (text: string) => void
): Promise<string> => {
  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const endpoint = `${apiUrl}/api/v1/chat/stream`;
  const trimmedMessage = message.trim();
  let fullResponse = '';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: trimmedMessage,
        language,
        history,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Empty stream response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let sawDone = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines; keep remainder in buffer for the next read.
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            continue;
          }

          const data = line.slice(6);
          if (data === '[DONE]') {
            sawDone = true;
            break;
          }

          // Decode escaped newlines written by writeSseChunk on the backend.
          // The backend encodes \\ as \\\\ and \n as \\n so we reverse in order.
          const decoded = data.replace(/\\\\n/g, '\u0000').replace(/\\n/g, '\n').replace(/\u0000/g, '\\n');
          fullResponse += decoded;
          onChunk(decoded);
        }

        if (sawDone) {
          break;
        }
      }

      // Flush any final buffered line (in case server didn't end with newline).
      if (!sawDone && buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trimEnd();
        if (data && data !== '[DONE]') {
          const decoded = data.replace(/\\\\n/g, '\u0000').replace(/\\n/g, '\n').replace(/\u0000/g, '\\n');
          fullResponse += decoded;
          onChunk(decoded);
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  } catch (streamError) {
    // Fallback to non-stream endpoint when SSE/provider stream fails.
    if (fullResponse) {
      return fullResponse;
    }

    const fallback = await axiosInstance.post('/chat/assistant', {
      message: trimmedMessage,
      language,
      history,
    });

    const reply = fallback?.data?.data?.reply || fallback?.data?.reply || '';
    if (!reply) {
      throw streamError;
    }

    onChunk(reply);
    return reply;
  }
},

/**
 * Send a message to a specific recipient or chat room.
 * @param {object} messageData - Message content and recipient ID.
 * @returns {Promise<object>} - Sent message status.
 */
sendMessage: async (messageData: any) => {
  const response = await axiosInstance.post('/chat/messages', messageData);
  return response.data;
},

  /**
   * Send a message to the RaashiBot assistant.
   * @param {object} messageData - Message content and optional language.
   * @returns {Promise<object>} - Assistant reply.
   */
  sendAssistantMessage: async (messageData: any) => {
    const response = await axiosInstance.post('/chat/assistant', messageData);
    return response.data;
  },

  /**
   * Get the authenticated user's recent conversations for the sidebar history.
   */
  getConversations: async () => {
    const response = await axiosInstance.get('/chat/conversations');
    return response.data;
  },

  /**
   * Get chat history with a specific recipient or chat room.
   * @param {string} chatId - ID of the chat to retrieve history for.
   * @param {object} params - Query parameters for pagination and filtering.
   * @returns {Promise<object>} - List of chat messages.
   */
  getChatHistory: async (chatId: string, params: any = {}) => {
    const response = await axiosInstance.get(`/chat/${chatId}/history`, { params });
    return response.data;
  },

  /**
   * Clear chat history with a specific recipient or chat room.
   * @param {string} chatId - ID of the chat to clear history for.
   * @returns {Promise<object>} - Clear history status.
   */
  clearHistory: async (chatId: string) => {
    const response = await axiosInstance.delete(`/chat/${chatId}/history`);
    return response.data;
  },

  /**
   * Connect to a real-time chat stream using Server-Sent Events (SSE).
   * @param {string} chatId - ID of the chat to stream messages for.
   * @param {function} onMessage - Callback function for incoming messages.
   * @param {function} onError - Callback function for connection errors.
   * @returns {EventSource} - SSE connection instance.
   */
  connectToStream: (chatId: string, onMessage: (data: any) => void, onError: (error: any) => void) => {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/chat/${chatId}/stream?token=${token}`;
    
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        onError(err);
      }
    };
    
    eventSource.onerror = (error) => {
      onError(error);
      eventSource.close();
    };
    
    return eventSource;
  },
};

export default chatService;

