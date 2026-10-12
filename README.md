# companion-module-presentation-commander-client

> **AI-assisted project.** This module was created with [Claude](https://claude.com/claude-code)
> (Anthropic), directed and reviewed by a human author. Check it over before you rely on it for
> a show.

A [Bitfocus Companion](https://bitfocus.io/companion) module for
[presentation-commander-client](https://github.com/stoatworks-labs/presentation-commander-client),
so you can run the app from a Stream Deck (or any other Companion surface) over
its OSC control protocol, whatever kind of source it's showing: PDF, Keynote,
PowerPoint, Google Slides or Canva.

It talks straight to the app's own OSC listener (UDP, port 35551 by default)
and listens for feedback on a local port (35550 by default). There's nothing
extra to install on the app end: you turn OSC on in its titlebar, and that's it.
It's a sibling of
[companion-module-presentationcommander-server](https://github.com/stoatworks-labs/companion-module-presentationcommander-server),
which controls the separate Master Server over that server's own HTTP automation
API. This one is for the Client Node on the presentation laptop.

<!-- downloads:start -->

## Download

**[v1.1.3](https://github.com/stoatworks-labs/companion-module-presentation-commander-client/releases/tag/v1.1.3)**

This release contains:

- [`companion-module-presentation-commander-client-pkg.tgz`](https://github.com/stoatworks-labs/companion-module-presentation-commander-client/releases/latest/download/companion-module-presentation-commander-client-pkg.tgz) — npm package, 54 KB
- [`presentation-commander-client-1.1.3.tgz`](https://github.com/stoatworks-labs/companion-module-presentation-commander-client/releases/download/v1.1.3/presentation-commander-client-1.1.3.tgz) — npm package, 54 KB

All builds, checksums and release notes: [github.com/stoatworks-labs/companion-module-presentation-commander-client/releases](https://github.com/stoatworks-labs/companion-module-presentation-commander-client/releases).

<!-- downloads:end -->

## What it does

- **Actions:** Next/Previous slide, go to a slide number, go to the first/last
  slide, go to a named section (or the next/previous section), start/stop
  Program Out, toggle black/white screen, toggle the laser pointer overlay,
  set the current slide as the desktop wallpaper, pause/resume timed
  auto-advance, PowerPoint media play/pause/toggle/stop, enable/disable OSC
  actions or feedback, ask for a feedback refresh, set the watched folder,
  ask for its file list, and open a file from it by name.
- **Feedbacks:** _Slideshow state_ (edit / running / running-with-auto-advance-paused)
  and _OSC file access enabled_.
- **Variables:** presentation/file name, full path, slide count (total and
  visible), state, current slide, slides remaining, current slide notes,
  current section index/name/slides-remaining, derived previous/next
  section name and first slide, media duration (seconds and formatted
  mm:ss), file-access-enabled, watched folder (relative and full path), and
  the watched folder's file count/name list.
- The section and file-open actions give you a live dropdown of whatever the
  app last reported, plus a custom value that takes variables, for when you
  want it to change on the fly.

What I've left out on purpose:

- A feedback for the laser pointer being on or for auto-advance being enabled.
  The app's OSC protocol never broadcasts either as a value of its own (it
  only sends the combined edit/running/paused slideshow state).
- A `mediaState` (playing/paused/stopped) feedback. The app's media control
  only ever sends a duration, never a playback state you can query, because
  PowerPoint's COM object model has no way to report one. Media control itself
  only works for PowerPoint on Windows, and only when the presenter has a live
  PowerPoint slideshow running separately from the app.
- A `sourceKind` variable. The app tracks it internally to decide which
  features are available for the current source, but never broadcasts it over
  OSC, so there's nothing to expose.

## Setup

1. Install and enable this module in Companion (see **Installing** below).
2. In Presentation Commander Client, click **Start OSC** in the titlebar
   (once you've started it once, it remembers across restarts).
3. Add a new connection using this module, and set:
   - **App host:** the machine running the Client Node (default
     `127.0.0.1`, meaning Companion's on the same machine).
   - **App listen port:** default `35551`, which matches the app's own default.
   - **Local feedback port:** default `35550`, which matches the app's own
     default.
4. If Companion and the app are on different machines, change **App
   host** to the app's actual IP, and make sure "Feedback host" in the app's
   OSC settings panel points back at the Companion machine's IP (not
   `127.0.0.1`).

## Installing

This module isn't in the official Companion module store. The quick way is to
download `companion-module-presentation-commander-client-pkg.tgz` from the
[releases page](https://github.com/stoatworks-labs/companion-module-presentation-commander-client/releases) and import it with Companion's
**Modules → Import module package**. Or install it as a developer module:

1. Clone this repo, then `npm install`.
2. In Companion, go to **Settings → Developer modules path** and point it
   at the parent folder that contains this repo's folder.
3. Restart Companion (or use its "Rescan for developer modules" action, if
   your version has it), and "Presentation Commander Client" turns up as a
   connection module you can install.

## Inspiration & prior art

- **[companion-module-zinc-oscpoint](https://github.com/bitfocus/companion-module-zinc-oscpoint)**:
  the official, MIT-licensed Companion module for OSCPoint. Its source
  (`main.js`/`config.js`/`actions.js`/`feedbacks.js`/`variables.js`/
  `osc-listener.js`/`presets.js`) was read in full, before this module was
  written from scratch, to learn what a working Bitfocus Companion module
  looks like: the `InstanceBase` lifecycle, config field shapes,
  `self.oscSend`, and how actions/feedbacks/variables/presets get registered.
  None of its code is reused here. Every address string, variable and helper
  in this repo is written against Presentation Commander Client's own protocol
  (renamed, and no longer OSCPoint-branded), and the file and function names
  are different throughout. It showed how a Companion module is put together,
  and that's all it was used for; no code was copied from it.
- **OSCPoint, benkuper/PowerPoint-OSC, leonreucher/powerpoint-remote-websocket,
  and Iris Down Remote Show Control:** see
  [presentation-commander-client's own README](https://github.com/stoatworks-labs/presentation-commander-client#inspiration--prior-art)
  for how these shaped the app whose protocol this module speaks.

## Project Setup

```bash
npm install
npm run format   # prettier
npm run package  # builds a distributable module package
```

## What changed

### 1.1.3

**Installed from the release package, the module crashed on load.** Companion showed
_Connection is not running_, kept restarting it, and the log said
`Cannot find module '../package.json'`. The About block at the bottom of the
connection's config panel read `package.json` relative to its own source file,
which is fine in a checkout and wrong once the module's bundled for release.
Every packaged release since the About block arrived had it; a checkout on the
developer modules path didn't, which is how it went unnoticed. The About block
now finds what it needs either way and can't stop the module loading.

### 1.1.2

**Four actions threw an error the moment they fired:** _Go to slide number_,
_Go to first slide of section_, _Set watched folder_ and _Open file from watched
folder_. They called `parseVariablesInField`, which `@companion-module/base` 2.x
doesn't have, while the module loaded and tracked state as normal. Companion
fills in those fields' variables before the action runs anyway, so the call's
gone.

Also in this release: `@companion-module/base` 2.1.3 and `@companion-module/tools` 3.1.0.

### 1.1.1

Packaging only; the module's code didn't change.

- **The release package couldn't be installed.**
  `companion-module-presentation-commander-client-pkg.tgz` was made by
  re-tarring the build tool's staging folder, which put `package.json` one
  folder down from where Companion looks. It's now a copy of the archive
  `companion-module-build` makes, and both archives are checked for
  `package.json` and `companion/manifest.json` at their root before a release
  goes out.
- **The help button has a page behind it**: the module ships `companion/HELP.md`.

### 1.1.0

**Two bugs that made this module fail against `@companion-module/base` 2.x:**

- `setVariableDefinitions` was being handed an array. Base 2.x throws
  `Variable definitions should be an object, not an array` outright, which fails
  `init()` and leaves the connection dead, with no actions, no feedbacks and no
  obvious cause. It's now the object form the API wants.
- `osc`'s `UDPPort.close()` doesn't take a callback, so the
  `new Promise((r) => port.close(r))` this used never settled. `destroy()` hung,
  and `configUpdated()` never got past the close to reconnect, so editing the
  host or port killed the instance until you restarted Companion. It now waits
  for the port's `close` event, with a timeout.

**New: presets.** Ready-made button banks with their feedbacks and variables
already wired up.

**New: `npm test`**, a regression harness that runs the module's actual code
against a pretend app on a real UDP socket, and covers both bugs and the presets.

<!-- attributions:start -->
This project is built on other people's work — see [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
<!-- attributions:end -->
