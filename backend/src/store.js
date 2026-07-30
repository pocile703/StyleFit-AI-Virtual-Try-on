// Data store, chosen at boot by whether MONGODB_URI is set.
//
//   unset  -> backend/data/db.json. Zero setup: `docker compose up` and nothing
//             else. This is what local development uses.
//   set    -> MongoDB Atlas. Required in production, where the filesystem is
//             ephemeral and every restart would otherwise wipe accounts and
//             saved outfits.
//
// Both expose the same async collection API (find / findOne / findById /
// create / updateOne / deleteOne / insertMany / count), so no route knows or
// cares which one is running.
import { config } from "./config.js";
import { createJsonStore } from "./store/jsonStore.js";
import { createMongoStore } from "./store/mongoStore.js";

const store = config.mongoUri ? createMongoStore(config.mongoUri) : createJsonStore();

export const storeMode = store.mode;
export const connectStore = () => store.connect();
export const closeStore = () => store.close();

export const Users = store.Users;
export const Outfits = store.Outfits;
export const Clothing = store.Clothing;
