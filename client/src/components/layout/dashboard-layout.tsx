import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Moon, Sun, Menu, Home, Users, Wallet, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [currentPath] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if dark mode is set in localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Add resize listener for responsive sidebar
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account"
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive"
      });
    }
  };

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hover:bg-gray-100 md:dark:hover:bg-gray-700"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-primary dark:text-primary-foreground">FairMoney Admin</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleDarkMode}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm font-medium">Admin</span>
              <div className="w-8 h-8 rounded-full bg-primary-200 dark:bg-primary-700 flex items-center justify-center">
                <span className="text-sm">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`fixed md:static left-0 top-15 bottom-0 w-64 transform transition-transform duration-300 ease-in-out z-30 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-md md:shadow-none overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <nav className="py-4 px-2">
            <div className="space-y-1">
              <Link to="/">
                <Button
                  variant={isActive('/') ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isActive('/') ? 'bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : ''}`}
                >
                  <Home className="mr-2 h-5 w-5" />
                  Dashboard
                </Button>
              </Link>
              
              <Link to="/users">
                <Button
                  variant={isActive('/users') ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isActive('/users') ? 'bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : ''}`}
                >
                  <Users className="mr-2 h-5 w-5" />
                  Users
                </Button>
              </Link>
              
              <Link to="/withdrawals">
                <Button
                  variant={isActive('/withdrawals') ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isActive('/withdrawals') ? 'bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : ''}`}
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Withdrawals
                </Button>
              </Link>
              
              <Link to="/settings">
                <Button
                  variant={isActive('/settings') ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isActive('/settings') ? 'bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : ''}`}
                >
                  <SettingsIcon className="mr-2 h-5 w-5" />
                  Settings
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Button>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4">
          {/* Overlay for mobile sidebar */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
