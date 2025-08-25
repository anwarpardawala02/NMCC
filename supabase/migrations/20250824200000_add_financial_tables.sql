-- Create fixtures table to track all planned cricket matches
create table if not exists fixtures (
  id uuid default gen_random_uuid() primary key,
  opponent text not null,
  fixture_date date not null,
  ground text not null,
  home_away text not null check (home_away in ('home', 'away')),
  notes text,
  created_at timestamptz default now()
);

-- Create fees table to track money owed by players
create table if not exists fees (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references players(id) not null,
  fee_type text not null check (fee_type in ('membership', 'match', 'training', 'other')),
  amount numeric not null,
  due_date date not null,
  paid boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Create expenses table to track club expenses
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  expense_type text not null check (expense_type in ('equipment', 'ground', 'travel', 'refreshments', 'other')),
  amount numeric not null,
  expense_date date not null,
  description text not null,
  paid_by text not null,
  reimbursed boolean default false,
  created_at timestamptz default now()
);

-- Create appropriate indexes
create index if not exists fixtures_date_idx on fixtures (fixture_date);
create index if not exists fees_player_id_idx on fees (player_id);
create index if not exists fees_due_date_idx on fees (due_date);
create index if not exists expenses_date_idx on expenses (expense_date);
