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

  it("lets an admin update feedback status and persists the change", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "civic-voice-"));
    const db = await createDb(path.join(directory, "db.json"));
    const app = await createApp({ db });
    const id = db.data.feedback[0].id;

    const response = await request(app)
      .patch(`/api/feedback/${id}/status`)
      .set("x-user-role", "admin")
      .send({ status: "In review" });

    expect(response.status).toBe(200);
    expect(response.body.feedback.status).toBe("In review");

    const reloadedDb = await createDb(path.join(directory, "db.json"));
    expect(reloadedDb.data.feedback[0].status).toBe("In review");
  });

  it("rejects unauthorized, invalid, and missing status updates", async () => {
    const app = await testApp();
    const unauthenticated = await request(app).patch("/api/feedback/example/status").send({ status: "Closed" });
    const invalid = await request(app)
      .patch("/api/feedback/example/status")
      .set("x-user-role", "admin")
      .send({ status: "Archived" });
    const missing = await request(app)
      .patch("/api/feedback/example/status")
      .set("x-user-role", "admin")
      .send({ status: "Closed" });

    expect(unauthenticated.status).toBe(403);
    expect(invalid.status).toBe(400);
    expect(missing.status).toBe(404);
  });
});
