import { describe, it, expect } from "vitest";
import {
  createSharedFixture,
  foundationSql,
  migrationFiles,
  legacySnapshot,
} from "./support/database";

describe("additive migration in a shared PostgreSQL", () => {
  it("preserves existing schemas, tables, columns, grants, RLS, functions, triggers, defaults and data", async () => {
    const db = await createSharedFixture();
    try {
      const before = await legacySnapshot(db);
      await db.exec(foundationSql);
      expect(await legacySnapshot(db)).toEqual(before);
      // No FK or new trigger on auth.users, even indirectly.
      const fks = await db.query(
        "select 1 from pg_constraint c join pg_class t on t.oid=c.confrelid join pg_namespace n on n.oid=t.relnamespace where c.contype='f' and n.nspname='auth'",
      );
      expect(fks.rows).toHaveLength(0);
    } finally {
      await db.close();
    }
  });

  it("does not automatically enroll shared Auth users or reuse legacy profiles", async () => {
    const db = await createSharedFixture();
    try {
      await db.exec(foundationSql);
      const id = "90000000-0000-4000-8000-000000000002";
      await db.query("insert into auth.users values($1)", [id]);
      expect(
        (
          await db.query(
            "select legacy_note from public.profiles where legacy_id=$1",
            [id],
          )
        ).rows,
      ).toEqual([{ legacy_note: "existing automation" }]);
      await db.exec(
        `select set_config('request.jwt.claim.sub','${id}',false); set role authenticated`,
      );
      for (const table of [
        "profiles",
        "memberships",
        "organizations",
        "membership_roles",
        "roles",
        "permissions",
        "role_permissions",
      ]) {
        expect(
          (await db.query(`select * from youcon_people.${table}`)).rows,
        ).toHaveLength(0);
      }
      expect(
        (
          await db.query(
            "select youcon_people_private.has_permission('10000000-0000-4000-8000-000000000001','home.view') as allowed",
          )
        ).rows,
      ).toEqual([{ allowed: false }]);
      // Previously granted access to legacy profiles is preserved.
      expect(
        (await db.query("select * from public.profiles")).rows,
      ).toHaveLength(2);
    } finally {
      await db.close();
    }
  });

  for (const name of ["youcon_people", "youcon_people_private"]) {
    it(`refuses existing ${name} namespace and rolls back without modifying legacy objects`, async () => {
      const db = await createSharedFixture();
      try {
        await db.exec(
          `create schema ${name}; create table ${name}.sentinel(value text); insert into ${name}.sentinel values('untouched')`,
        );
        const before = await legacySnapshot(db);
        await expect(db.exec(foundationSql)).rejects.toThrow(
          /namespace already exists/,
        );
        await db.exec("rollback");
        expect(await legacySnapshot(db)).toEqual(before);
        expect(
          (await db.query(`select value from ${name}.sentinel`)).rows,
        ).toEqual([{ value: "untouched" }]);
        const other =
          name === "youcon_people" ? "youcon_people_private" : "youcon_people";
        expect(
          (
            await db.query(
              "select nspname from pg_namespace where nspname=$1",
              [other],
            )
          ).rows,
        ).toHaveLength(0);
      } finally {
        await db.close();
      }
    });
  }

  it("rolls back all new objects when a later policy creation fails", async () => {
    const db = await createSharedFixture();
    try {
      await db.exec("alter function auth.uid() rename to fixture_uid_disabled");
      const before = await legacySnapshot(db);
      await expect(db.exec(foundationSql)).rejects.toThrow(/auth.uid/);
      await db.exec("rollback");
      expect(await legacySnapshot(db)).toEqual(before);
      expect(
        (
          await db.query(
            "select nspname from pg_namespace where nspname in ('youcon_people','youcon_people_private')",
          )
        ).rows,
      ).toHaveLength(0);
    } finally {
      await db.close();
    }
  });

  it("does not inherit anonymous or write privileges from global shared-project defaults", async () => {
    const db = await createSharedFixture();
    try {
      await db.exec(foundationSql);
      const privileges = await db.query<{
        anonymous_schema: boolean;
        authenticated_create: boolean;
        table_write: boolean;
        anonymous_function: boolean;
      }>(`select
        has_schema_privilege('anon','youcon_people','usage') as anonymous_schema,
        has_schema_privilege('authenticated','youcon_people','create') as authenticated_create,
        has_table_privilege('authenticated','youcon_people.membership_roles','insert') as table_write,
        has_function_privilege('anon','youcon_people_private.has_permission(uuid,text)','execute') as anonymous_function`);
      expect(privileges.rows[0]).toEqual({
        anonymous_schema: false,
        authenticated_create: false,
        table_write: false,
        anonymous_function: false,
      });
    } finally {
      await db.close();
    }
  });

  it("aborts on unexpected grants from shared defaults to another application role", async () => {
    const db = await createSharedFixture();
    try {
      await db.exec(
        "create role legacy_consumer; alter default privileges grant all on schemas to legacy_consumer; alter default privileges grant all on tables to legacy_consumer; alter default privileges grant all on functions to legacy_consumer",
      );
      const before = await legacySnapshot(db);
      await expect(db.exec(foundationSql)).rejects.toThrow(
        /Unexpected inherited grants/,
      );
      await db.exec("rollback");
      expect(await legacySnapshot(db)).toEqual(before);
      expect(
        (
          await db.query(
            "select nspname from pg_namespace where nspname in ('youcon_people','youcon_people_private')",
          )
        ).rows,
      ).toHaveLength(0);
    } finally {
      await db.close();
    }
  });

  it("keeps the incompatible original migration out of the executable migration chain", () => {
    expect(migrationFiles).toHaveLength(1);
    expect(migrationFiles[0]).toMatch(/shared_database_foundation\.sql$/);
    expect(foundationSql).not.toMatch(
      /(?:alter|create|drop)\s+(?:table|function|trigger|policy)\s+(?:public|private|auth|storage)\./i,
    );
  });
});
