-- Remove externally callable privileged helpers and prevent public listing of
-- object metadata while preserving public image URLs and admin management.
begin;

do $security$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
    execute 'grant execute on function public.rls_auto_enable() to service_role';
  end if;
end
$security$;

drop policy if exists "Public can read product images" on storage.objects;
drop policy if exists "Admins can read product images metadata" on storage.objects;

create policy "Admins can read product images metadata"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role = 'admin'
    )
  );

commit;
