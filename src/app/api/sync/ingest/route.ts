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
    const { userId, transaction, isBudgetSet } = body;

    if (!userId || !transaction) {
      return NextResponse.json({ error: "Missing userId or transaction" }, { status: 400 });
    }

    const { name, amount, category, type, availableBalance } = transaction;
    if (!name || !amount || !category || !type) {
      return NextResponse.json({ error: "Incomplete transaction fields" }, { status: 400 });
    }

    let finalCategory = category;
    let finalName = name;

    if (transaction.cardDigits) {
      const cardSuffix = transaction.bank ? `${transaction.bank} ${transaction.cardDigits}` : `Card ${transaction.cardDigits}`;
      finalName = `${name} (${cardSuffix})`;
    }

    const { error: insertError } = await supabase.from("transactions").insert({
      user_id: userId,
      name: finalName,
      amount: Number(amount),
      category: finalCategory,
      type,
      date: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[ingest] Supabase error:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Handle available balance sync if provided in the transaction metadata
    if (availableBalance !== undefined && availableBalance !== null) {
      const targetBalance = Number(availableBalance);
      if (!isNaN(targetBalance)) {
        const { data: allTxs, error: fetchError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId);

        if (!fetchError && allTxs) {
          const adjustmentTx = allTxs.find((t: any) => t.name === "Starting Balance Adjustment");
          let S = 0;
          allTxs.forEach((t: any) => {
            if (t.name !== "Starting Balance Adjustment") {
              if (t.type === "income") S += Number(t.amount);
              else S -= Number(t.amount);
            }
          });

          const newAmountSigned = targetBalance - S;
          const newAmount = Math.abs(newAmountSigned);
          const newType = newAmountSigned >= 0 ? "income" : "expense";

          if (adjustmentTx) {
            const { error: updateError } = await supabase
              .from("transactions")
              .update({
                amount: newAmount,
                type: newType,
                date: "1970-01-01T00:00:00.000Z",
              })
              .eq("id", adjustmentTx.id);
            if (updateError) {
              console.error("[ingest] Error updating Starting Balance Adjustment:", updateError.message);
            }
          } else {
            const { error: adjustInsertError } = await supabase
              .from("transactions")
              .insert({
                user_id: userId,
                name: "Starting Balance Adjustment",
                category: "Savings",
                amount: newAmount,
                type: newType,
                date: "1970-01-01T00:00:00.000Z",
              });
            if (adjustInsertError) {
              console.error("[ingest] Error inserting Starting Balance Adjustment:", adjustInsertError.message);
            }
          }
        } else if (fetchError) {
          console.error("[ingest] Fetch error:", fetchError.message);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[ingest] error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
