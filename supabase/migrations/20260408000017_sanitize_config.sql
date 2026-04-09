-- SANITIZATION: Deduplicate time_slots_config
DELETE FROM public.time_slots_config 
WHERE id NOT IN (
  SELECT DISTINCT ON (day_of_week) id 
  FROM public.time_slots_config 
  ORDER BY day_of_week, is_active DESC, created_at DESC
);
