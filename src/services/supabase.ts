import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://rwskutansimyvhbqiurd.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3c2t1dGFuc2lteXZoYnFpdXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NjUxMzMsImV4cCI6MjA4NTE0MTEzM30.1pytg74Brl2ECrtWndXa-eMHWHuqjPdj44Z133Bezmc';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
