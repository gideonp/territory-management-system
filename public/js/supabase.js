
/**
 * TERRITORY MANAGEMENT
 * Supabase connection
 */

const SUPABASE_URL = "https://sgsqdksouwanxgwkbmou.supabase.co";

const SUPABASE_KEY = "sb_publishable_KhETDpomP7UJRdEwDiYhnw_tt7_790V";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase connected successfully!");
