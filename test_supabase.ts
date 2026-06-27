import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://tqmkivmfjarmgqihvbtm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWtpdm1mamFybWdxaWh2YnRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ5MTE1NiwiZXhwIjoyMDkxMDY3MTU2fQ.9ICAi4Dbz0v8d7wPS6-51dFl3cN0hKE8i7mnrFj8Ib4"
);

async function test() {
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) {
    console.error("Auth error:", userErr);
    return;
  }
  const userId = users.users[0].id;
  console.log("Testing for user:", userId);

  // Fetch a transaction
  const { data: txs, error: txErr } = await supabase.from("transactions").select("*").eq("user_id", userId).limit(1);
  if (txErr || !txs.length) {
    console.error("Tx err:", txErr);
    return;
  }
  
  const txId = txs[0].id;
  console.log("Testing tx:", txId, txs[0].name);

  // Assign Category Logic (Simulate)
  console.log("Updating tx...");
  const { data, error } = await supabase.from("transactions").update({
    category: "Food & Dining",
    needs_review: false,
    suggested_category: null,
  }).eq("id", txId).select().single();

  if (error) {
    console.error("Assign Error:", error);
  } else {
    console.log("Assign Success:", data);
  }
}

test();
