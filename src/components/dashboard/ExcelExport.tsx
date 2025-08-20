import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../auth/AuthProvider";
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const ExcelExport = () => {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const exportTransactions = async () => {
    if (!user) return;

    setExporting(true);
    try {
      // Fetch all transactions with related data
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (name),
          accounts (name, type)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        toast({
          title: "No data to export",
          description: "You don't have any transactions to export",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for Excel
      const exportData = transactions.map(transaction => ({
        'Date': format(new Date(transaction.date), 'dd/MM/yyyy'),
        'Description': transaction.description,
        'Category': transaction.categories?.name || 'Uncategorized',
        'Account': transaction.accounts?.name || 'Unknown',
        'Account Type': transaction.accounts?.type || 'Unknown',
        'Type': transaction.type === 'income' ? 'Income' : 'Expense',
        'Amount (₹)': transaction.amount,
        'Notes': transaction.notes || '',
        'Created Date': format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm:ss'),
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 12 }, // Date
        { wch: 30 }, // Description
        { wch: 15 }, // Category
        { wch: 20 }, // Account
        { wch: 15 }, // Account Type
        { wch: 10 }, // Type
        { wch: 15 }, // Amount
        { wch: 30 }, // Notes
        { wch: 20 }, // Created Date
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

      // Generate summary sheet
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const summaryData = [
        { 'Metric': 'Total Income', 'Amount (₹)': totalIncome },
        { 'Metric': 'Total Expenses', 'Amount (₹)': totalExpenses },
        { 'Metric': 'Net Balance', 'Amount (₹)': totalIncome - totalExpenses },
        { 'Metric': 'Total Transactions', 'Amount (₹)': transactions.length },
        { 'Metric': 'Export Date', 'Amount (₹)': format(new Date(), 'dd/MM/yyyy HH:mm:ss') },
      ];

      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
      summaryWorksheet['!cols'] = [{ wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

      // Generate filename with current date
      const filename = `transactions_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export successful",
        description: `Downloaded ${transactions.length} transactions to ${filename}`,
      });

    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export transactions",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const exportAccounts = async () => {
    if (!user) return;

    setExporting(true);
    try {
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!accounts || accounts.length === 0) {
        toast({
          title: "No data to export",
          description: "You don't have any accounts to export",
          variant: "destructive",
        });
        return;
      }

      const exportData = accounts.map(account => ({
        'Account Name': account.name,
        'Account Type': account.type,
        'Balance (₹)': account.balance,
        'Currency': account.currency,
        'Status': account.is_active ? 'Active' : 'Inactive',
        'Created Date': format(new Date(account.created_at), 'dd/MM/yyyy HH:mm:ss'),
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      worksheet['!cols'] = [
        { wch: 20 }, // Account Name
        { wch: 15 }, // Account Type
        { wch: 15 }, // Balance
        { wch: 10 }, // Currency
        { wch: 10 }, // Status
        { wch: 20 }, // Created Date
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts');

      const filename = `accounts_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export successful",
        description: `Downloaded ${accounts.length} accounts to ${filename}`,
      });

    } catch (error) {
      console.error('Error exporting accounts:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export accounts",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export to Excel
        </CardTitle>
        <CardDescription>
          Download your financial data in Excel format for backup or analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={exportTransactions}
            disabled={exporting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export Transactions"}
          </Button>
          
          <Button
            onClick={exportAccounts}
            disabled={exporting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export Accounts"}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Excel files will include all your data with proper formatting and summary sheets
        </p>
      </CardContent>
    </Card>
  );
};

export default ExcelExport;