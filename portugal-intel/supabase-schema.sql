-- Portugal Intel MVP schema
-- Run in Supabase SQL editor after enabling Supabase Auth.

create extension if not exists pgcrypto;

create table if not exists watch_topics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  slug text not null,
  display_name text not null,
  purpose_zh text,
  priority integer not null default 50,
  portuguese_keywords text[] not null default '{}',
  english_keywords text[] not null default '{}',
  entity_aliases text[] not null default '{}',
  web_search_templates text[] not null default '{}',
  youtube_search_templates text[] not null default '{}',
  domain_boosts text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, slug)
);

create table if not exists entities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  slug text not null,
  canonical_name text not null,
  aliases text[] not null default '{}',
  entity_type text,
  country text,
  priority integer not null default 50,
  active_search boolean not null default true,
  discovered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, slug)
);

create table if not exists publishers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  domain text,
  source_tier integer not null default 4,
  publisher_type text,
  created_at timestamptz not null default now(),
  unique(owner_id, domain)
);

create table if not exists search_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  run_type text not null,
  topic_id uuid references watch_topics(id),
  provider text not null,
  query text,
  status text not null default 'running',
  coverage_family text,
  candidate_count integer not null default 0,
  read_count integer not null default 0,
  event_count integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  search_run_id uuid references search_runs(id),
  publisher_id uuid references publishers(id),
  canonical_url text not null,
  original_url text not null,
  source_type text not null,
  title_original text not null,
  summary_zh text,
  publisher_name text,
  source_tier integer not null default 4,
  language text,
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  topic_slugs text[] not null default '{}',
  relevance_score integer,
  extraction_status text not null default 'metadata_only',
  extraction_error text,
  youtube_video_id text,
  youtube_channel_id text,
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, canonical_url),
  unique(owner_id, youtube_video_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  market text not null default 'PT',
  title_zh text not null,
  fact_zh text not null,
  why_it_matters_zh text,
  event_type text not null,
  topic_slugs text[] not null default '{}',
  entity_ids uuid[] not null default '{}',
  event_date date,
  first_published_at timestamptz not null,
  first_discovered_at timestamptz not null default now(),
  freshness_class text not null,
  change_type text not null,
  importance_score integer not null,
  confidence numeric,
  primary_source_id uuid references sources(id),
  related_prior_event_ids uuid[] not null default '{}',
  change_summary_zh text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists event_sources (
  event_id uuid not null references events(id) on delete cascade,
  source_id uuid not null references sources(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  role text not null default 'supporting',
  evidence_note text,
  evidence_timestamp_seconds integer,
  created_at timestamptz not null default now(),
  primary key (event_id, source_id)
);

create table if not exists memory_nodes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  node_type text not null,
  slug text not null,
  display_name text not null,
  state_json jsonb not null,
  summary_zh text,
  supporting_event_ids uuid[] not null default '{}',
  uncertainty_flags text[] not null default '{}',
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(owner_id, node_type, slug)
);

create table if not exists digests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  digest_date date not null,
  market_timezone text not null default 'Europe/Lisbon',
  delivery_timezone text not null default 'Asia/Shanghai',
  period_start timestamptz not null,
  period_end timestamptz not null,
  coverage_state text not null,
  status text not null default 'draft',
  subject text,
  body_md text,
  body_html text,
  digest_json jsonb,
  email_to text,
  email_provider_id text,
  generated_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, digest_date)
);

alter table watch_topics enable row level security;
alter table entities enable row level security;
alter table publishers enable row level security;
alter table search_runs enable row level security;
alter table sources enable row level security;
alter table events enable row level security;
alter table event_sources enable row level security;
alter table memory_nodes enable row level security;
alter table digests enable row level security;
