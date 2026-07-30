/**
 * Express 4 does not catch a rejected promise from an `async` route handler.
 * The rejection escapes to the process, and Node's default for an unhandled
 * rejection is to exit — so one database hiccup takes the whole API down
 * rather than returning a 500 for the one request that hit it.
 *
 * Wrap every async handler in this. The error reaches the error middleware in
 * server.js, which is where it belongs.
 */
export const route = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
