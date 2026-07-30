// MongoDB-backed store. Same interface as the JSON one, so routes never learn
// which is running.
//
// `_id` stays the `crypto.randomUUID()` string the JSON store already used
// rather than becoming an ObjectId — every route, JWT subject and saved-outfit
// reference already treats it as an opaque string, and converting would leak
// Mongo types into code that has no business knowing about them.
import crypto from "node:crypto";
import { MongoClient } from "mongodb";

const DEFAULT_DB = "stylefit";

// The driver returns `null` for a missing document already, and `find()` gives
// a cursor — everything else lines up with the JSON store one-to-one.
function collection(getDb, name) {
  const col = () => getDb().collection(name);
  return {
    async find(query = {}) {
      return col().find(query).toArray();
    },
    async findOne(query = {}) {
      return col().findOne(query);
    },
    async findById(id) {
      return col().findOne({ _id: id });
    },
    async create(doc) {
      const record = {
        _id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...doc,
      };
      await col().insertOne(record);
      return record;
    },
    async updateOne(query, changes) {
      const result = await col().findOneAndUpdate(
        query,
        { $set: { ...changes, updatedAt: new Date().toISOString() } },
        { returnDocument: "after" }
      );
      return result ?? null;
    },
    async deleteOne(query) {
      const { deletedCount } = await col().deleteOne(query);
      return deletedCount > 0;
    },
    async insertMany(docs) {
      const records = docs.map((doc) => ({ _id: crypto.randomUUID(), ...doc }));
      await col().insertMany(records);
      return records;
    },
    async count() {
      return col().countDocuments();
    },
  };
}

export function createMongoStore(uri) {
  let client = null;
  let database = null;

  const getDb = () => {
    if (!database) throw new Error("Store used before connect()");
    return database;
  };

  return {
    mode: "mongo",
    async connect() {
      if (database) return;
      client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 });
      await client.connect();
      // A database in the URI path wins; otherwise fall back to a known name so
      // the connection string can be copied straight out of Atlas.
      const fromUri = new URL(uri.replace("mongodb+srv://", "https://")).pathname.slice(1);
      database = client.db(fromUri || DEFAULT_DB);

      // Registration checks this on every sign-up, and a duplicate email would
      // otherwise be possible under a race the JSON store can't have.
      await database.collection("users").createIndex({ email: 1 }, { unique: true });
      await database.collection("outfits").createIndex({ userId: 1 });
    },
    async close() {
      await client?.close();
      client = null;
      database = null;
    },
    Users: collection(getDb, "users"),
    Outfits: collection(getDb, "outfits"),
    Clothing: collection(getDb, "clothing"),
  };
}
