// Types for the client-side app

export interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface TelegramUser {
  id: number;
  telegramId: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  balance: number;
  referrerId: string | null;
  referralCount: number;
  hasJoinedGroups: boolean;
  lastBonusClaim: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: number;
  telegramUserId: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string | null;
    username: string | null;
  };
}

export interface DashboardStats {
  totalUsers: number;
  actualUsers: number;
  totalPayouts: number;
  actualPayouts: number;
  pendingWithdrawals: number;
  recentUsers: number;
}
