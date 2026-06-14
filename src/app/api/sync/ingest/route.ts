import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

let supabaseClient: any = null;

function getSupabaseClient(authHeader?: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey && supabaseUrl) {
    // If the backend has a service role key, we can use it to bypass RLS safely on the server
    if (!supabaseClient) {
      supabaseClient = createClient(supabaseUrl, serviceRoleKey);
    }
    return supabaseClient;
  }

  // Fallback: Use the user's personal session JWT from the request header to authenticate
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[ingest] Supabase URL or Key is missing. Using fallback for compilation.");
  }

  return createClient(
    supabaseUrl || "https://placeholder-project.supabase.co",
    supabaseKey || "placeholder-anon-key",
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = getSupabaseClient(authHeader);
    const body = await req.json();
    const { userId, transaction } = body;

    if (!userId || !transaction) {
      return NextResponse.json({ error: "Missing userId or transaction" }, { status: 400 });
    }

    const { name, amount, category, type } = transaction;
    if (!name || !amount || !category || !type) {
      return NextResponse.json({ error: "Incomplete transaction fields" }, { status: 400 });
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      name,
      amount: Number(amount),
      category,
      type,
      date: new Date().toISOString(),
    });

    if (error) {
      console.error("[ingest] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[ingest] error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
