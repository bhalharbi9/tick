(function () {
  if (!window.supabase || !window.APP_CONFIG) {
    console.error("Supabase or APP_CONFIG is missing.");
    return;
  }
  window.db = window.supabase.createClient(
    window.APP_CONFIG.SUPABASE_URL,
    window.APP_CONFIG.SUPABASE_ANON_KEY
  );
})();
