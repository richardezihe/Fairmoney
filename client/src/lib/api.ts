import { DashboardStats, TelegramUser, WithdrawalRequest } from './types';
import { apiRequest } from './queryClient';

// API functions

// Dashboard
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/admin/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return response.json();
}

// Users
export async function fetchUsers(): Promise<TelegramUser[]> {
  const response = await fetch('/api/admin/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

// Withdrawals
export async function fetchWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  const response = await fetch('/api/admin/withdrawals');
  if (!response.ok) {
    throw new Error('Failed to fetch withdrawal requests');
  }
  return response.json();
}

export async function updateWithdrawalStatus(id: number, status: string): Promise<WithdrawalRequest> {
  const response = await apiRequest('POST', '/api/admin/withdrawals/update', { id, status });
  return response.json();
}

// System operations
export async function resetWithdrawalRequests(): Promise<{ message: string }> {
  const response = await apiRequest('POST', '/api/admin/reset-withdrawals', {});
  return response.json();
}

export async function resetAllData(): Promise<{ message: string }> {
  const response = await apiRequest('POST', '/api/admin/reset-all-data', {});
  return response.json();
}
