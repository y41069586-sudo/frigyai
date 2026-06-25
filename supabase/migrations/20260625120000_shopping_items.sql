-- Shopping list items synced from the native iOS app
create table if not exists shopping_items (
  id           uuid        primary key,
  user_id      text        not null references auth.users(id) on delete cascade,
  name         text        not null,
  amount       text        not null default '',
  category     text        not null default 'Sonstiges',
  is_checked   boolean     not null default false,
  price        float8      not null default 0,
  created_at   timestamptz not null default now()
);

alter table shopping_items enable row level security;

create policy "Users manage their own shopping items"
  on shopping_items
  for all
  using  (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

create index if not exists shopping_items_user_id_idx on shopping_items (user_id);
