// JSON file store with a Mongoose-like collection API.
// Swap for real MongoDB later: each collection mirrors a Mongoose model's
// find / findOne / create / deleteOne / updateOne surface, so routes stay unchanged.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "db.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {
    return { users: [], outfits: [], clothing: [] };
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
    find(query = {}) {
      return db[name].filter((d) => matches(d, query));
    },
    findOne(query = {}) {
      return db[name].find((d) => matches(d, query)) ?? null;
    },
    findById(id) {
      return db[name].find((d) => d._id === id) ?? null;
    },
    create(doc) {
      const record = { _id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...doc };
      db[name].push(record);
      save(db);
      return record;
    },
    updateOne(query, changes) {
      const doc = this.findOne(query);
      if (!doc) return null;
      Object.assign(doc, changes, { updatedAt: new Date().toISOString() });
      save(db);
      return doc;
    },
    deleteOne(query) {
      const idx = db[name].findIndex((d) => matches(d, query));
      if (idx === -1) return false;
      db[name].splice(idx, 1);
      save(db);
      return true;
    },
    insertMany(docs) {
      const records = docs.map((doc) => ({ _id: crypto.randomUUID(), ...doc }));
      db[name].push(...records);
      save(db);
      return records;
    },
    count() {
      return db[name].length;
    },
  };
}

export const Users = collection("users");
export const Outfits = collection("outfits");
export const Clothing = collection("clothing");
