import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Auth API calls
export const authAPI = {
  register: async (userData: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/api/register', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/api/login', credentials);
    return response.data;
  },

  googleAuth: async (token: string): Promise<AuthResponse> => {
    const response = await api.post('/api/google-auth', { token });
    return response.data;
  },

  getUser: async (): Promise<User> => {
    const response = await api.get('/api/user');
    return response.data;
  },
};

// Todo API calls
export const todoAPI = {
  getTodos: async (): Promise<Todo[]> => {
    const response = await api.get('/api/todos');
    return response.data;
  },

  createTodo: async (todoData: { title: string; description?: string }): Promise<Todo> => {
    const response = await api.post('/api/todos', todoData);
    return response.data;
  },

  updateTodo: async (id: number, todoData: Partial<Todo>): Promise<Todo> => {
    const response = await api.put(`/api/todos/${id}`, todoData);
    return response.data;
  },

  deleteTodo: async (id: number): Promise<void> => {
    await api.delete(`/api/todos/${id}`);
  },
};

export default api;