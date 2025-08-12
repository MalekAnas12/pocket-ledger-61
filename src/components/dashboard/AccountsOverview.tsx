import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { CreditCard, Wallet, PiggyBank, TrendingUp, Plus, Edit } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

const getAccountIcon = (type: string) => {
  switch (type) {
    case 'checking':
      return <CreditCard className="h-5 w-5" />;
    case 'savings':
      return <PiggyBank className="h-5 w-5" />;
    case 'investment':
      return <TrendingUp className="h-5 w-5" />;
    default:
      return <Wallet className="h-5 w-5" />;
  }
};

const getAccountTypeColor = (type: string) => {
  switch (type) {
    case 'checking':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'savings':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'credit_card':
      return 'bg-red-500/10 text-red-700 border-red-200';
    case 'investment':
      return 'bg-purple-500/10 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

export const AccountsOverview = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAccounts(data.map(account => ({
        ...account,
        balance: Number(account.balance)
      })));
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts
    .filter(account => account.is_active)
    .reduce((sum, account) => sum + account.balance, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-lg" />
                  <div>
                    <div className="h-4 w-32 bg-muted rounded mb-2" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span>Total Balance</span>
            </div>
            <Button size="sm" className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            ${totalBalance.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Across {accounts.filter(a => a.is_active).length} active accounts
          </p>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <div className="space-y-4">
        {accounts.map((account) => (
          <Card key={account.id} className={`${!account.is_active ? 'opacity-60' : ''} hover:shadow-md transition-shadow`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    {getAccountIcon(account.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{account.name}</h3>
                      <Badge className={getAccountTypeColor(account.type)}>
                        {account.type.replace('_', ' ')}
                      </Badge>
                      {!account.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {account.currency} • Last updated recently
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${account.balance.toLocaleString()}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No accounts yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first account to start tracking your finances.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};