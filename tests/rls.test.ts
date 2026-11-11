import type { PGlite } from "@electric-sql/pglite";
import { createSharedFixture, foundationSql } from "./support/database";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
// All identities below are synthetic test fixtures, never production seeds.
const orgA = "10000000-0000-4000-8000-000000000001",
  orgB = "10000000-0000-4000-8000-000000000002";
const ids = {
  professional: "20000000-0000-4000-8000-000000000001",
  leadership: "20000000-0000-4000-8000-000000000002",
  hr: "20000000-0000-4000-8000-000000000003",
  director: "20000000-0000-4000-8000-000000000004",
  inactive: "20000000-0000-4000-8000-000000000005",
  intern: "20000000-0000-4000-8000-000000000006",
  pj: "20000000-0000-4000-8000-000000000007",
};
let db: PGlite;
async function actAs(id: string) {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`,
  );
}
async function allowed(organization: string, permission: string) {
  const result = await db.query<{ allowed: boolean }>(
    "select youcon_people_private.has_permission($1,$2) as allowed",
    [organization, permission],
  );
  return result.rows[0].allowed;
}
beforeAll(async () => {
  db = await createSharedFixture();
  await db.exec(foundationSql);
  await db.query(
    "insert into youcon_people.organizations(id,name,slug) values ($1,'Test organization A','test-a'),($2,'Test organization B','test-b')",
    [orgA, orgB],
  );
  let index = 0;
  for (const [role, id] of Object.entries(ids)) {
    const member = `30000000-0000-4000-8000-${String(++index).padStart(12, "0")}`;
    await db.query("insert into auth.users values($1)", [id]);
    await db.query(
      "insert into youcon_people.profiles(user_id,display_name) values($1,$2)",
      [id, `Fixture ${role}`],
    );
    await db.query(
      "insert into youcon_people.memberships(id,organization_id,user_id,contract_type,active) values($1,$2,$3,$4,$5)",
      [
        member,
        orgA,
        id,
        role === "pj" ? "pj" : role === "intern" ? "intern" : "clt",
        role !== "inactive",
      ],
    );
    await db.query(
      "insert into youcon_people.membership_roles(membership_id,user_id,role_code) values($1,$2,$3)",
      [
        member,
        id,
        ["inactive", "intern", "pj"].includes(role) ? "professional" : role,
      ],
    );
  }
});
afterAll(async () => {
  await db.close();
});
describe("Postgres RLS and grants", () => {
  it("enables RLS on every People foundation table", async () => {
    await db.exec("reset role");
    const result = await db.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='youcon_people' and c.relkind='r'",
    );
    expect(result.rows).toHaveLength(7);
    expect(result.rows.every((r) => r.relrowsecurity)).toBe(true);
  });
  for (const role of ["professional", "leadership", "intern", "pj"] as const)
    it(`${role} has home but no managerial access`, async () => {
      await actAs(ids[role]);
      expect(await allowed(orgA, "home.view")).toBe(true);
      expect(await allowed(orgA, "people.management.view")).toBe(false);
      expect(await allowed(orgA, "people.dashboard.view")).toBe(false);
    });
  for (const role of ["hr", "director"] as const)
    it(`${role} has both managerial permissions only in own organization`, async () => {
      await actAs(ids[role]);
      expect(await allowed(orgA, "people.management.view")).toBe(true);
      expect(await allowed(orgA, "people.dashboard.view")).toBe(true);
      expect(await allowed(orgB, "people.management.view")).toBe(false);
    });
  it("isolates organizations, memberships and personal profiles", async () => {
    await actAs(ids.hr);
    expect(
      (await db.query("select * from youcon_people.organizations")).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("select * from youcon_people.memberships")).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("select * from youcon_people.profiles")).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query(
          "select * from youcon_people.organizations where id=$1",
          [orgB],
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("inactive membership has no organization or permission", async () => {
    await actAs(ids.inactive);
    expect(await allowed(orgA, "home.view")).toBe(false);
    expect(
      (await db.query("select * from youcon_people.organizations")).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select * from youcon_people.membership_roles")).rows,
    ).toHaveLength(0);
  });
  it("prevents self-escalation and access mutations", async () => {
    await actAs(ids.professional);
    await expect(
      db.exec("update youcon_people.memberships set active=true"),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.exec("update youcon_people.membership_roles set role_code='hr'"),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.exec(
        "insert into youcon_people.role_permissions values('professional','people.management.view')",
      ),
    ).rejects.toThrow(/permission denied/);
  });
  it("rejects managerial grants to leadership even for privileged provisioning", async () => {
    await db.exec("reset role");
    await expect(
      db.exec(
        "insert into youcon_people.role_permissions values('leadership','people.management.view')",
      ),
    ).rejects.toThrow(/managerial_permissions_only_hr_director/);
  });
  it("prevents linking a role assignment to a different user", async () => {
    await db.exec("reset role");
    await expect(
      db.query(
        "insert into youcon_people.membership_roles(membership_id,user_id,role_code) select id,$1,'hr' from youcon_people.memberships where user_id=$2",
        [ids.hr, ids.professional],
      ),
    ).rejects.toThrow(/foreign key/);
  });
  it("accumulates roles only in the assigned membership", async () => {
    await db.exec("reset role");
    await db.query(
      "insert into youcon_people.membership_roles(membership_id,user_id,role_code) select id,user_id,'hr' from youcon_people.memberships where user_id=$1",
      [ids.leadership],
    );
    await actAs(ids.leadership);
    expect(await allowed(orgA, "people.management.view")).toBe(true);
    expect(await allowed(orgB, "people.management.view")).toBe(false);
    await db.exec("reset role");
    await db.query(
      "delete from youcon_people.membership_roles where user_id=$1 and role_code='hr'",
      [ids.leadership],
    );
  });
  it("keeps roles scoped to each organization when the same user belongs to both", async () => {
    await db.exec("reset role");
    const membership = "30000000-0000-4000-8000-000000000099";
    await db.query(
      "insert into youcon_people.memberships(id,organization_id,user_id,contract_type) values($1,$2,$3,'pj')",
      [membership, orgB, ids.hr],
    );
    await db.query(
      "insert into youcon_people.membership_roles(membership_id,user_id,role_code) values($1,$2,'professional')",
      [membership, ids.hr],
    );
    await actAs(ids.hr);
    expect(await allowed(orgA, "people.management.view")).toBe(true);
    expect(await allowed(orgB, "home.view")).toBe(true);
    expect(await allowed(orgB, "people.management.view")).toBe(false);
    expect(await allowed(orgB, "people.dashboard.view")).toBe(false);
  });
  it("revocation takes effect without JWT role refresh", async () => {
    await actAs(ids.hr);
    expect(await allowed(orgA, "people.management.view")).toBe(true);
    await db.exec("reset role");
    await db.query(
      "update youcon_people.memberships set active=false where user_id=$1",
      [ids.hr],
    );
    await actAs(ids.hr);
    expect(await allowed(orgA, "people.management.view")).toBe(false);
  });
  it("denies unauthenticated table access", async () => {
    await db.exec(
      "reset role; select set_config('request.jwt.claim.sub','',false); set role anon;",
    );
    await expect(
      db.exec("select * from youcon_people.organizations"),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.exec("select * from youcon_people.profiles"),
    ).rejects.toThrow(/permission denied/);
  });
});
