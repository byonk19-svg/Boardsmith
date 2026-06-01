do $migration$
begin
  execute $definition$
    create or replace function public.save_generated_plan_atomic(
      p_project_id uuid,
      p_plan_id uuid,
      p_created_at timestamptz,
      p_model_name text,
      p_plan_json jsonb,
      p_build_model_json jsonb,
      p_plan_markdown text,
      p_warnings jsonb,
      p_assumptions jsonb,
      p_confidence_level text
    )
    returns setof public.generated_project_plans
    language plpgsql
    as $function$
    declare
      inserted_plan public.generated_project_plans;
    begin
      update public.generated_project_plans
      set is_latest = false
      where project_id = p_project_id
        and is_latest = true;

      insert into public.generated_project_plans (
        id,
        project_id,
        created_at,
        model_name,
        plan_json,
        build_model_json,
        plan_markdown,
        validation_status,
        warnings,
        assumptions,
        confidence_level,
        is_latest
      )
      values (
        p_plan_id,
        p_project_id,
        p_created_at,
        p_model_name,
        p_plan_json,
        p_build_model_json,
        p_plan_markdown,
        'valid',
        p_warnings,
        p_assumptions,
        p_confidence_level,
        true
      )
      returning * into inserted_plan;

      update public.projects
      set
        status = 'plan_generated',
        updated_at = p_created_at
      where id = p_project_id;

      if not found then
        raise exception 'Project % not found while saving generated plan', p_project_id
          using errcode = 'foreign_key_violation';
      end if;

      return next inserted_plan;
    end;
    $function$
  $definition$;

  execute $definition$
    revoke all on function public.save_generated_plan_atomic(
      uuid,
      uuid,
      timestamptz,
      text,
      jsonb,
      jsonb,
      text,
      jsonb,
      jsonb,
      text
    ) from public, anon, authenticated
  $definition$;

  execute $definition$
    grant execute on function public.save_generated_plan_atomic(
      uuid,
      uuid,
      timestamptz,
      text,
      jsonb,
      jsonb,
      text,
      jsonb,
      jsonb,
      text
    ) to service_role
  $definition$;
end;
$migration$;
