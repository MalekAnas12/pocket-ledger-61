import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  LogOut,
  CreditCard,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react';
import { TransactionList } from './TransactionList';
import { AddTransactionDialog } from './AddTransactionDialog';
import { AddAccountDialog } from './AddAccountDialog';
import { AccountsOverview } from './AccountsOverview';
import { ExpenseChart } from './ExpenseChart';
import { MonthlyTrends } from './MonthlyTrends';
import BankStatementImport from './BankStatementImport';
import ExcelExport from './ExcelExport';
import { AppSidebar } from '../AppSidebar';

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  transactionCount: number;
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Get total balance from all accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const totalBalance = accounts?.reduce((sum, account) => sum + Number(account.balance), 0) || 0;

      // Get current month's transactions
      const currentMonth = new Date();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);

      const monthlyIncome = transactions?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const monthlyExpenses = transactions?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const transactionCount = transactions?.length || 0;

      setStats({
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        transactionCount,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const netIncome = stats.monthlyIncome - stats.monthlyExpenses;

  const handleSidebarAction = (action: string) => {
    switch (action) {
      case 'add-transaction':
        setShowAddTransaction(true);
        break;
      case 'add-account':
        setShowAddAccount(true);
        break;
      case 'import':
        setActiveTab('tools');
        break;
      case 'export':
        setActiveTab('tools');
        break;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar 
          onTabChange={setActiveTab}
          activeTab={activeTab}
          onActionClick={handleSidebarAction}
        />
        <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-muted/10 to-primary/5">
          {/* Header */}
          <div className="bg-card/80 backdrop-blur border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <SidebarTrigger className="mr-2" />
                  <div className="p-2 bg-primary rounded-lg">
                    <Wallet className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">PocketLedger</h1>
                    <p className="text-sm text-muted-foreground">Welcome back!</p>
                  </div>
                </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowAddTransaction(true)}
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will need to sign in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Stay Logged In</AlertDialogCancel>
                    <AlertDialogAction onClick={signOut}>Log Out</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-card to-muted/20 border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{loading ? '---' : stats.totalBalance.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-success flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Monthly Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                +₹{loading ? '---' : stats.monthlyIncome.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive flex items-center">
                <TrendingDown className="h-4 w-4 mr-2" />
                Monthly Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                -₹{loading ? '---' : stats.monthlyExpenses.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${netIncome >= 0 ? 'from-success/10 to-success/5 border-success/20' : 'from-warning/10 to-warning/5 border-warning/20'} shadow-lg`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${netIncome >= 0 ? 'text-success' : 'text-warning'} flex items-center`}>
                <Target className="h-4 w-4 mr-2" />
                Net Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-success' : 'text-warning'}`}>
                {netIncome >= 0 ? '+' : ''}₹{loading ? '---' : netIncome.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ExpenseChart />
                  <MonthlyTrends />
                </div>
                <TransactionList limit={10} />
              </TabsContent>

              <TabsContent value="transactions">
                <TransactionList />
              </TabsContent>

              <TabsContent value="accounts">
                <AccountsOverview />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ExpenseChart />
                  <MonthlyTrends />
                </div>
              </TabsContent>

              <TabsContent value="tools" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BankStatementImport onImportComplete={loadDashboardData} />
                  <ExcelExport />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <AddTransactionDialog
            open={showAddTransaction}
            onOpenChange={setShowAddTransaction}
            onSuccess={loadDashboardData}
          />

          <AddAccountDialog
            open={showAddAccount}
            onOpenChange={setShowAddAccount}
            onSuccess={loadDashboardData}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};