alter table public.generated_project_plans
add column if not exists build_model_json jsonb;

comment on column public.generated_project_plans.build_model_json is
  'Optional Boardsmith Build Model JSON stored with a generated plan version. Null preserves compatibility with older generated plans.';
