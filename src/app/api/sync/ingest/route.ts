import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

let supabaseClient: any = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("[ingest] Supabase URL or Key is missing. Using fallback for compilation.");
    }

    supabaseClient = createClient(
      supabaseUrl || "https://placeholder-project.supabase.co",
      supabaseKey || "placeholder-anon-key"
    );
  }
  return supabaseClient;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
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
