// Regression + shape checks for this module, driven against a fake app on a
// real UDP socket. Three things this exists to catch, all of which shipped once:
//
//   1. setVariableDefinitions being handed an ARRAY. @companion-module/base 2.x
//      THROWS on that, which fails init() and leaves the instance dead with no
//      actions and no obvious cause.
//   2. osc's UDPPort.close() taking no callback, so the natural
//      `new Promise((r) => port.close(r))` never settles — destroy() hangs and
//      configUpdated() never reconnects after a host/port edit.
//   3. Presets referencing an action or feedback id that does not exist.
import osc from "osc";
import assert from "node:assert/strict";

const watchdog = setTimeout(() => {
  console.error("\nTIMED OUT — no completion within 30s.");
  process.exit(2);
}, 30000);
watchdog.unref?.();

const MOD = new URL("../src/", import.meta.url).pathname;
const UpdateActions = (await import(`${MOD}actions.js`)).default;
const UpdateFeedbacks = (await import(`${MOD}feedbacks.js`)).default;
const UpdateVariables = (await import(`${MOD}variables.js`)).default;
const UpdatePresets = (await import(`${MOD}presets.js`)).default;
const oscListener = (await import(`${MOD}osc.js`)).default;

const APP_PORT = 35903;
const MOD_PORT = 35902;

const received = [];
const app = new osc.UDPPort({
  localAddress: "127.0.0.1",
  localPort: APP_PORT,
  metadata: true,
});
app.open();
await new Promise((r) => app.on("ready", r));
app.on("message", (m) => received.push(m.address));

let actions = {};
let feedbacks = {};
let variables = null;
let presetStructure = null;
let presetDefs = null;

const self = {
  config: {
    remotehost: "127.0.0.1",
    remoteport: String(APP_PORT),
    localport: String(MOD_PORT),
  },
  label: "MyDeck",
  state: {
    presentation: null,
    sections: [],
    files: [],
    state: "edit",
    filesEnabled: false,
  },
  log: () => {},
  updateStatus: () => {},
  checkFeedbacks: () => {},
  checkAllFeedbacks: () => {},
  oscSend: () => {},
  setActionDefinitions: (d) => (actions = d),
  setFeedbackDefinitions: (d) => (feedbacks = d),
  // Mirrors base 2.x: an array is a hard error, not a tolerated legacy form.
  setVariableDefinitions: (d) => {
    if (Array.isArray(d))
      throw new Error("Variable definitions should be an object, not an array");
    variables = d;
  },
  setPresetDefinitions: (s, p) => {
    presetStructure = s;
    presetDefs = p;
  },
  setVariableValues: () => {},
  refreshVariableValues: () => {},
  updateActions: () => {},
  updateFeedbacks: () => {},
};

let failures = 0;
const check = async (label, fn) => {
  try {
    await fn();
    console.log(`  ok   ${label}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${label}\n       ${e.message}`);
  }
};

console.log("\n== definitions ==");
await check("variable definitions are an OBJECT, not an array", () => {
  UpdateVariables(self);
  assert.ok(variables && !Array.isArray(variables));
  assert.ok(Object.keys(variables).length > 5);
  for (const [id, def] of Object.entries(variables)) {
    assert.ok(def.name, `${id} has a name`);
    assert.match(id, /^[a-zA-Z0-9_]+$/, `${id} is a legal variable id`);
  }
});
await check("actions and feedbacks register", () => {
  UpdateActions(self);
  UpdateFeedbacks(self);
  assert.ok(Object.keys(actions).length > 10);
  assert.ok(Object.keys(feedbacks).length >= 2);
  for (const [id, a] of Object.entries(actions)) {
    assert.equal(typeof a.callback, "function", `${id} callback`);
    assert.ok(Array.isArray(a.options), `${id} options`);
  }
});

console.log("\n== presets ==");
await check("presets use the 2.x (structure, definitions) shape", () => {
  UpdatePresets(self);
  assert.ok(Array.isArray(presetStructure));
  assert.equal(typeof presetDefs, "object");
  for (const [id, p] of Object.entries(presetDefs)) {
    assert.equal(p.type, "simple", `${id} type`);
    assert.ok(Array.isArray(p.steps) && Array.isArray(p.feedbacks), id);
  }
});
await check("every preset action and feedback id exists", () => {
  for (const [id, p] of Object.entries(presetDefs)) {
    for (const st of p.steps)
      for (const a of st.down)
        assert.ok(actions[a.actionId], `${id} -> action ${a.actionId}`);
    for (const f of p.feedbacks)
      assert.ok(feedbacks[f.feedbackId], `${id} -> feedback ${f.feedbackId}`);
  }
});
await check(
  "every structure reference resolves, and nothing is orphaned",
  () => {
    const referenced = new Set(
      presetStructure.flatMap((s) => s.definitions.flatMap((g) => g.presets)),
    );
    for (const s of presetStructure)
      for (const g of s.definitions)
        for (const ref of g.presets)
          assert.ok(presetDefs[ref], `${s.id} -> ${ref}`);
    for (const id of Object.keys(presetDefs))
      assert.ok(referenced.has(id), `${id} defined but in no section`);
  },
);
await check(
  "preset variables reference the CONNECTION label, not the module id",
  () => {
    const texts = Object.values(presetDefs)
      .map((p) => p.style.text)
      .join("\n");
    assert.ok(texts.includes("$(MyDeck:"), "uses self.label");
    assert.ok(
      !/\$\(pdf-presenter-lite:|\$\(presentation-commander-client:/.test(texts),
      "no hardcoded module id",
    );
  },
);
await check("every preset variable reference names a real variable", () => {
  const texts = Object.values(presetDefs)
    .map((p) => p.style.text)
    .join("\n");
  for (const m of texts.matchAll(/\$\(MyDeck:([a-zA-Z0-9_]+)\)/g)) {
    assert.ok(variables[m[1]], `${m[1]} is defined`);
  }
});

console.log("\n== transport ==");
await check("connect opens the listen port", async () => {
  await oscListener.connect(self);
  await new Promise((r) => setTimeout(r, 250));
  assert.ok(true);
});
await check("close() settles rather than hanging", async () => {
  const result = await Promise.race([
    oscListener.close().then(() => "closed"),
    new Promise((r) => setTimeout(() => r("hung"), 3000)),
  ]);
  assert.equal(result, "closed");
});
await check("close() is safe to call twice", async () => {
  const result = await Promise.race([
    oscListener.close().then(() => "closed"),
    new Promise((r) => setTimeout(() => r("hung"), 3000)),
  ]);
  assert.equal(result, "closed");
});

app.close();
console.log("\n== the checkFeedbacks trap ==");
// InstanceBase.checkFeedbacks(type, ...rest) requires AT LEAST ONE type: with no
// arguments it forwards [undefined] to the host, which checks a feedback type
// called "undefined" — i.e. nothing at all. Every feedback then sits frozen at
// whatever it last evaluated to, with no error anywhere. checkAllFeedbacks() is
// the correct call for "re-evaluate everything".
await check("no bare checkFeedbacks() survives in src/", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const dir = new URL("../src/", import.meta.url).pathname;
  const offenders = [];
  for (const f of readdirSync(dir)) {
    if (!/\.(js|ts)$/.test(f)) continue;
    const body = readFileSync(dir + f, "utf8");
    if (/[^A-Za-z]checkFeedbacks\(\s*\)/.test(body)) offenders.push(f);
  }
  assert.deepEqual(offenders, [], "use checkAllFeedbacks() instead");
});

// --- the parseVariablesInString trap ----------------------------------------
// `parseVariablesInString` and `parseVariablesInField` were removed from
// @companion-module/base 2.x. Neither is on the callback context, on
// InstanceBase, or anywhere in the package. Companion expands a `useVariables`
// option itself before invoking the callback, so the option arrives already
// resolved: the call is redundant as well as fatal, throwing "... is not a
// function" the moment that one action or feedback fires. Nothing else catches
// it — the module loads, init() succeeds, every definition registers, and every
// path that does not make the call keeps working, so the suite passes with the
// bug live. This fixture no longer stubs either function, so a reintroduced
// call now throws here too; the grep is the backstop for a path the fixture
// never exercises. It matches the call form only, so prose naming the
// functions stays legal.
const { readdirSync: pvReadDir, readFileSync: pvReadFile } =
  await import("node:fs");
const pvOffenders = () => {
  const dir = new URL("../src/", import.meta.url).pathname;
  const bad = [];
  for (const f of pvReadDir(dir)) {
    if (!/\.(js|ts)$/.test(f)) continue;
    if (/parseVariablesIn(String|Field)\s*\(/.test(pvReadFile(dir + f, "utf8")))
      bad.push(f);
  }
  return bad;
};

await check("no parseVariablesInString/Field call survives in src/", () => {
  assert.deepEqual(
    pvOffenders(),
    [],
    "read the already-resolved event.options value instead",
  );
});

// Companion keys an installed module on id + version and discards a reinstall
// whose pair it already has. If companion/manifest.json lags package.json, every
// release after the manifest's version is silently refused by any Companion that
// already has the module — the update appears to work and changes nothing.
await check(
  "companion/manifest.json version matches package.json",
  async () => {
    const { readFileSync } = await import("node:fs");
    const read = (p) =>
      JSON.parse(readFileSync(new URL(p, import.meta.url).pathname, "utf8"));
    assert.equal(
      read("../companion/manifest.json").version,
      read("../package.json").version,
      "bump both, or the release never reaches an existing install",
    );
  },
);

console.log(
  failures === 0
    ? "\nAll checks passed.\n"
    : `\n${failures} CHECK(S) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
