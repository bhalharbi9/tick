
-- =========================
-- UCL Predictions Schema
-- Supabase / PostgreSQL
-- =========================

create extension if not exists "pgcrypto";

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(),
  round_name text not null default 'دور الـ16',
  team_home text not null,
  team_away text not null,
  kickoff timestamptz not null,
  first_leg_home_goals int,
  first_leg_away_goals int,
  actual_home_goals int,
  actual_away_goals int,
  lock_minutes_before int not null default 10,
  probable_home_lineup text,
  probable_away_lineup text,
  home_last5 jsonb not null default '[]'::jsonb,
  away_last5 jsonb not null default '[]'::jsonb,
  match_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  pred_home_goals int not null check (pred_home_goals >= 0 and pred_home_goals <= 20),
  pred_away_goals int not null check (pred_away_goals >= 0 and pred_away_goals <= 20),
  points int not null default 0,
  distance int not null default 999,
  exact_hit boolean not null default false,
  close_hit boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (participant_id, fixture_id)
);

create table if not exists public.rewards (
  rank_no int primary key,
  reward_text text not null,
  amount numeric(10,2) not null default 0,
  is_active boolean not null default true
);

insert into public.rewards(rank_no, reward_text, amount)
values
  (1, 'المركز الأول', 30),
  (2, 'المركز الثاني', 20),
  (3, 'المركز الثالث', 10)
on conflict (rank_no) do update
set reward_text = excluded.reward_text,
    amount = excluded.amount,
    is_active = true;

create or replace view public.leaderboard_view as
select
  p.id as participant_id,
  p.full_name,
  coalesce(sum(pr.points), 0) as total_points,
  coalesce(sum(case when pr.exact_hit then 1 else 0 end), 0) as exact_scores_count,
  coalesce(sum(case when pr.close_hit then 1 else 0 end), 0) as close_hits_count,
  coalesce(sum(pr.distance), 0) as total_distance,
  count(pr.id) as predictions_count
from public.participants p
left join public.predictions pr on pr.participant_id = p.id
group by p.id, p.full_name
order by
  total_points desc,
  exact_scores_count desc,
  close_hits_count desc,
  total_distance asc,
  full_name asc;

alter table public.participants enable row level security;
alter table public.fixtures enable row level security;
alter table public.predictions enable row level security;
alter table public.rewards enable row level security;

-- المشاركون: قراءة وإضافة وتعديل مفتوح لمسابقات بسيطة
drop policy if exists participants_select on public.participants;
create policy participants_select on public.participants
for select using (true);

drop policy if exists participants_insert on public.participants;
create policy participants_insert on public.participants
for insert with check (true);

drop policy if exists participants_update on public.participants;
create policy participants_update on public.participants
for update using (true);

-- المباريات والجوائز: قراءة للجميع، تعديل للمشرف المسجّل دخول
drop policy if exists fixtures_select on public.fixtures;
create policy fixtures_select on public.fixtures
for select using (true);

drop policy if exists fixtures_insert_admin on public.fixtures;
create policy fixtures_insert_admin on public.fixtures
for insert to authenticated with check (true);

drop policy if exists fixtures_update_admin on public.fixtures;
create policy fixtures_update_admin on public.fixtures
for update to authenticated using (true);

drop policy if exists fixtures_delete_admin on public.fixtures;
create policy fixtures_delete_admin on public.fixtures
for delete to authenticated using (true);

drop policy if exists rewards_select on public.rewards;
create policy rewards_select on public.rewards
for select using (true);

drop policy if exists rewards_admin_all on public.rewards;
create policy rewards_admin_all on public.rewards
for all to authenticated using (true) with check (true);

-- التوقعات: قراءة وإضافة وتعديل مفتوح
drop policy if exists predictions_select on public.predictions;
create policy predictions_select on public.predictions
for select using (true);

drop policy if exists predictions_insert on public.predictions;
create policy predictions_insert on public.predictions
for insert with check (true);

drop policy if exists predictions_update on public.predictions;
create policy predictions_update on public.predictions
for update using (true);

drop policy if exists predictions_delete_admin on public.predictions;
create policy predictions_delete_admin on public.predictions
for delete to authenticated using (true);

-- Trigger لتحديث updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_predictions_updated_at on public.predictions;
create trigger trg_predictions_updated_at
before update on public.predictions
for each row execute function public.set_updated_at();

-- بيانات تجريبية اختيارية (احذف التعليق إذا أردت)
-- insert into public.fixtures(team_home, team_away, kickoff, first_leg_home_goals, first_leg_away_goals, lock_minutes_before, sort_order)
-- values
-- ('برشلونة', 'نيوكاسل يونايتد', '2026-03-18 17:45:00+00', 2, 1, 10, 1),
-- ('ليفربول', 'غلطة سراي', '2026-03-18 20:00:00+00', 1, 0, 10, 2),
-- ('أتلتيكو مدريد', 'توتنهام هوتسبر', '2026-03-18 20:00:00+00', 2, 5, 10, 3),
-- ('بايرن ميونخ', 'أتالانتا', '2026-03-18 20:00:00+00', 6, 1, 10, 4);
