import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { fetchUsers } from "@/lib/api";
import { User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TelegramUser } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";

export default function Users() {
  // Fetch users
  const { data: users, isLoading, isFetching } = useQuery({
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

  // Refresh users
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
  };

  // Search function for users
  const searchUsers = (user: TelegramUser, query: string) => {
    const searchText = query.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchText) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchText)) ||
      (user.username && user.username.toLowerCase().includes(searchText)) ||
      user.telegramId.includes(searchText)
    );
  };

  // User table columns
  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name', render: (user: TelegramUser) => (
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
          <User className="h-4 w-4" />
        </div>
        <div>
          <div>{user.firstName} {user.lastName || ''}</div>
          {user.username && <div className="text-xs text-gray-500">@{user.username}</div>}
        </div>
      </div>
    )},
    { key: 'telegramId', title: 'Telegram ID' },
    { key: 'balance', title: 'Balance', render: (user: TelegramUser) => (
      formatCurrency(user.balance)
    )},
    { key: 'referralCount', title: 'Referrals' },
    { key: 'bankDetails', title: 'Bank Details', render: (user: TelegramUser) => (
      <div>
        {user.bankName && user.bankAccountNumber ? (
          <>
            <div>{user.bankName}</div>
            <div className="text-xs text-gray-500">{user.bankAccountNumber}</div>
            {user.bankAccountName && <div className="text-xs text-gray-500">{user.bankAccountName}</div>}
          </>
        ) : (
          <span className="text-gray-500">Not provided</span>
        )}
      </div>
    )}
  ];

  return (
    <DashboardLayout title="Users">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total users: {users?.length || 0}
          </p>
        </div>
        
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <DataTable
        data={users || []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No users found"
        searchFunction={searchUsers}
      />
    </DashboardLayout>
  );
}
