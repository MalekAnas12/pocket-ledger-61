import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { TrendingUp, TrendingDown, Calendar, Filter, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  category: {
    name: string;
    color: string;
    icon: string;
  } | null;
  account: {
    name: string;
  };
}

interface TransactionListProps {
  limit?: number;
}

export const TransactionList = ({ limit }: TransactionListProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [user, limit]);

  const loadTransactions = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('transactions')
        .select(`
          id,
          amount,
          type,
          description,
          date,
          categories (
            name,
            color,
            icon
          ),
          accounts (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions((data as any[]).map((t: any) => {
        const category = Array.isArray(t.categories) ? t.categories[0] : t.categories;
        const account = Array.isArray(t.accounts) ? t.accounts[0] : t.accounts;
        return {
          id: t.id,
          amount: Number(t.amount),
          type: t.type as 'income' | 'expense',
          description: t.description || '',
          date: t.date,
          category: category ? { name: category.name, color: category.color, icon: category.icon } : null,
          account: account ? { name: account.name } : { name: '' },
        } as Transaction;
      }));
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
                  <div>
                    <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Recent Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
            <p className="text-muted-foreground">
              Start tracking your finances by adding your first transaction.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Recent Transactions</span>
          </CardTitle>
          {!limit && (
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: transaction.category?.color ? `${transaction.category.color}20` : '#f3f4f6',
                }}
              >
                {transaction.type === 'income' ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{transaction.description}</p>
                  {transaction.category && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: transaction.category.color,
                        color: transaction.category.color,
                      }}
                    >
                      {transaction.category.name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{transaction.account.name}</span>
                  <span>•</span>
                  <span>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
            <div
              className={`text-lg font-semibold ${
                transaction.type === 'income' ? 'text-success' : 'text-destructive'
              }`}
            >
              {transaction.type === 'income' ? '+' : '-'}₹
              {transaction.amount.toLocaleString()}
            </div>
          </div>
        ))}
        
        {limit && transactions.length >= limit && (
          <div className="text-center pt-4">
            <Button variant="outline">View All Transactions</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};