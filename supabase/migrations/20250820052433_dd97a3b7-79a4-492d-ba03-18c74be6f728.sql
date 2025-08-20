-- Update default currency to INR for new accounts
ALTER TABLE public.accounts ALTER COLUMN currency SET DEFAULT 'INR';

-- Update existing accounts to INR (optional - you may want to keep existing data)
-- UPDATE public.accounts SET currency = 'INR' WHERE currency = 'USD';