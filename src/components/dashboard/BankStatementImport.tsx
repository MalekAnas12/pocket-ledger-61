import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../auth/AuthProvider";
import * as XLSX from 'xlsx';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

interface BankStatementImportProps {
  onImportComplete?: () => void;
}

const BankStatementImport = ({ onImportComplete }: BankStatementImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData([]);
    }
  };

  const parseExcelFile = async (file: File): Promise<ParsedTransaction[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const transactions: ParsedTransaction[] = [];
          
          jsonData.forEach((row: any) => {
            // Try to detect common column names
            const dateValue = row.Date || row.date || row.DATE || row['Transaction Date'] || row['transaction_date'];
            const descValue = row.Description || row.description || row.DESCRIPTION || row.Narration || row.narration;
            const amountValue = row.Amount || row.amount || row.AMOUNT;
            const debitValue = row.Debit || row.debit || row.DEBIT;
            const creditValue = row.Credit || row.credit || row.CREDIT;

            if (dateValue && descValue) {
              let amount = 0;
              let type: 'income' | 'expense' = 'expense';

              if (amountValue) {
                amount = Math.abs(parseFloat(amountValue.toString().replace(/[^\d.-]/g, '')));
                type = parseFloat(amountValue.toString()) > 0 ? 'income' : 'expense';
              } else if (debitValue || creditValue) {
                if (debitValue && parseFloat(debitValue.toString()) > 0) {
                  amount = parseFloat(debitValue.toString());
                  type = 'expense';
                } else if (creditValue && parseFloat(creditValue.toString()) > 0) {
                  amount = parseFloat(creditValue.toString());
                  type = 'income';
                }
              }

              if (amount > 0) {
                transactions.push({
                  date: new Date(dateValue).toISOString().split('T')[0],
                  description: descValue.toString(),
                  amount,
                  type
                });
              }
            }
          });

          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const parseFile = async () => {
    if (!file) return;

    setImporting(true);
    try {
      let transactions: ParsedTransaction[] = [];

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        transactions = await parseExcelFile(file);
      } else {
        throw new Error('Unsupported file format. Please upload Excel (.xlsx, .xls) or CSV files.');
      }

      setParsedData(transactions);
      toast({
        title: "File parsed successfully",
        description: `Found ${transactions.length} transactions`,
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Error parsing file",
        description: error instanceof Error ? error.message : "Failed to parse the bank statement",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const importTransactions = async () => {
    if (!user || parsedData.length === 0) return;

    setImporting(true);
    try {
      // Get the first account for the user
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!accounts || accounts.length === 0) {
        throw new Error('No account found. Please create an account first.');
      }

      const accountId = accounts[0].id;

      // Insert transactions
      const transactionsToInsert = parsedData.map(transaction => ({
        user_id: user.id,
        account_id: accountId,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        date: transaction.date,
        notes: 'Imported from bank statement'
      }));

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Imported ${parsedData.length} transactions`,
      });

      setParsedData([]);
      setFile(null);
      onImportComplete?.();
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import transactions",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Bank Statement
        </CardTitle>
        <CardDescription>
          Upload your bank statement in Excel or CSV format to automatically import transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Bank Statement File</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={importing}
          />
          <p className="text-sm text-muted-foreground">
            Supported formats: Excel (.xlsx, .xls) and CSV files
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
            <FileText className="h-4 w-4" />
            <span className="text-sm">{file.name}</span>
            <Button
              onClick={parseFile}
              disabled={importing}
              size="sm"
              variant="outline"
            >
              {importing ? "Parsing..." : "Parse File"}
            </Button>
          </div>
        )}

        {parsedData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-success">
              <AlertCircle className="h-4 w-4" />
              Found {parsedData.length} transactions ready to import
            </div>
            
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              <div className="p-3 space-y-2">
                {parsedData.slice(0, 5).map((transaction, index) => (
                  <div key={index} className="flex justify-between items-center text-sm border-b pb-2">
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-muted-foreground">{transaction.date}</div>
                    </div>
                    <div className={`font-medium ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                {parsedData.length > 5 && (
                  <div className="text-center text-sm text-muted-foreground pt-2">
                    ... and {parsedData.length - 5} more transactions
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={importTransactions}
              disabled={importing}
              className="w-full"
            >
              {importing ? "Importing..." : `Import ${parsedData.length} Transactions`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BankStatementImport;