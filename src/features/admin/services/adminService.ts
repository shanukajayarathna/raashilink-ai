import axiosInstance from '@/shared/config/axiosConfig';

const adminService = {
  getOverview: async () => {
    const response = await axiosInstance.get('/admin/overview');
    return response.data;
  },
  
  getPendingVendors: async (page = 1, limit = 10, status = 'pending') => {
    const response = await axiosInstance.get('/admin/vendors/pending', {
      params: { page, limit, status },
    });
    return response.data;
  },

  getVendorDetail: async (id: string) => {
    const response = await axiosInstance.get(`/admin/vendors/${id}`);
    return response.data;
  },

  approveVendor: async (id: string, notes: string) => {
    const response = await axiosInstance.patch(`/admin/vendors/${id}/approve`, { notes });
    return response.data;
  },

  rejectVendor: async (id: string, reason: string) => {
    const response = await axiosInstance.patch(`/admin/vendors/${id}/reject`, { reason });
    return response.data;
  },

  updateVendorStatus: async (id: string, status: 'pending' | 'approved' | 'rejected', reason = '') => {
    const response = await axiosInstance.patch(`/admin/vendors/${id}/status`, { status, reason });
    return response.data;
  },

  getUsers: async (page = 1, limit = 10, role = 'all', status = 'all', search = '') => {
    const response = await axiosInstance.get('/admin/users', {
      params: { page, limit, role, status, search },
    });
    return response.data;
  },

  createAdminUser: async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    const response = await axiosInstance.post('/admin/users/admin', payload);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await axiosInstance.delete(`/admin/users/${id}`);
    return response.data;
  },

  getMatches: async (page = 1, limit = 10) => {
    const response = await axiosInstance.get('/admin/matches', {
      params: { page, limit },
    });
    return response.data;
  },

  getWeddingProjects: async (page = 1, limit = 10) => {
    const response = await axiosInstance.get('/admin/wedding-projects', {
      params: { page, limit },
    });
    return response.data;
  },

  getAnalytics: async () => {
    const response = await axiosInstance.get('/admin/analytics');
    return response.data;
  },

  getAdminProfile: async () => {
    const response = await axiosInstance.get('/users/profile', {
      params: { includeMedia: true },
    });
    return response.data;
  },

  updateAdminProfileName: async (name: string) => {
    const response = await axiosInstance.put('/users/profile', { name });
    return response.data;
  },

  updateAdminEmail: async (currentPassword: string, newEmail: string) => {
    const response = await axiosInstance.put('/users/contact/email', { currentPassword, newEmail });
    return response.data;
  },

  updateAdminPassword: async (currentPassword: string, newPassword: string) => {
    const response = await axiosInstance.put('/users/password', { currentPassword, newPassword });
    return response.data;
  },

  uploadAdminPhoto: async (photo: File) => {
    const formData = new FormData();
    formData.append('photo', photo);
    const response = await axiosInstance.post('/users/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  removeAdminPhoto: async () => {
    const response = await axiosInstance.delete('/users/profile/photo');
    return response.data;
  },
};

export default adminService;
