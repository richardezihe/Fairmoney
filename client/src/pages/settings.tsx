import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { resetWithdrawalRequests, resetAllData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { queryClient } from "@/lib/queryClient";

export default function Settings() {
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );
  const [resetWithdrawalsDialogOpen, setResetWithdrawalsDialogOpen] = useState(false);
  const [resetAllDataDialogOpen, setResetAllDataDialogOpen] = useState(false);
  
  // Reset withdrawals mutation
  const resetWithdrawalsMutation = useMutation({
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

  // Reset all data mutation
  const resetAllDataMutation = useMutation({
    mutationFn: resetAllData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "All data reset",
        description: "All data has been reset successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Failed to reset all data",
        variant: "destructive"
      });
    }
  });

  // Toggle dark mode
  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Reset withdrawal requests
  const handleResetWithdrawals = () => {
    resetWithdrawalsMutation.mutate();
    setResetWithdrawalsDialogOpen(false);
  };

  // Reset all data
  const handleResetAllData = () => {
    resetAllDataMutation.mutate();
    setResetAllDataDialogOpen(false);
  };

  return (
    <DashboardLayout title="Settings">
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">System Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="dark-mode" checked={darkMode} onCheckedChange={handleToggleDarkMode} />
              <Label htmlFor="dark-mode">Dark Mode</Label>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-lg font-medium mb-3">Database Management</h4>
            <div className="space-y-3">
              <AlertDialog open={resetWithdrawalsDialogOpen} onOpenChange={setResetWithdrawalsDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive" 
                    disabled={resetWithdrawalsMutation.isPending}
                  >
                    Reset Withdrawal Requests
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
                    <AlertDialogAction onClick={handleResetWithdrawals} className="bg-red-500 hover:bg-red-600">
                      {resetWithdrawalsMutation.isPending ? "Resetting..." : "Reset Withdrawals"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <AlertDialog open={resetAllDataDialogOpen} onOpenChange={setResetAllDataDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    disabled={resetAllDataMutation.isPending}
                  >
                    Reset All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset All Data</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete ALL data including users and withdrawal requests. Admin accounts will be preserved. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetAllData} className="bg-red-500 hover:bg-red-600">
                      {resetAllDataMutation.isPending ? "Resetting..." : "Reset All Data"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-lg font-medium mb-3">Telegram Bot Configuration</h4>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Bot configuration is managed through environment variables:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>TELEGRAM_BOT_TOKEN - Your Telegram bot token</li>
                <li>TELEGRAM_CHANNEL_ID - Channel ID users must join</li>
                <li>TELEGRAM_GROUP_ID - Group ID users must join</li>
              </ul>
              <p className="mt-2">These settings can only be changed by updating the environment variables.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
