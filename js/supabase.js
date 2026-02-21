/**
 * supabase.js
 * Cliente centralizado de Supabase.
 * Importar desde cualquier módulo que necesite acceso a la base de datos o al Storage.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://prhllminpmxwseyxunir.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaGxsbWlucG14d3NleXh1bmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MTE5NDYsImV4cCI6MjA4NzI4Nzk0Nn0.HC8XtQnZyH9nixr1mIF0kd7Ra2DXmPrumBGoYKSQhl0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
