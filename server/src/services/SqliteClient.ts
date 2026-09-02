import { Context, Effect, Layer } from "effect";
import { Database } from "bun:sqlite";
import fs from "fs";
import path from "path";
import { DatabaseError } from "shared/dist";

interface TableColumnInfo {
  name: string;
}

export class SqliteClient extends Context.Service<SqliteClient, {
  readonly db: Database;
  readonly queryAll: <T>(sql: string, params?: unknown[]) => Effect.Effect<T[], DatabaseError>;
  readonly queryOne: <T>(sql: string, params?: unknown[]) => Effect.Effect<T | null, DatabaseError>;
  readonly run: (sql: string, params?: unknown[]) => Effect.Effect<{ changes: number }, DatabaseError>;
  readonly exec: (sql: string) => Effect.Effect<void, DatabaseError>;
}>()("server/SqliteClient") {
  static readonly layer = Layer.sync(SqliteClient, () => {
    const dbPath = path.join(__dirname, "../db/classroom.sqlite");
    const dbExists = fs.existsSync(dbPath);
    const db = new Database(dbPath, { create: true });

    db.exec("PRAGMA foreign_keys = ON;");
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA busy_timeout = 5000;");

    if (!dbExists) {
      const schemaFile = fs.existsSync(path.join(__dirname, "../db/schema.sql"))
        ? path.join(__dirname, "../db/schema.sql")
        : path.join(__dirname, "../../src/db/schema.sql");
      const schema = fs.readFileSync(schemaFile, "utf-8");
      db.exec(schema);
    } else {
      // Run migrations
      // SAFETY: PRAGMA table_info returns column metadata list
      const teachersInfo = db.prepare("PRAGMA table_info(teachers)").all() as TableColumnInfo[];
      if (!teachersInfo.some((c) => c.name === "role")) {
        db.exec("ALTER TABLE teachers ADD COLUMN role TEXT DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin'))");
        db.exec("CREATE INDEX IF NOT EXISTS idx_teachers_role ON teachers(role)");
      }
      // SAFETY: PRAGMA table_info returns column metadata list
      const studentsInfo = db.prepare("PRAGMA table_info(students)").all() as TableColumnInfo[];
      if (!studentsInfo.some((c) => c.name === "role")) {
        db.exec("ALTER TABLE students ADD COLUMN role TEXT DEFAULT 'student' CHECK (role IN ('student'))");
      }
    }

    const queryAll = <T>(sql: string, params: unknown[] = []) =>
      Effect.try({
        try: () => {
          const stmt = db.query(sql);
          // SAFETY: SQLite query returns array of rows matching generic type T
          return stmt.all(...(params as (string | number | boolean | null)[])) as T[];
        },
        catch: (error) => new DatabaseError({ message: String(error), cause: error })
      });

    const queryOne = <T>(sql: string, params: unknown[] = []) =>
      Effect.try({
        try: () => {
          const stmt = db.query(sql);
          // SAFETY: SQLite query parameter list cast to Bun supported SQLite primitives
          const res = stmt.get(...(params as (string | number | boolean | null)[]));
          // SAFETY: SQLite get returns single matching row or null cast to T
          return (res ?? null) as T | null;
        },
        catch: (error) => new DatabaseError({ message: String(error), cause: error })
      });

    const run = (sql: string, params: unknown[] = []) =>
      Effect.try({
        try: () => {
          const stmt = db.query(sql);
          // SAFETY: SQLite query parameter list cast to Bun supported SQLite primitives
          const res = stmt.run(...(params as (string | number | boolean | null)[]));
          return { changes: res.changes };
        },
        catch: (error) => new DatabaseError({ message: String(error), cause: error })
      });

    const exec = (sql: string) =>
      Effect.try({
        try: () => {
          db.exec(sql);
        },
        catch: (error) => new DatabaseError({ message: String(error), cause: error })
      });

    return SqliteClient.of({
      db,
      queryAll,
      queryOne,
      run,
      exec
    });
  });
}
