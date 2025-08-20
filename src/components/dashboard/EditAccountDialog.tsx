import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, 'Account name must be at least 2 characters'),
  type: z.string().min(1, 'Please select an account type'),
  balance: z.string().min(1, 'Please enter balance'),
  is_active: z.boolean(),
});

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  is_active: boolean;
}

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onSuccess: () => void;
}

export const EditAccountDialog = ({ open, onOpenChange, account, onSuccess }: EditAccountDialogProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      balance: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        type: account.type,
        balance: account.balance.toString(),
        is_active: account.is_active,
      });
    }
  }, [account, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!account) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          name: values.name,
          type: values.type,
          balance: parseFloat(values.balance),
          is_active: values.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);

      if (error) throw error;

      toast.success('Account updated successfully!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Update your account details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Savings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Balance</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Account</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Inactive accounts won't be included in calculations
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Account'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};