import api from '@/shared/config/axiosConfig';

export interface AppNotification {
  id: string;
  type: 'interest_received' | 'mutual_match' | 'message_received';
  fromUserId: string;
  fromUserName: string;
  fromUserProfilePic: string | null;
  conversationId: string | null;
  read: boolean;
  createdAt: string;
  preview?: string; // for message_received
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

const notificationService = {
  async getAll(): Promise<NotificationsResponse> {
    const res = await api.get('/notifications');
    return res.data.data;
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};

export default notificationService;
