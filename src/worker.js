// Static files are served straight from public/ by Cloudflare. Only /api/* runs this code (see run_worker_first).
import { handleFinish } from "./finish.js";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/finish") return handleFinish(request, env);
    return env.ASSETS.fetch(request); // anything else under /api/ is a 404 from the assets
  },
};
