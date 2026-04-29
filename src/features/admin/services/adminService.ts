import axiosInstance from '@/shared/config/axiosConfig';

const adminService = {
  getOverview: async () => {
    const response = await axiosInstance.get('/admin/overview');
    return response.data;
  },
  
  getPendingVendors: async (page = 1, limit = 10) => {
    const response = await axiosInstance.get('/admin/vendors/pending', {
      params: { page, limit, status: 'pending' },
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

  getUsers: async (page = 1, limit = 10, role = 'user', search = '') => {
    const response = await axiosInstance.get('/admin/users', {
      params: { page, limit, role, search },
    });
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
};

export default adminService;
