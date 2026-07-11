import serverless from "serverless-http";
import { app } from "../../server/app";

const serverlessHandler = serverless(app);

// Depending on how Netlify invokes this function, event.path may show up as
// either the rewritten internal path ("/.netlify/functions/api/player") or
// the original request path before rewriting ("/api/player"). Express's own
// routes are defined at the root ("/player", etc), so strip whichever known
// prefix is actually present before handing off.
const KNOWN_PREFIXES = ["/.netlify/functions/api", "/api"];

export const handler = async (event: any, context: any) => {
  if (typeof event.path === "string") {
    for (const prefix of KNOWN_PREFIXES) {
      if (event.path.startsWith(prefix)) {
        event.path = event.path.slice(prefix.length) || "/";
        break;
      }
    }
  }
  return serverlessHandler(event, context);
};

