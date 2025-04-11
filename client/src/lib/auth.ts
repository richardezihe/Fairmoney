import { create } from 'zustand';
import { User, AuthState } from './types';
import { apiRequest } from './queryClient';

// Default state
const defaultState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

// Get stored auth data from localStorage
const getStoredAuth = (): Partial<AuthState> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('authUser');
    
    if (!token || !userStr) return {};
    
    const user = JSON.parse(userStr) as User;
    return { token, user, isAuthenticated: true };
  } catch (error) {
    console.error('Error getting stored auth:', error);
    return {};
  }
};

// Create auth store with Zustand
export const useAuth = create<
  AuthState & {
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<boolean>;
  }
>((set, get) => ({
  ...defaultState,
  ...getStoredAuth(),
  
  login: async (username: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Save auth data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      // Call logout API if authenticated
      if (get().isAuthenticated) {
        await apiRequest('POST', '/api/auth/logout', {});
      }
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      
      // Reset state
      set({
        ...defaultState,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Clear auth data even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      
      set({
        ...defaultState,
        isLoading: false,
      });
    }
  },
  
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      
      const token = get().token;
      
      if (!token) {
        set({ isLoading: false });
        return false;
      }
      
      const response = await apiRequest('GET', '/api/auth/me', {});
      
      if (!response.ok) {
        throw new Error('Authentication check failed');
      }
      
      const user = await response.json();
      
      // Update user data
      localStorage.setItem('authUser', JSON.stringify(user));
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      
      // Clear invalid auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      
      set({
        ...defaultState,
        isLoading: false,
      });
      
      return false;
    }
  },
}));
