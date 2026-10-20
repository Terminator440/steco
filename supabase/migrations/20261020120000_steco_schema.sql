-- Schema Steco Events: conținutul paginilor, cererile de ofertă, setările site-ului și administratorii.
-- Vizitatorii (rolul anon) pot doar citi conținutul public și trimite cereri de ofertă.
-- Orice modificare cere un cont Supabase Auth trecut în steco_admins.

create schema if not exists private;
grant usage on schema private to authenticated;

-- Administratori ---------------------------------------------------------------

create table public.steco_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.steco_admins enable row level security;
revoke all on public.steco_admins from anon, authenticated;

create policy "Adminii își văd propriul rând"
  on public.steco_admins for select
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.steco_admins to authenticated;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.steco_admins where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Blocurile paginilor ------------------------------------------------------------
-- Tabelul exista deja în proiect, fără RLS; îl aducem la forma de mai jos fără să pierdem date.

create table if not exists public.steco_page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  block_type text not null,
  content_json jsonb not null default '{}'::jsonb,
  order_index integer default 0,
  created_at timestamptz default now()
);

alter table public.steco_page_blocks add column if not exists updated_at timestamptz not null default now();

update public.steco_page_blocks set order_index = 0 where order_index is null;
alter table public.steco_page_blocks
  alter column order_index set not null,
  alter column order_index set default 0,
  alter column content_json set default '{}'::jsonb,
  alter column created_at set not null;

-- Adminul salvează acum mereu după id, iar unicitatea pe (pagină, tip, ordine)
-- bloca schimbarea ordinii între două blocuri de același tip.
alter table public.steco_page_blocks drop constraint if exists unique_page_block_order;

alter table public.steco_page_blocks
  add constraint steco_page_blocks_page_slug_check
    check (page_slug in ('home', 'servicii', 'portofoliu', 'contact', 'misiunea-noastra', 'participanti')),
  add constraint steco_page_blocks_block_type_check
    check (block_type in ('hero', 'text_photo', 'services_grid', 'text_section', 'participants_grid', 'gallery')),
  add constraint steco_page_blocks_order_index_check check (order_index >= 0),
  add constraint steco_page_blocks_content_json_check check (jsonb_typeof(content_json) = 'object');

create index if not exists steco_page_blocks_page_order_idx on public.steco_page_blocks (page_slug, order_index);

create trigger steco_page_blocks_updated_at
  before update on public.steco_page_blocks
  for each row execute function private.set_updated_at();

alter table public.steco_page_blocks enable row level security;
revoke all on public.steco_page_blocks from anon, authenticated;

create policy "Oricine citește blocurile"
  on public.steco_page_blocks for select
  to anon, authenticated
  using (true);

create policy "Adminii adaugă blocuri"
  on public.steco_page_blocks for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Adminii modifică blocuri"
  on public.steco_page_blocks for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Adminii șterg blocuri"
  on public.steco_page_blocks for delete
  to authenticated
  using ((select private.is_admin()));

grant select on public.steco_page_blocks to anon, authenticated;
grant insert, update, delete on public.steco_page_blocks to authenticated;

-- Tabele vechi, nefolosite de cod. Rămân pe loc (steco_pages are 5 rânduri), dar nu mai pot fi
-- citite sau modificate prin API până nu decide cineva ce se întâmplă cu ele.
do $$
begin
  if to_regclass('public.steco_pages') is not null then
    alter table public.steco_pages enable row level security;
    revoke all on public.steco_pages from anon, authenticated;
  end if;
  if to_regclass('public.steco_page_content') is not null then
    alter table public.steco_page_content enable row level security;
    revoke all on public.steco_page_content from anon, authenticated;
  end if;
end;
$$;

-- Cereri de ofertă din formularul de contact -------------------------------------

create table public.steco_contact_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  email text not null
    check (char_length(email) <= 200 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone text check (char_length(phone) <= 40),
  event_type text not null check (event_type in ('nunta', 'botez', 'majorat', 'corporate', 'altul')),
  event_date date,
  guests integer check (guests between 1 and 5000),
  location text check (char_length(location) <= 200),
  message text check (char_length(message) <= 4000),
  consent boolean not null check (consent),
  status text not null default 'nou' check (status in ('nou', 'in_lucru', 'finalizat'))
);

create index steco_contact_requests_created_idx on public.steco_contact_requests (created_at desc);

alter table public.steco_contact_requests enable row level security;
revoke all on public.steco_contact_requests from anon, authenticated;

create policy "Vizitatorii trimit cereri noi"
  on public.steco_contact_requests for insert
  to anon, authenticated
  with check (status = 'nou');

create policy "Adminii citesc cererile"
  on public.steco_contact_requests for select
  to authenticated
  using ((select private.is_admin()));

create policy "Adminii actualizează cererile"
  on public.steco_contact_requests for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Adminii șterg cererile"
  on public.steco_contact_requests for delete
  to authenticated
  using ((select private.is_admin()));

grant insert (name, email, phone, event_type, event_date, guests, location, message, consent)
  on public.steco_contact_requests to anon, authenticated;
grant select, update, delete on public.steco_contact_requests to authenticated;

-- Setările site-ului (un singur rând) --------------------------------------------

create table public.steco_site_settings (
  id smallint primary key default 1 check (id = 1),
  phone text check (char_length(phone) <= 40),
  email text check (char_length(email) <= 200),
  address text check (char_length(address) <= 300),
  instagram_url text check (instagram_url ~ '^https://'),
  facebook_url text check (facebook_url ~ '^https://'),
  tiktok_url text check (tiktok_url ~ '^https://'),
  updated_at timestamptz not null default now()
);

insert into public.steco_site_settings (id) values (1);

create trigger steco_site_settings_updated_at
  before update on public.steco_site_settings
  for each row execute function private.set_updated_at();

alter table public.steco_site_settings enable row level security;
revoke all on public.steco_site_settings from anon, authenticated;

create policy "Oricine citește setările"
  on public.steco_site_settings for select
  to anon, authenticated
  using (true);

create policy "Adminii modifică setările"
  on public.steco_site_settings for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

grant select on public.steco_site_settings to anon, authenticated;
grant update (phone, email, address, instagram_url, facebook_url, tiktok_url)
  on public.steco_site_settings to authenticated;

-- Imagini --------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'steco-images',
  'steco-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Politicile vechi lăsau pe oricine să încarce fișiere în bucket.
drop policy if exists "imagini 1e197x1_0" on storage.objects;
drop policy if exists "imagini 1e197x1_1" on storage.objects;

-- Imaginile rămân publice prin URL (bucket public); doar listarea și modificarea cer admin.
create policy "Adminii văd lista de imagini"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'steco-images' and (select private.is_admin()));

create policy "Adminii încarcă imagini"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'steco-images' and (select private.is_admin()));

create policy "Adminii modifică imagini"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'steco-images' and (select private.is_admin()))
  with check (bucket_id = 'steco-images' and (select private.is_admin()));

create policy "Adminii șterg imagini"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'steco-images' and (select private.is_admin()));
