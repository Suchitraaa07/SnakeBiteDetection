-- Geo intelligence tables for risk map APIs

create extension if not exists "uuid-ossp";

create table if not exists incidents (
    id uuid primary key default uuid_generate_v4(),
    type text not null,
    lat double precision not null,
    lng double precision not null,
    severity text,
    created_at timestamp with time zone default now()
);

create table if not exists sightings (
    id uuid primary key default uuid_generate_v4(),
    animal text,
    lat double precision not null,
    lng double precision not null,
    created_at timestamp with time zone default now()
);

create index if not exists idx_incidents_created_at on incidents(created_at desc);
create index if not exists idx_sightings_created_at on sightings(created_at desc);

alter table incidents enable row level security;
alter table sightings enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'incidents' and policyname = 'Public incidents insert access'
    ) then
        create policy "Public incidents insert access" on incidents for insert with check (true);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'incidents' and policyname = 'Public incidents read access'
    ) then
        create policy "Public incidents read access" on incidents for select using (true);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'sightings' and policyname = 'Public sightings insert access'
    ) then
        create policy "Public sightings insert access" on sightings for insert with check (true);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'sightings' and policyname = 'Public sightings read access'
    ) then
        create policy "Public sightings read access" on sightings for select using (true);
    end if;
end $$;

grant select, insert on incidents to anon, authenticated;
grant select, insert on sightings to anon, authenticated;
