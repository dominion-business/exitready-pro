import axios from 'axios';
import { supabase } from '../lib/supabase';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to all requests
// Supports both Flask tokens (localStorage) and Supabase tokens
api.interceptors.request.use(
  async (config) => {
    // First, check for Supabase session token
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      // Use Supabase token if available
      config.headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      // Fall back to Flask token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear both auth systems
      localStorage.removeItem('token');

      // Sign out from Supabase if session exists
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }

      window.location.href = '/login';
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
    const response = await api.get('/assessment/current');
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

export const retakeAssessment = async () => {
  try {
    const response = await api.post('/assessment/retake');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error retaking assessment:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to retake assessment'
    };
  }
};

export const getAssessmentHistory = async () => {
  try {
    const response = await api.get('/assessment/history');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting assessment history:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get assessment history'
    };
  }
};

export const getSpecificAssessment = async (assessmentId) => {
  try {
    const response = await api.get(`/assessment/${assessmentId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting specific assessment:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get assessment'
    };
  }
};

export const downloadAssessmentPDF = async (assessmentId) => {
  try {
    const response = await api.get(`/assessment/${assessmentId}/pdf`, {
      responseType: 'blob'
    });

    // Create blob from response
    const blob = new Blob([response.data], { type: 'application/pdf' });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assessment_report_${assessmentId}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to download PDF'
    };
  }
};

export const getAssessmentSummary = async (assessmentId) => {
  try {
    const response = await api.get(`/assessment/${assessmentId}/summary`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting assessment summary:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get assessment summary'
    };
  }
};

// Wealth Gap API Functions
export const getWealthGap = async () => {
  try {
    const response = await api.get('/wealth-gap');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting wealth gap:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get wealth gap'
    };
  }
};

export const saveWealthGap = async (wealthGapData) => {
  try {
    const response = await api.post('/wealth-gap', wealthGapData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error saving wealth gap:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to save wealth gap'
    };
  }
};

export const calculateWealthGap = async (wealthGapData) => {
  try {
    const response = await api.post('/wealth-gap/calculate', wealthGapData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error calculating wealth gap:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to calculate wealth gap'
    };
  }
};

// Business Profile API Functions
export const getBusinessProfile = async () => {
  try {
    const response = await api.get('/business/profile');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting business profile:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get business profile'
    };
  }
};

// Exit Quiz API Functions
export const getExitQuizQuestions = async () => {
  try {
    const response = await api.get('/exit-quiz/questions');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting quiz questions:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get quiz questions'
    };
  }
};

export const submitExitQuiz = async (responses) => {
  try {
    const response = await api.post('/exit-quiz/submit', { responses });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to submit quiz'
    };
  }
};

export const getExitQuizResults = async () => {
  try {
    const response = await api.get('/exit-quiz/results');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting quiz results:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get quiz results'
    };
  }
};

export const getExitQuizHistory = async () => {
  try {
    const response = await api.get('/exit-quiz/history');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting quiz history:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get quiz history'
    };
  }
};

export default api;