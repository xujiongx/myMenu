-- 将演示账号 admin 恢复为管理员角色（用户管理入口依赖 role=admin）
update public.profiles
set role = 'admin', updated_at = now()
where account = 'admin';
