import { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, 'Account name must be at least 2 characters'),
  type: z.string().min(1, 'Please select an account type'),
  balance: z.string().min(1, 'Please enter initial balance'),
  currency: z.string().default('INR'),
});

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddAccountDialog = ({ open, onOpenChange, onSuccess }: AddAccountDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      balance: '',
      currency: 'INR',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: values.name,
          type: values.type,
          balance: parseFloat(values.balance),
          currency: values.currency,
        });

      if (error) throw error;

      toast.success('Account added successfully!');
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error('Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Create a new account to track your finances.
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormLabel>Initial Balance</FormLabel>
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
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Account'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};