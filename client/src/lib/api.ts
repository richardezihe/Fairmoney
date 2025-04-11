import { DashboardStats, TelegramUser, WithdrawalRequest } from './types';
import { apiRequest } from './queryClient';

// API functions

// Dashboard
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await apiRequest('GET', '/api/admin/stats', {});
  return response.json();
}

// Users
export async function fetchUsers(): Promise<TelegramUser[]> {
  const response = await apiRequest('GET', '/api/admin/users', {});
  return response.json();
}

// Withdrawals
export async function fetchWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  const response = await apiRequest('GET', '/api/admin/withdrawals', {});
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
