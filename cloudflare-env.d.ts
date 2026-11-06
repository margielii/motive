declare namespace Cloudflare {
  interface Env {
    ASSETS?: Fetcher;
    MOTIVE_INSTANCE?: string;
    MOTIVE_BOOTSTRAP?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
