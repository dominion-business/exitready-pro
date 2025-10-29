import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Assessment API Functions

export const startAssessment = async () => {
  try {
    const response = await api.post('/assessment/start');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error starting assessment:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to start assessment'
    };
  }
};

export const getAssessment = async () => {
  try {
    const response = await api.get('/assessment');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting assessment:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get assessment'
    };
  }
};

export const saveAssessmentResponse = async (responseData) => {
  try {
    const response = await api.post('/assessment/response', responseData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error saving response:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to save response'
    };
  }
};

export const getAssessmentTasks = async () => {
  try {
    const response = await api.get('/assessment/tasks');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting tasks:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get tasks'
    };
  }
};

export const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await api.put(`/assessment/task/${taskId}/status`, { status });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating task:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update task'
    };
  }
};

export default api;