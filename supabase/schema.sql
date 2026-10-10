-- Klar: Speicher für den Abgleich zwischen Geräten.
-- Einmal im Supabase-Projekt ausführen: SQL Editor → New query → einfügen → Run.
-- Jede Zeile ist ein Dokument (Sammlung + Kennung), z. B. stand/aktuell oder
-- sicherungen/2026-10-10T…; jeder Nutzer sieht und ändert nur seine eigenen.

create table if not exists public.klar_dokumente (
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sammlung  text not null,
  id        text not null,
  daten     jsonb not null,
  geaendert timestamptz not null default now(),
  primary key (user_id, sammlung, id)
);

alter table public.klar_dokumente enable row level security;

drop policy if exists "klar lesen" on public.klar_dokumente;
drop policy if exists "klar anlegen" on public.klar_dokumente;
drop policy if exists "klar aendern" on public.klar_dokumente;
drop policy if exists "klar loeschen" on public.klar_dokumente;
create policy "klar lesen"   on public.klar_dokumente for select to authenticated using (user_id = auth.uid());
create policy "klar anlegen" on public.klar_dokumente for insert to authenticated with check (user_id = auth.uid());
create policy "klar aendern" on public.klar_dokumente for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "klar loeschen" on public.klar_dokumente for delete to authenticated using (user_id = auth.uid());

-- Live-Abgleich: Änderungen an andere Geräte desselben Nutzers melden
do $$ begin
  alter publication supabase_realtime add table public.klar_dokumente;
exception when duplicate_object then null; end $$;
