import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { newId, type Observation } from "@healthtwin/core";
import { createCloudAdapter } from "./adapter";

// Live round-trip against a real Supabase project. Skipped unless all env vars
// are set. Requires a confirmed (or confirmation-disabled) email/password user.
//   SUPABASE_URL, SUPABASE_KEY, SUPABASE_TEST_EMAIL, SUPABASE_TEST_PASSWORD
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_KEY;
const EMAIL = process.env.SUPABASE_TEST_EMAIL;
const PASSWORD = process.env.SUPABASE_TEST_PASSWORD;
const live = Boolean(URL && KEY && EMAIL && PASSWORD);

describe.skipIf(!live)("live supabase round-trip", () => {
  it("pushes and pulls an observation for an authenticated user", async () => {
    const client = createClient(URL!, KEY!);

    let session = (await client.auth.signInWithPassword({ email: EMAIL!, password: PASSWORD! })).data;
    if (!session.user) {
      session = (await client.auth.signUp({ email: EMAIL!, password: PASSWORD! })).data;
    }
    const uid = session.user?.id;
    expect(uid, "no session — is email confirmation disabled / user confirmed?").toBeTruthy();

    const adapter = createCloudAdapter(client);
    const obs: Observation = {
      id: newId(), subjectId: uid!, occurredAt: new Date().toISOString(), createdAt: new Date().toISOString(),
      location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain", intensity: 5,
      taxonomyVersion: "1.0.0", origin: "live-test",
    };

    await adapter.push([obs]);
    const page = await adapter.pull(undefined);
    expect(page.records.some((r) => r.id === obs.id)).toBe(true);
  });
});
