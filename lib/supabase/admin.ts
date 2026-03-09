import { createClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/public-env";
import { serverEnv } from "@/lib/server-env";

export const supabaseAdmin = createClient(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
