import api from '@/shared/config/axiosConfig';

export interface AppNotification {
  id: string;
  type: 'interest_received' | 'mutual_match' | 'message_received' | 'interest_accepted' | 'interest_declined' | 'wedding_invite' | 'wedding_accepted' | 'match_removed' | 'engagement_invite' | 'engagement_accepted' | 'engagement_cancelled';
  fromUserId: string;
  fromUserName: string;
  fromUserProfilePic: string | null;
  conversationId: string | null;
  metadata?: { inviterId?: string; proposerId?: string; acceptorId?: string } | null;
  read: boolean;
  createdAt: string;
  preview?: string;
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
