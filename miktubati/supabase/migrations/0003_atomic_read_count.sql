/* Atomic, concurrency-safe read counter. Replaces the previous read-then-write
   increment in the work page, which could lose counts under concurrent loads.

   SECURITY DEFINER so the UPDATE bypasses the absence of a works UPDATE policy
   (there is intentionally none, so authors can't inflate their own stats). But
   that bypass must not become an open "bump any counter" endpoint, so the
   function re-checks that the target work is published. The caller is the
   server (service-role client) which already knows the page is public — the
   previous `auth.uid() is not null` guard silently made every bump a no-op
   for anonymous page loads, so it is removed. Read access itself stays public
   (matching the "published works are publicly readable" SELECT policy).

   `update ... returning` is atomic, so concurrent loads can't lose counts. */
create or replace function public.bump_read_count(p_work_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update works
     set read_count = coalesce(read_count, 0) + 1
   where id = p_work_id
     and status = 'published'
  returning read_count;
$$;

revoke all on function public.bump_read_count(uuid) from public, anon;
grant execute on function public.bump_read_count(uuid) to service_role, authenticated;
