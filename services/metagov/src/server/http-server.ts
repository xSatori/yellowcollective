import http from "http";
import { config } from "../config";
import { StateStore } from "../services/state-store";

const sendJson = (
  res: http.ServerResponse,
  statusCode: number,
  data: unknown
) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data, null, 2));
};

export const startHttpServer = (store: StateStore) => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (url.pathname === "/health") {
      return sendJson(res, 200, {
        ok: true,
        dryRun: config.dryRun,
        safeAddress: config.safeAddress,
        snapshotSpaceId: config.snapshotSpaceId,
        stateFile: store.path,
      });
    }

    if (url.pathname === "/state" || url.pathname === "/state-file") {
      return sendJson(res, 200, store.load());
    }

    const proposalMatch = url.pathname.match(/^\/state\/(\d+)$/);
    if (proposalMatch) {
      const state = store.load();
      const proposal = state.proposals[proposalMatch[1]];
      return sendJson(res, proposal ? 200 : 404, proposal || null);
    }

    return sendJson(res, 404, { error: "Not found" });
  });

  server.listen(config.port, () => {
    console.log(`Metagov status server listening on :${config.port}`);
  });

  return server;
};
