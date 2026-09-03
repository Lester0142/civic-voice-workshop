import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createDb } from "./lib/db.js";

async function testApp() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "civic-voice-"));
  const db = await createDb(path.join(directory, "db.json"));
  return createApp({ db });
}

describe("CivicVoice baseline API", () => {
  it("creates a missing datastore directory on first use", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "civic-voice-"));
    const db = await createDb(path.join(directory, "missing", "data", "db.json"));
    expect(db.data.users).toHaveLength(2);
  });

  it("logs in the seeded citizen", async () => {
    const app = await testApp();
    const response = await request(app).post("/api/login").send({
      nric: "S0000001A", password: "citizen123", role: "citizen",
    });
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("citizen");
  });

  it("accepts feedback", async () => {
    const app = await testApp();
    const response = await request(app).post("/api/feedback").send({
      nric: "S0000001A", name: "Aisha Rahman", message: "Please add more benches.",
    });
    expect(response.status).toBe(201);
    expect(response.body.feedback.message).toBe("Please add more benches.");
  });

  it("blocks the feedback list without the admin role header", async () => {
    const app = await testApp();
    const response = await request(app).get("/api/feedback");
    expect(response.status).toBe(403);
  });

  it("returns all stored fields for one feedback item to an admin", async () => {
    const app = await testApp();
    const response = await request(app)
      .get("/api/feedback/fb-seed-1")
      .set("x-user-role", "admin");

    expect(response.status).toBe(200);
    expect(response.body.feedback).toMatchObject({
      id: "fb-seed-1",
      nric: "S0000001A",
      name: "Aisha Rahman",
      category: "General",
      status: "New",
    });
    expect(response.body.feedback.message).toContain("sheltered walkway");
  });

  it("does not expose individual feedback to non-admins or for unknown ids", async () => {
    const app = await testApp();
    const forbidden = await request(app).get("/api/feedback/fb-seed-1");
    const missing = await request(app)
      .get("/api/feedback/not-a-feedback-id")
      .set("x-user-role", "admin");

    expect(forbidden.status).toBe(403);
    expect(missing.status).toBe(404);
  });
});
