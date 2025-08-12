import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { PieChart as PieChartIcon } from 'lucide-react';

interface ExpenseData {
  name: string;
  value: number;
  color: string;
}

const FALLBACK_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#8dd1e1',
  '#d084d0',
  '#87d068',
];

export const ExpenseChart = () => {
  const { user } = useAuth();
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenseData();
  }, [user]);

  const loadExpenseData = async () => {
    if (!user) return;

    try {
      // Get current month's expense transactions grouped by category
      const currentMonth = new Date();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          categories (
            name,
            color
          )
        `)
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);

      if (error) throw error;

      // Group expenses by category
      const categoryMap = new Map<string, { amount: number; color: string }>();

      data.forEach((transaction) => {
        const categoryName = transaction.categories?.name || 'Uncategorized';
        const categoryColor = transaction.categories?.color || '#6b7280';
        const amount = Number(transaction.amount);

        if (categoryMap.has(categoryName)) {
          categoryMap.get(categoryName)!.amount += amount;
        } else {
          categoryMap.set(categoryName, { amount, color: categoryColor });
        }
      });

      // Convert to chart data
      const chartData: ExpenseData[] = Array.from(categoryMap.entries())
        .map(([name, data], index) => ({
          name,
          value: data.amount,
          color: data.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value);

      setExpenseData(chartData);
    } catch (error) {
      console.error('Error loading expense data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChartIcon className="h-5 w-5" />
            <span>Expense Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (expenseData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChartIcon className="h-5 w-5" />
            <span>Expense Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-center">
            <div>
              <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                <PieChartIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No expenses this month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalExpenses = expenseData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PieChartIcon className="h-5 w-5" />
          <span>Expense Breakdown</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Total: ${totalExpenses.toLocaleString()} this month
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 space-y-2">
          {expenseData.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
              </div>
              <span className="font-medium">${item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};