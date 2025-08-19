-- Seed default account for users missing accounts
INSERT INTO public.accounts (user_id, name, type, balance, currency)
SELECT u.id, 'Main Account', 'checking', 0, 'USD'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.accounts a WHERE a.user_id = u.id
);

-- Seed default categories for users missing categories
INSERT INTO public.categories (user_id, name, type, color, icon)
SELECT u.id, t.name, t.type, t.color, t.icon
FROM auth.users u
JOIN (
  SELECT name, type, color, icon FROM public.categories WHERE user_id = '00000000-0000-0000-0000-000000000000'
) AS t ON true
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.user_id = u.id
);
