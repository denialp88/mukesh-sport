import axios from 'axios';
import { Platform } from 'react-native';
import { getItem } from './storage';

// Production server
const API_URL = 'https://mukeshsports.in/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (phone, password) => api.post('/auth/login', { phone, password });
export const updateProfile = (data) => api.put('/auth/profile', data);

// Customers
export const getCustomers = (search) => api.get('/customers', { params: { search } });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);

// Installments / Credit Tracker
export const getInstallmentPlans = (params) => api.get('/installments/plans', { params });
export const getInstallmentPlan = (id) => api.get(`/installments/plans/${id}`);
export const createInstallmentPlan = (data) => api.post('/installments/plans', data);
export const addPayment = (planId, data) => api.post(`/installments/plans/${planId}/add-payment`, data);
export const payInstallment = (id, data) => api.put(`/installments/${id}/pay`, data);
export const getInstallmentDashboard = () => api.get('/installments/dashboard/summary');

// Repairs
export const getRepairJobs = (params) => api.get('/repairs', { params });
export const getRepairJob = (id) => api.get(`/repairs/${id}`);
export const createRepairJob = (data) => api.post('/repairs', data);
export const updateRepairStatus = (id, data) => api.put(`/repairs/${id}/status`, data);
export const updateRepairCost = (id, data) => api.put(`/repairs/${id}/cost`, data);
export const getRepairDashboard = () => api.get('/repairs/dashboard/summary');

export default api;
