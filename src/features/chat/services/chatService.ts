import axiosInstance from '@/shared/config/axiosConfig';

/**
 * Chat Service for RaashiLink.AI
 * Handles user messaging, chat history, and real-time communication.
 */
const chatService = {
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


