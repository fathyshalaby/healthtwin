import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { newId, type Observation } from "@healthtwin/core";
import { createCloudAdapter } from "./adapter";

// Decisive RLS boundary test against a live project. Skipped unless two seeded,
// confirmed users are provided:
//   SUPABASE_URL, SUPABASE_KEY, RLS_A_EMAIL/RLS_A_PASSWORD, RLS_B_EMAIL/RLS_B_PASSWORD
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_KEY;
const A = { email: process.env.RLS_A_EMAIL, password: process.env.RLS_A_PASSWORD };
const B = { email: process.env.RLS_B_EMAIL, password: process.env.RLS_B_PASSWORD };
const live = Boolean(URL && KEY && A.email && A.password && B.email && B.password);

async function signedClient(email: string, password: string) {
  const client = createClient(URL!, KEY!, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`sign-in failed: ${error?.message ?? "no user"}`);
  return { client, uid: data.user.id };
}

describe.skipIf(!live)("RLS boundary", () => {
  it("user B cannot read user A's observations", async () => {
    const a = await signedClient(A.email!, A.password!);
    const obs: Observation = {
      id: newId(), subjectId: a.uid, occurredAt: new Date().toISOString(), createdAt: new Date().toISOString(),
      location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain", taxonomyVersion: "1.0.0", origin: "rls-test",
    };
    await createCloudAdapter(a.client).push([obs]);

    const b = await signedClient(B.email!, B.password!);
    const { data } = await b.client.from("observations").select("id").eq("subject_id", a.uid);
    expect(data ?? []).toEqual([]); // RLS denies cross-user reads
  });
});
