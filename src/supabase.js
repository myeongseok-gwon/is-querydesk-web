// Supabase client for synced per-user data (streams / external papers / pins).
// Auth uses the Clerk session token (Clerk is connected as a Supabase
// Third-Party Auth provider); Row-Level Security keys every row to the Clerk
// user id, so the anon/publishable key is safe in the static bundle.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key, {
  accessToken: async () => {
    try {
      return (await window.Clerk?.session?.getToken()) ?? null;
    } catch {
      return null;
    }
  },
});

const uid = () => window.Clerk?.user?.id;

// ---- streams ----
export async function listStreams() {
  const { data, error } = await supabase
    .from("streams").select("*").order("position").order("created_at");
  if (error) throw error;
  return data;
}
export async function createStream(name, query = "", filters = {}) {
  const { data, error } = await supabase
    .from("streams")
    .insert({ user_id: uid(), name, query, filters })
    .select().single();
  if (error) throw error;
  return data;
}
export async function updateStream(id, fields) {
  const { data, error } = await supabase
    .from("streams")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteStream(id) {
  const { error } = await supabase.from("streams").delete().eq("id", id);
  if (error) throw error;
}

// ---- external papers ----
export async function listExternals(streamId) {
  const { data, error } = await supabase
    .from("external_papers").select("*")
    .eq("stream_id", streamId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function addExternal(streamId, rec) {
  const { data, error } = await supabase
    .from("external_papers")
    .insert({ user_id: uid(), stream_id: streamId, ...rec })
    .select().single();
  if (error) throw error;
  return data;
}
export async function deleteExternal(id) {
  const { error } = await supabase.from("external_papers").delete().eq("id", id);
  if (error) throw error;
}

// ---- pins ----
export async function listPins(streamId) {
  const { data, error } = await supabase.from("pins").select("*").eq("stream_id", streamId);
  if (error) throw error;
  return data;
}
export async function addPin(streamId, paperId, col) {
  const { error } = await supabase
    .from("pins")
    .upsert({ user_id: uid(), stream_id: streamId, paper_id: paperId, col },
            { onConflict: "stream_id,paper_id" });
  if (error) throw error;
}
export async function removePin(streamId, paperId) {
  const { error } = await supabase
    .from("pins").delete().eq("stream_id", streamId).eq("paper_id", paperId);
  if (error) throw error;
}
