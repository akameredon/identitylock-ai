-- IdentityLock AI visual media management foundation.
-- Safe additive migration: does not alter existing tables, buckets, objects, or published homepage content.
-- Apply only after reviewing the live schema and confirming the existing admin_users policy contract.

create extension if not exists pgcrypto;

create table if not exists public.identitylock_media_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default 'general',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.identitylock_media_items (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/gif')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  width integer,
  height integer,
  alt_text text not null default '',
  tags text[] not null default '{}',
  category text not null default 'general',
  content_hash text,
  perceptual_hash text,
  metadata jsonb not null default '{}'::jsonb,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists identitylock_media_items_category_idx on public.identitylock_media_items(category);
create index if not exists identitylock_media_items_created_at_idx on public.identitylock_media_items(created_at desc);
create index if not exists identitylock_media_items_hash_idx on public.identitylock_media_items(content_hash) where content_hash is not null;

create table if not exists public.identitylock_comparison_pairs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.identitylock_media_projects(id) on delete cascade,
  original_media_id uuid not null references public.identitylock_media_items(id) on delete restrict,
  transformed_media_id uuid not null references public.identitylock_media_items(id) on delete restrict,
  title text not null default '',
  description text not null default '',
  disclaimer text not null default '',
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint identitylock_pair_distinct_images check (original_media_id <> transformed_media_id)
);

create index if not exists identitylock_comparison_pairs_project_order_idx
  on public.identitylock_comparison_pairs(project_id, sort_order);

create table if not exists public.identitylock_media_versions (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.identitylock_media_items(id) on delete cascade,
  storage_path text not null,
  version_number integer not null check (version_number > 0),
  change_note text not null default '',
  crop jsonb not null default '{}'::jsonb,
  is_current boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(media_id, version_number)
);

create table if not exists public.identitylock_publication_snapshots (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  snapshot jsonb not null,
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('manual','pre_publish','scheduled_restore'))
);

create table if not exists public.identitylock_media_backups (
  id uuid primary key default gen_random_uuid(),
  backup_type text not null check (backup_type in ('daily','pre_publish','manual')),
  status text not null default 'pending' check (status in ('pending','complete','failed')),
  manifest jsonb not null default '{}'::jsonb,
  storage_bytes bigint not null default 0 check (storage_bytes >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null
);

-- Admin access follows the existing Admin Studio allow-list table.
-- Public readers may read only published projects and their comparison pair metadata.
alter table public.identitylock_media_projects enable row level security;
alter table public.identitylock_media_items enable row level security;
alter table public.identitylock_comparison_pairs enable row level security;
alter table public.identitylock_media_versions enable row level security;
alter table public.identitylock_publication_snapshots enable row level security;
alter table public.identitylock_media_backups enable row level security;

drop policy if exists identitylock_projects_admin_all on public.identitylock_media_projects;
create policy identitylock_projects_admin_all on public.identitylock_media_projects
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists identitylock_projects_public_published on public.identitylock_media_projects;
create policy identitylock_projects_public_published on public.identitylock_media_projects
  for select to anon, authenticated using (status = 'published');

drop policy if exists identitylock_media_items_admin_all on public.identitylock_media_items;
create policy identitylock_media_items_admin_all on public.identitylock_media_items
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists identitylock_pairs_admin_all on public.identitylock_comparison_pairs;
create policy identitylock_pairs_admin_all on public.identitylock_comparison_pairs
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists identitylock_pairs_public_published on public.identitylock_comparison_pairs;
create policy identitylock_pairs_public_published on public.identitylock_comparison_pairs
  for select to anon, authenticated using (
    exists (
      select 1 from public.identitylock_media_projects p
      where p.id = project_id and p.status = 'published'
    )
  );

drop policy if exists identitylock_versions_admin_all on public.identitylock_media_versions;
create policy identitylock_versions_admin_all on public.identitylock_media_versions
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists identitylock_snapshots_admin_all on public.identitylock_publication_snapshots;
create policy identitylock_snapshots_admin_all on public.identitylock_publication_snapshots
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists identitylock_backups_admin_all on public.identitylock_media_backups;
create policy identitylock_backups_admin_all on public.identitylock_media_backups
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

comment on table public.identitylock_media_projects is 'IdentityLock visual portfolio projects; publication is controlled by status.';
comment on table public.identitylock_media_items is 'Metadata catalogue for objects stored in the existing identitylock-media bucket.';
comment on table public.identitylock_comparison_pairs is 'Atomic before/after pairs; original and transformed media remain independently versioned.';
comment on table public.identitylock_publication_snapshots is 'Immutable JSON snapshots for previewable homepage/gallery restoration.';
comment on table public.identitylock_media_backups is 'Backup manifests and lifecycle metadata; does not itself copy Storage objects.';
