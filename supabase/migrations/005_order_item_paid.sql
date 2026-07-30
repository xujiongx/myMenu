-- 订单明细支付标记：已支付菜品不可移除；有已付明细的待支付单不可整单取消
alter table public.order_items
  add column if not exists paid boolean not null default false;

-- 存量回填
update public.order_items oi
set paid = true
from public.orders o
where oi.order_id = o.id
  and o.status in ('confirmed', 'completed');

-- 待支付且 payable < total：说明已部分支付，将「已付部分」按明细从早到晚标记（简化：按行金额从前往后累加直到达到已付金额）
-- 已付金额 = total_amount - payable_amount
do $$
declare
  r record;
  item record;
  remaining numeric;
begin
  for r in
    select id, total_amount, payable_amount
    from public.orders
    where status = 'pending'
      and payable_amount < total_amount
      and payable_amount >= 0
  loop
    remaining := r.total_amount - r.payable_amount;
    for item in
      select id, line_amount
      from public.order_items
      where order_id = r.id
      order by id
    loop
      exit when remaining <= 0;
      if item.line_amount <= remaining then
        update public.order_items set paid = true where id = item.id;
        remaining := remaining - item.line_amount;
      end if;
    end loop;
  end loop;
end $$;
