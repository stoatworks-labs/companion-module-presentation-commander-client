# AGENTS.md — bringing an LLM up to speed on this Companion module

Orientation for an AI assistant (or a new human) picking this project up cold. There is no
`CLAUDE.md` here; this is the entry point.

---

## 1. What this is

A **Bitfocus Companion connection module** for the **Presentation Commander Client Node** —
the app that runs on the presentation laptop. It lets a running instance be driven from a
**Stream Deck** (or any other Companion surface) across every source type the app supports:
**PDF, Keynote, PowerPoint, Google Slides and Canva**.

JavaScript, Node 22 runtime, `nodejs-ipc` API. Small repo — 15 tracked files, ~730 lines
across `src/`.

## 2. It talks OSC directly to the app — there is no middleware

This is the whole architecture, and the thing to understand first:

```
Companion surface  ──▶  this module  ──UDP OSC 35551──▶  Client Node
                                     ◀──UDP OSC 35550──  (feedback)
```

The app has its own OSC listener. Nothing else is installed on the app side beyond turning
OSC on in its titlebar. So:

- **The protocol is owned by [`presentation-commander-client`](https://github.com/stoatworks-labs/presentation-commander-client), not by this repo.**
  If you change an OSC address or payload there, this module breaks silently — a Stream Deck
  button simply stops working mid-show, with no error anywhere obvious. Change both together.
- Two ports, and they are **not** a request/response pair: 35551 is the app's inbound
  listener, 35550 is where this module listens for the app's feedback. Across machines, the
  app's own "Feedback host" must point back at the Companion machine's IP, not `127.0.0.1`.

## 3. Know which of the three surfaces you are in

| Repo | Controls | Transport |
|---|---|---|
| **companion-module-presentation-commander-client** (this) | the presentation laptop's Client Node | OSC |
| **companion-module-presentationcommander-server** | the Master Server (routing, scenes, notes) | HTTP automation API |
| **companion-module-pdf-presenter-lite** | PDF Presenter Lite, a separate app | OSC |

The **server** module is a different protocol entirely — don't carry assumptions across.

The **pdf-presenter-lite** module is a near-identical sibling of this one: same file layout,
same ports, same defaults. This module is the superset — it adds PowerPoint media transport
and Program Out on top. **Treat "the same bug probably exists in the sibling" as the default
assumption**; a fix to `osc.js` or `variables.js` here is worth checking there in the same
sitting.

## 4. Layout

| File | Role |
|---|---|
| `src/main.js` | `InstanceBase` lifecycle, config fields, wiring |
| `src/actions.js` | The buttons — the bulk of the module |
| `src/feedbacks.js` | Button lighting: slideshow state, OSC file access enabled |
| `src/variables.js` | Text/state exposed to Companion expressions |
| `src/osc.js` | Send/receive, port handling, inbound address parsing |
| `src/choices.js` | Dropdown option lists |
| `src/upgrades.js` | Companion config migrations (currently a stub) |
| `companion/manifest.json` | Module id, version, runtime declaration |

## 5. Deliberate omissions — do not "fix" these

Both are cases where the app does not broadcast the state, so the feedback could only
fabricate it:

- **No laser-pointer-on / auto-advance-enabled feedback.** Only the combined
  edit / running / running-with-auto-advance-paused slideshow state is sent.
- **No `mediaState` (playing/paused/stopped) feedback.** The app's media control only ever
  sends a duration, never a queryable playback state.

If you want these, add the broadcast to the app first.

## 6. Context that matters

This drives live event production. A button press here changes what an audience sees. Prefer
failing safe — don't invent a state to display when the app connection is unknown, and keep
reconnection resilient: a surface that doesn't recover after the app restarts is a dead
surface mid-event.

## 7. Conventions

- Not in the official Companion module store — it installs via **Settings → Developer
  modules path**. Bear that in mind before writing install instructions that assume the store.
- Ships a user-facing AI-assisted disclaimer; review before relying on it in production.
- "Commit" means commit **and** push.
