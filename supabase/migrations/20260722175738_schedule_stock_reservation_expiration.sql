-- Run reservation cleanup inside Postgres to avoid external schedulers and HTTP secrets.
begin;

do $precondition$
begin
  if to_regprocedure('public.expire_stock_reservations()') is null then
    raise exception 'Required function public.expire_stock_reservations() does not exist';
  end if;
end
$precondition$;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'expire-stock-reservations',
  '*/10 * * * *',
  $job$select public.expire_stock_reservations();$job$
);

commit;
