-- Tipurile de eveniment din formular urmează serviciile Steco.
alter table public.steco_contact_requests drop constraint if exists steco_contact_requests_event_type_check;
alter table public.steco_contact_requests
  add constraint steco_contact_requests_event_type_check
  check (event_type in ('nunta', 'botez', 'majorat', 'aniversare', 'gender_reveal', 'candy_bar', 'altul'));

-- Notificare pe email la fiecare cerere nouă.
-- Funcția notify-contact-request marchează notified_at, așa că fiecare cerere produce cel mult un email.
alter table public.steco_contact_requests add column if not exists notified_at timestamptz;

create extension if not exists pg_net with schema extensions;

create or replace function private.notify_new_contact_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- pg_net trimite cererea în fundal: salvarea formularului nu așteaptă emailul.
  perform net.http_post(
    url := 'https://ptmtftxihrxbdkcrxtgh.supabase.co/functions/v1/notify-contact-request',
    body := jsonb_build_object('id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;

revoke all on function private.notify_new_contact_request() from public;

drop trigger if exists steco_contact_requests_notify on public.steco_contact_requests;
create trigger steco_contact_requests_notify
  after insert on public.steco_contact_requests
  for each row execute function private.notify_new_contact_request();
