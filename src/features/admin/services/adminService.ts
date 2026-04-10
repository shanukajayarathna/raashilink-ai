import axiosInstance from '@/shared/config/axiosConfig';

const adminService = {
  getOverview: async () => {
    const response = await axiosInstance.get('/admin/overview');
    return response.data;
  },
};

export default adminService;
