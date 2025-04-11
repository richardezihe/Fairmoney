import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDashboardStats, fetchUsers, fetchWithdrawalRequests } from "@/lib/api";
import { useLocation } from "wouter";
import { Users, Wallet, Banknote, UserPlus } from "lucide-react";
import { WithdrawalRequest, TelegramUser } from "@/lib/types";

export default function Dashboard() {
  const [, navigate] = useLocation();

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: fetchDashboardStats
  });

  // Fetch withdrawal requests (for recent withdrawals)
  const { data: withdrawalRequests, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['/api/admin/withdrawals'],
    queryFn: fetchWithdrawalRequests
  });

  // Fetch users (for recent users)
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: fetchUsers
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  // Get recent withdrawals (last 5)
  const recentWithdrawals = withdrawalRequests 
    ? withdrawalRequests.slice(0, 5)
    : [];

  // Get recent users (last 5)
  const recentUsers = users
    ? users.slice(0, 5)
    : [];

  // Withdrawal columns for the data table
  const withdrawalColumns = [
    { key: 'user', title: 'User', render: (withdrawal: WithdrawalRequest) => (
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
          <Users className="h-4 w-4" />
        </div>
        <span>{withdrawal.user?.firstName || 'Unknown'}</span>
      </div>
    )},
    { key: 'amount', title: 'Amount', render: (withdrawal: WithdrawalRequest) => (
      formatCurrency(withdrawal.amount)
    )},
    { key: 'status', title: 'Status', render: (withdrawal: WithdrawalRequest) => (
      <span 
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          withdrawal.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' :
          withdrawal.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        }`}
      >
        {withdrawal.status}
      </span>
    )},
    { key: 'createdAt', title: 'Date', render: (withdrawal: WithdrawalRequest) => (
      formatDate(withdrawal.createdAt)
    )}
  ];

  // User columns for the data table
  const userColumns = [
    { key: 'name', title: 'Name', render: (user: TelegramUser) => (
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
          <Users className="h-4 w-4" />
        </div>
        <span>{user.firstName + (user.lastName ? ' ' + user.lastName : '')}</span>
      </div>
    )},
    { key: 'username', title: 'Username', render: (user: TelegramUser) => (
      user.username || '-'
    )},
    { key: 'balance', title: 'Balance', render: (user: TelegramUser) => (
      formatCurrency(user.balance)
    )},
    { key: 'referralCount', title: 'Referrals', render: (user: TelegramUser) => (
      user.referralCount
    )}
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={isLoadingStats ? "Loading..." : stats?.totalUsers.toLocaleString() || "0"}
          icon={<Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          iconBgColor="bg-primary-100 dark:bg-primary-900"
          subTitle="Active users:"
          subValue={isLoadingStats ? "..." : stats?.actualUsers.toLocaleString() || "0"}
        />

        <StatCard
          title="Total Payouts"
          value={isLoadingStats ? "Loading..." : formatCurrency(stats?.totalPayouts || 0)}
          icon={<Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />}
          iconBgColor="bg-green-100 dark:bg-green-900"
          subTitle="Actual payouts:"
          subValue={isLoadingStats ? "..." : formatCurrency(stats?.actualPayouts || 0)}
        />

        <StatCard
          title="Pending Withdrawals"
          value={isLoadingStats ? "Loading..." : stats?.pendingWithdrawals || "0"}
          icon={<Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          iconBgColor="bg-amber-100 dark:bg-amber-900"
          link={{
            text: "View pending requests",
            onClick: () => navigate('/withdrawals')
          }}
        />

        <StatCard
          title="Recent Users"
          value={isLoadingStats ? "Loading..." : stats?.recentUsers || "0"}
          icon={<UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          iconBgColor="bg-blue-100 dark:bg-blue-900"
          link={{
            text: "View all users",
            onClick: () => navigate('/users')
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={recentWithdrawals}
              columns={withdrawalColumns}
              isLoading={isLoadingWithdrawals}
              emptyMessage="No withdrawal requests found"
            />
            <div className="mt-4 text-right">
              <button 
                onClick={() => navigate('/withdrawals')} 
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                View all withdrawals
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={recentUsers}
              columns={userColumns}
              isLoading={isLoadingUsers}
              emptyMessage="No users found"
            />
            <div className="mt-4 text-right">
              <button 
                onClick={() => navigate('/users')} 
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                View all users
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
