-- ============================================================
-- Routine recurrence presets and custom rules
-- ============================================================

alter table routines
  add column if not exists recurrence jsonb;

alter table routines
  drop constraint if exists routines_frequency_check,
  add constraint routines_frequency_check check (
    frequency in (
      'daily',
      'weekdays',
      'weekends',
      'mwf',
      'weekly_sun',
      'weekly_mon',
      'weekly_tue',
      'weekly_wed',
      'weekly_thu',
      'weekly_fri',
      'weekly_sat'
    )
  );
