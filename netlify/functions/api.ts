import serverless from "serverless-http";
import { app } from "../../server/app";

const serverlessHandler = serverless(app);

// Netlify rewrites /api/* to /.netlify/functions/api/:splat (see netlify.toml),
// but the function still receives that full internal path. Strip it back down
// to the plain route (e.g. "/player") before handing off to Express, which
// defines its routes at the root (app.get("/player", ...), etc).
const FUNCTION_PREFIX = "/.netlify/functions/api";

export const handler = async (event: any, context: any) => {
  if (typeof event.path === "string" && event.path.startsWith(FUNCTION_PREFIX)) {
    event.path = event.path.slice(FUNCTION_PREFIX.length) || "/";
  }
  return serverlessHandler(event, context);
};
