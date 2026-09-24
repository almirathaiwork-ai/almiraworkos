-- Chạy đúng một lần trong SQL Editor của Supabase hiện có.
-- Chỉ thêm bảng và hàm mới; không sửa/xóa các bảng của website cũ.
create table if not exists public.cat_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 0 check (version >= 0),
  updated_at timestamptz not null default now()
);

alter table public.cat_workspaces enable row level security;
revoke all on public.cat_workspaces from anon;
grant select, insert, update on public.cat_workspaces to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cat_workspaces' and policyname='cat_owner_select') then
    create policy cat_owner_select on public.cat_workspaces for select to authenticated
      using ((select auth.uid()) = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cat_workspaces' and policyname='cat_owner_insert') then
    create policy cat_owner_insert on public.cat_workspaces for insert to authenticated
      with check ((select auth.uid()) = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cat_workspaces' and policyname='cat_owner_update') then
    create policy cat_owner_update on public.cat_workspaces for update to authenticated
      using ((select auth.uid()) = owner_id)
      with check ((select auth.uid()) = owner_id);
  end if;
end $$;

create or replace function public.cat_save_workspace(
  p_workspace_id uuid,
  p_expected_version bigint,
  p_data jsonb
) returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare new_version bigint;
begin
  if (select auth.uid()) is null or p_data is null then
    raise exception 'Authentication and data are required';
  end if;
  update public.cat_workspaces
    set data = p_data, version = version + 1, updated_at = now()
    where id = p_workspace_id
      and owner_id = (select auth.uid())
      and version = p_expected_version
    returning version into new_version;
  return coalesce(new_version, -1);
end;
$$;
revoke all on function public.cat_save_workspace(uuid,bigint,jsonb) from public, anon;
grant execute on function public.cat_save_workspace(uuid,bigint,jsonb) to authenticated;
