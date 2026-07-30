-- 订单待支付金额：首次结算 = 全额；已确认后再加菜 = 仅加菜金额
alter table public.orders
  add column if not exists payable_amount numeric(12, 2) not null default 0
  check (payable_amount >= 0);

-- 存量：待支付视为全额未付，其余已付清
update public.orders
set payable_amount = case
  when status = 'pending' then total_amount
  else 0
end
where true;

alter table public.orders
  alter column status set default 'pending';
