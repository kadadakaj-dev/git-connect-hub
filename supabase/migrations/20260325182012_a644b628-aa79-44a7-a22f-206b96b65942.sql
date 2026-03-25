DO $$
DECLARE
  _key text;
BEGIN
  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF _key IS NULL THEN
    RAISE EXCEPTION 'Service role key not found in vault';
  END IF;

  PERFORM cron.schedule(
    'send-booking-reminders-daily',
    '0 * * * *',
    format(
      $q$
      SELECT net.http_post(
        url:='https://bqoeopfgivbvyhonkree.supabase.co/functions/v1/send-booking-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer %s"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
      $q$,
      _key
    )
  );
END;
$$;