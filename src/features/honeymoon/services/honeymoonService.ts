import axiosInstance from '@/shared/config/axiosConfig';

const honeymoonService = {
  getDestinations: async (params: any = {}) => {
    const response = await axiosInstance.get('/honeymoon/destinations', { params });
    return response.data;
  },

  getDestination: async (destinationId: string) => {
    const response = await axiosInstance.get(`/honeymoon/destinations/${destinationId}`);
    return response.data;
  },
};

export default honeymoonService;
