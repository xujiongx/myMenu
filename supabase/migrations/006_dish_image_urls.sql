-- 菜品多图：image_urls 为有序 URL 数组；image_url 仍作封面（首图），供订单快照兼容
alter table public.dishes
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

update public.dishes
set image_urls = jsonb_build_array(image_url)
where image_url is not null
  and image_url <> ''
  and (image_urls = '[]'::jsonb or image_urls is null);

comment on column public.dishes.image_urls is '菜品图片 URL 数组（顺序即展示顺序），最多 9 张；image_url 为封面=首图';
