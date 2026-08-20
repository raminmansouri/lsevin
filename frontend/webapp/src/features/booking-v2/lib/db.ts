// booking-v2 used to open its own `postgres()` pool here, with an unguarded
// `debug()` hook that printed every statement *and its parameters* to stdout —
// not gated on NODE_ENV, so it would have done that in production too, putting
// booking payloads into the container logs. Nothing imports this module today,
// which is the only reason it never did.
//
// It now re-exports the one shared pool (@/config/database/db) so that if the
// module is ever wired up it inherits the pooling, prepare and logging settings
// that the rest of the app uses, and connects through PgBouncer like everything
// else rather than opening a second pool of its own.
export { default as sql } from "@/config/database/db";
