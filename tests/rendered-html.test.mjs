import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);
const previewRoot = new URL("../app/_sites-preview/", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the AI Escape Room shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>AI Escape Room<\/title>/i);
  assert.match(html, /AI Escape Room/);
  assert.match(html, /Generate a playable escape room/);
  assert.match(html, /Generate adventure/);
  assert.match(html, /Educational source/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("removes starter preview artifacts", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<AdventureSetup \/>/);
  assert.match(layout, /title:\s*"AI Escape Room"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /_sites-preview|codex-preview/);
  assert.doesNotMatch(layout, /codex-preview|_sites-preview|themeColor|\bViewport\b/);

  await assert.rejects(access(previewRoot));
  await assert.rejects(access(new URL("public/_sites-preview", templateRoot)));
});
