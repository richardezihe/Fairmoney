import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { fetchWithdrawalRequests, updateWithdrawalStatus, resetWithdrawalRequests } from "@/lib/api";
import { User, Check, X, RefreshCw, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { WithdrawalRequest } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

export default function Withdrawals() {
  const { toast } = useToast();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  // Fetch withdrawal requests
  const { data: withdrawalRequests, isLoading, isFetching } = useQuery({
    queryKey: ['/api/admin/withdrawals'],
    queryFn: fetchWithdrawalRequests
  });

  // Update withdrawal status mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      updateWithdrawalStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Status updated",
        description: "Withdrawal request status has been updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update withdrawal status",
        variant: "destructive"
      });
    }
  });

  // Reset withdrawals mutation
  const resetMutation = useMutation({
    mutationFn: resetWithdrawalRequests,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Withdrawals reset",
        description: "All withdrawal requests have been reset successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Failed to reset withdrawal requests",
        variant: "destructive"
      });
    }
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

  // Refresh withdrawals
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
  };

  // Approve withdrawal
  const handleApprove = (id: number) => {
    updateMutation.mutate({ id, status: 'approved' });
  };

  // Reject withdrawal
  const handleReject = (id: number) => {
    updateMutation.mutate({ id, status: 'rejected' });
  };

  // Reset withdrawals
  const handleReset = () => {
    resetMutation.mutate();
    setResetDialogOpen(false);
  };

  // Search function for withdrawals
  const searchWithdrawals = (withdrawal: WithdrawalRequest, query: string) => {
    const searchText = query.toLowerCase();
    return (
      (withdrawal.user?.firstName && withdrawal.user.firstName.toLowerCase().includes(searchText)) ||
      (withdrawal.user?.lastName && withdrawal.user.lastName.toLowerCase().includes(searchText)) ||
      withdrawal.telegramUserId.includes(searchText) ||
      withdrawal.bankAccountName.toLowerCase().includes(searchText) ||
      withdrawal.status.toLowerCase().includes(searchText)
    );
  };

  // Withdrawal table columns
  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'user', title: 'User', render: (withdrawal: WithdrawalRequest) => (
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
          <User className="h-4 w-4" />
        </div>
        <div>
          <div>{withdrawal.user?.firstName || 'Unknown'}</div>
          <div className="text-xs text-gray-500">ID: {withdrawal.telegramUserId}</div>
        </div>
      </div>
    )},
    { key: 'amount', title: 'Amount', render: (withdrawal: WithdrawalRequest) => (
      <span className="font-medium">{formatCurrency(withdrawal.amount)}</span>
    )},
    { key: 'bankDetails', title: 'Bank Details', render: (withdrawal: WithdrawalRequest) => (
      <div>
        <div>{withdrawal.bankName}</div>
        <div className="text-xs text-gray-500">{withdrawal.bankAccountNumber}</div>
        <div className="text-xs text-gray-500">{withdrawal.bankAccountName}</div>
      </div>
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
    )},
    { key: 'actions', title: 'Actions', render: (withdrawal: WithdrawalRequest) => (
      <div className="flex space-x-1">
        {withdrawal.status === 'pending' ? (
          <>
            <Button
              onClick={() => handleApprove(withdrawal.id)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white"
              disabled={updateMutation.isPending}
              title="Approve"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleReject(withdrawal.id)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white"
              disabled={updateMutation.isPending}
              title="Reject"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <span className="text-gray-400 text-sm">No actions</span>
        )}
      </div>
    )}
  ];

  // Count pending withdrawals
  const pendingCount = withdrawalRequests?.filter(w => w.status === 'pending').length || 0;

  return (
    <DashboardLayout title="Withdrawal Requests">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total: {withdrawalRequests?.length || 0} | Pending: {pendingCount}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                disabled={resetMutation.isPending}
              >
                <Trash className="h-4 w-4 mr-2" />
                Reset Withdrawals
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Withdrawal Requests</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all withdrawal requests from the system. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-red-500 hover:bg-red-600">
                  {resetMutation.isPending ? "Resetting..." : "Reset Withdrawals"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <DataTable
        data={withdrawalRequests || []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No withdrawal requests found"
        searchFunction={searchWithdrawals}
      />
    </DashboardLayout>
  );
}
