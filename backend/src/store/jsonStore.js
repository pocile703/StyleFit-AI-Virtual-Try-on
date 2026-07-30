// File-backed store: the whole database is one JSON file held in memory and
// rewritten on every mutation. Zero setup, which is what `docker compose up`
// with no accounts anywhere depends on.
//
// The methods are async only so that this and the MongoDB store present the
// same interface to the routes — nothing here actually awaits.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "..", "data", "db.json");

const EMPTY = { users: [], outfits: [], clothing: [] };

function load() {
  try {
    return { ...EMPTY, ...JSON.parse(fs.readFileSync(DB_PATH, "utf8")) };
  } catch {
    return structuredClone(EMPTY);
  }
}

function save(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

let db = load();

function matches(doc, query) {
  return Object.entries(query).every(([k, v]) => doc[k] === v);
}

function collection(name) {
  return {
    async find(query = {}) {
      return db[name].filter((d) => matches(d, query));
    },
    async findOne(query = {}) {
      return db[name].find((d) => matches(d, query)) ?? null;
    },
    async findById(id) {
      return db[name].find((d) => d._id === id) ?? null;
    },
    async create(doc) {
      const record = {
        _id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...doc,
      };
      db[name].push(record);
      save(db);
      return record;
    },
    async updateOne(query, changes) {
      const doc = db[name].find((d) => matches(d, query));
      if (!doc) return null;
      Object.assign(doc, changes, { updatedAt: new Date().toISOString() });
      save(db);
      return doc;
    },
    async deleteOne(query) {
      const idx = db[name].findIndex((d) => matches(d, query));
      if (idx === -1) return false;
      db[name].splice(idx, 1);
      save(db);
      return true;
    },
    async insertMany(docs) {
      const records = docs.map((doc) => ({ _id: crypto.randomUUID(), ...doc }));
      db[name].push(...records);
      save(db);
      return records;
    },
    async count() {
      return db[name].length;
    },
  };
}

export function createJsonStore() {
  return {
    mode: "json",
    async connect() {
      db = load();
    },
    async close() {},
    Users: collection("users"),
    Outfits: collection("outfits"),
    Clothing: collection("clothing"),
  };
}
