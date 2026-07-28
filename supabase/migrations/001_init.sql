-- 我的菜单 · 初始化表结构与种子数据
-- 在 Supabase SQL Editor 执行本文件

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  account text not null,
  password_hash text not null,
  nickname text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_account_unique unique (account),
  constraint profiles_account_format check (account ~ '^[A-Za-z0-9]+$')
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_unique unique (name)
);

create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  image_url text,
  price numeric(10, 2) not null check (price >= 0),
  description text,
  status text not null default 'on' check (status in ('on', 'off')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dishes_category_name_unique unique (category_id, name)
);

create index if not exists idx_dishes_category_status
  on public.dishes (category_id, status);

create index if not exists idx_dishes_status_updated
  on public.dishes (status, updated_at desc);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user_created
  on public.orders (user_id, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  dish_id uuid references public.dishes (id) on delete set null,
  dish_name text not null,
  dish_image_url text,
  unit_price numeric(10, 2) not null,
  quantity int not null check (quantity > 0),
  line_amount numeric(12, 2) not null
);

create index if not exists idx_order_items_order
  on public.order_items (order_id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.dishes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

insert into public.categories (id, name, sort_order) values
  ('11111111-1111-1111-1111-111111111001', '招牌推荐', 1),
  ('11111111-1111-1111-1111-111111111002', '热菜', 2),
  ('11111111-1111-1111-1111-111111111003', '凉菜', 3),
  ('11111111-1111-1111-1111-111111111004', '汤品', 4),
  ('11111111-1111-1111-1111-111111111005', '主食', 5),
  ('11111111-1111-1111-1111-111111111006', '饮品', 6),
  ('11111111-1111-1111-1111-111111111007', '小吃', 7)
on conflict (name) do nothing;

-- admin/admin123 · user/user123
insert into public.profiles (id, account, password_hash, nickname, role) values
  (
    '22222222-2222-2222-2222-222222222001',
    'admin',
    '$2b$10$2Q38ZGFhKY.SlJVHIXCwk.cZpLkntRUkCOccaqWdw4IhOr/YJHMTq',
    '店长',
    'admin'
  ),
  (
    '22222222-2222-2222-2222-222222222002',
    'user',
    '$2b$10$rTDZhRVVTcE7oSK7LNqPhOQsT0j.v2wWlvutTOyWwZaBkA4Jy6Y3q',
    '食客小明',
    'user'
  )
on conflict (account) do update set
  password_hash = excluded.password_hash,
  nickname = excluded.nickname,
  role = excluded.role,
  updated_at = now();

insert into public.dishes (category_id, name, price, description, status) values
  ('11111111-1111-1111-1111-111111111001', '招牌红烧肉', 48.00, '肥而不腻，酱香浓郁', 'on'),
  ('11111111-1111-1111-1111-111111111001', '蒜蓉粉丝蒸扇贝', 56.00, '鲜甜开胃', 'on'),
  ('11111111-1111-1111-1111-111111111002', '青椒肉丝', 32.00, '家常小炒', 'on'),
  ('11111111-1111-1111-1111-111111111002', '番茄炒蛋', 22.00, '经典搭配', 'on'),
  ('11111111-1111-1111-1111-111111111002', '宫保鸡丁', 36.00, '酸甜微辣', 'on'),
  ('11111111-1111-1111-1111-111111111003', '凉拌黄瓜', 12.00, '清爽解腻', 'on'),
  ('11111111-1111-1111-1111-111111111004', '番茄蛋汤', 16.00, '暖胃清淡', 'on'),
  ('11111111-1111-1111-1111-111111111005', '米饭', 3.00, '一碗', 'on'),
  ('11111111-1111-1111-1111-111111111006', '酸梅汤', 10.00, '冰镇更佳', 'on'),
  ('11111111-1111-1111-1111-111111111007', '炸薯条', 15.00, '外酥里软', 'on')
on conflict (category_id, name) do nothing;
