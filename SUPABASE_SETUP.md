# Configuración Supabase — Boda Felipe & Daniela

## SQL para ejecutar en Supabase → SQL Editor

```sql
-- ═══════════════════════════════════════════════════
--  1. Tabla: album_photos
-- ═══════════════════════════════════════════════════
create table if not exists album_photos (
    id         bigint generated always as identity primary key,
    url        text         not null,
    created_at timestamptz  default now()
);

alter table album_photos enable row level security;

create policy "public read album"
    on album_photos for select using (true);

create policy "public insert album"
    on album_photos for insert with check (true);

create policy "public delete album"
    on album_photos for delete using (true);


-- ═══════════════════════════════════════════════════
--  2. Tabla: guestbook
-- ═══════════════════════════════════════════════════
create table if not exists guestbook (
    id         bigint generated always as identity primary key,
    name       text         not null,
    message    text         not null,
    created_at timestamptz  default now()
);

alter table guestbook enable row level security;

create policy "public read guestbook"
    on guestbook for select using (true);

create policy "public insert guestbook"
    on guestbook for insert with check (true);

create policy "public delete guestbook"
    on guestbook for delete using (true);


-- ═══════════════════════════════════════════════════
--  3. Tabla: rsvps
-- ═══════════════════════════════════════════════════
create table if not exists rsvps (
    id         bigint generated always as identity primary key,
    name       text         not null,
    attendance text         not null,   -- 'si' | 'no'
    guests     int          default 1,
    notes      text,
    created_at timestamptz  default now()
);

alter table rsvps enable row level security;

create policy "public read rsvps"
    on rsvps for select using (true);

create policy "public insert rsvps"
    on rsvps for insert with check (true);

create policy "public delete rsvps"
    on rsvps for delete using (true);
```

## Storage Bucket

1. Ir a **Storage** en el panel de Supabase
2. Crear un nuevo bucket llamado: `album`
3. Marcar como **Public** (acceso público para leer las URLs)

## Eso es todo — el sitio ya está listo 🎉
