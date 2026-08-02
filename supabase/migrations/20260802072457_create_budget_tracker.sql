/*
# Create budget tracker tables (single-tenant, no auth)

1. New Tables
- `categories`
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `kind` (text: 'income' or 'expense', not null)
  - `budget_limit` (numeric, nullable monthly budget cap in dollars)
  - `color` (text, hex color used for charts/UI accents)
  - `created_at` (timestamp)
- `transactions`
  - `id` (uuid, primary key)
  - `amount` (numeric, not null, positive number)
  - `kind` (text: 'income' or 'expense', not null)
  - `category_id` (uuid, references categories, ON DELETE SET NULL)
  - `note` (text, optional description)
  - `date` (date, not null, the day the transaction occurred)
  - `created_at` (timestamp)

2. Security
- Enable RLS on both tables.
- Single-tenant (no sign-in): allow anon + authenticated full CRUD because the data is intentionally shared/public on this instance.

3. Notes
- `amount` is always stored as a positive number; `kind` determines direction.
- `category_id` is nullable so a transaction can exist even if its category is later removed.
- `budget_limit` is nullable so categories without a monthly cap are allowed.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('income', 'expense')),
  budget_limit numeric(12, 2),
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  kind text NOT NULL CHECK (kind IN ('income', 'expense')),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  note text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
