import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
);

// Clients API
export const clientsApi = {
  getAll: (params = {}) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getUsage: (id, params = {}) => api.get(`/clients/${id}/usage`, { params }),
  getHeatmap: (id, params = {}) => api.get(`/clients/${id}/heatmap`, { params })
};

// Analytics API
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getHealthTrends: (params = {}) => api.get('/analytics/health-trends', { params }),
  getIncidentStats: () => api.get('/analytics/incidents'),
  getUsageMetrics: (params = {}) => api.get('/analytics/usage', { params }),
  getRevenueAtRisk: () => api.get('/analytics/revenue-risk')
};

// Incidents API
export const incidentsApi = {
  getAll: (params = {}) => api.get('/incidents', { params }),
  getOne: (id) => api.get(`/incidents/${id}`),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.put(`/incidents/${id}`, data),
  delete: (id) => api.delete(`/incidents/${id}`),
  addCommunication: (id, data) => api.post(`/incidents/${id}/communications`, data)
};

// Simulation API
export const simulationApi = {
  usageSpike: (clientId, data = {}) => api.post(`/simulate/usage-spike/${clientId}`, data),
  outage: (clientId, data = {}) => api.post(`/simulate/outage/${clientId}`, data),
  resetHealth: (clientId) => api.post(`/simulate/reset-health/${clientId}`),
  pulse: () => api.post('/simulate/pulse')
};

export default api;
