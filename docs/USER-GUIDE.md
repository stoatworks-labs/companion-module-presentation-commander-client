# Companion — Presentation Commander Client user guide

This is a [Bitfocus Companion](https://bitfocus.io/companion) connection module for the
[Presentation Commander Client](https://github.com/stoatworks-labs/presentation-commander-client),
the app that runs on the presentation laptop. It drives slides, sections, Program Out, the laser
pointer and PowerPoint media playback from a Stream Deck, across every source type the Client
supports: PDF, Keynote, PowerPoint, Google Slides and Canva.

> **This is not the module for the Master Server.** Its sibling,
> [companion-module-presentationcommander-server](https://github.com/stoatworks-labs/companion-module-presentationcommander-server),
> controls the separate Master Server over that server's own HTTP automation API (routing,
> scenes, blackout and stage notes). This one is for the Client Node on the presentation laptop.
> Most rigs want both, as two connections.
>
> **This module was built with AI assistance and reviewed by a human.** Check it over before you
> rely on it for a show.

---

## Setting it up

**1. Install the module.** It isn't in the official store, so you have to point Companion at it:

```bash
git clone https://github.com/stoatworks-labs/companion-module-presentation-commander-client
cd companion-module-presentation-commander-client
npm install
```

In Companion, go to **Settings → Developer modules path** and point it at **the parent folder
that contains this repo's folder**, not at the folder itself. Restart Companion, or use "Rescan for
developer modules" if your version has it, and "Presentation Commander Client" turns up as a
connection you can install.

**2. Turn OSC on in the app.** In the Client, click **Start OSC** in the titlebar. Once you've
started it once, it remembers across restarts.

**3. Add the connection**, and set three fields:

| Field                   | Default     | What it is                                                                                 |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| **App host**            | `127.0.0.1` | The machine running the Client Node. The default assumes Companion is on the same machine. |
| **App listen port**     | `35551`     | Where the Client listens. Matches its own default.                                         |
| **Local feedback port** | `35550`     | Where this module listens for the Client's replies. Matches its own default.               |

**If Companion and the Client are on different machines** (and on an actual rig they usually
are, since the Client lives on the presentation laptop), change **App host** to the laptop's IP,
_and_ set the Client's own OSC **Feedback host** to the Companion machine's IP rather than
`127.0.0.1`. Miss that second half and every button works while every variable stays empty.

---

## Actions

**Slides**

| Action                               | What it does              |
| ------------------------------------ | ------------------------- |
| Next slide / Previous slide          | Step through the deck     |
| Go to slide number                   | Jump to an absolute slide |
| Go to first slide / Go to last slide | Ends of the deck          |

**Sections**

| Action                                | What it does            |
| ------------------------------------- | ----------------------- |
| Go to first slide of section          | Jump to a named section |
| Go to first slide of next section     | Skip forward a section  |
| Go to first slide of previous section | Skip back a section     |

The named-section action gives you **a live dropdown of whatever the Client last reported**, plus
a custom value that takes variables, for when you want it to change on the fly.

**Program Out**

| Action                                    | What it does                           |
| ----------------------------------------- | -------------------------------------- |
| Start Program Out from first slide        | Open the output at the top of the deck |
| Start Program Out from current slide      | Open it where you already are          |
| Close Program Out                         | Shut the output                        |
| Toggle black screen / Toggle white screen | Cover the output                       |
| Toggle laser pointer overlay              | Show/hide the pointer                  |
| Set current slide as desktop wallpaper    | For a holding image behind the output  |

**Auto-advance**

| Action                                   | What it does                 |
| ---------------------------------------- | ---------------------------- |
| Pause auto-advance / Resume auto-advance | Hold and release a timed run |

**Media — PowerPoint on Windows only**

| Action                   | What it does         |
| ------------------------ | -------------------- |
| Media: play              | Start embedded media |
| Media: pause             | Pause it             |
| Media: toggle play/pause | One-button transport |
| Media: stop              | Stop it              |

> These four only work **for PowerPoint on Windows**, and **only when the presenter has a live
> PowerPoint slideshow running separately from the app**. On any other source, or on macOS, they
> do nothing.

**Protocol control**

| Action                           | What it does                             |
| -------------------------------- | ---------------------------------------- |
| Enable / Disable OSC actions     | Turn remote control off from the surface |
| Enable / Disable OSC feedback    | Turn the Client's replies off            |
| Request feedback refresh         | Ask the Client to re-send everything     |
| Set watched folder               | Point the Client at a different folder   |
| Request watched-folder file list | Refresh the file dropdown                |
| Open file from watched folder    | Load a deck by name                      |

---

## Feedbacks

Two:

- **Slideshow state:** edit / running / running-with-auto-advance-paused.
- **OSC file access enabled**.

There are three things you might expect and won't find, all for the same reason: the protocol
doesn't carry the data, so a feedback would have to make it up.

- **No laser-pointer-on or auto-advance-enabled feedback.** Only the combined
  edit/running/paused state is broadcast.
- **No media playing/paused/stopped feedback.** The Client's media control only ever sends a
  duration, because PowerPoint's COM object model has no way to report playback state.
- **No `sourceKind` variable.** The Client keeps track internally of whether the current deck is
  PDF, Keynote, PowerPoint, Slides or Canva (it uses that to decide which features apply), but it
  never sends it.

---

## Variables

| Variable                    | Contents                                                     |
| --------------------------- | ------------------------------------------------------------ |
| `presentationName`          | Presentation / file name                                     |
| `filePath`                  | Full path to the open file                                   |
| `slideCount`                | Total slide count                                            |
| `slideCountVisible`         | Total slide count, excluding hidden slides                   |
| `state`                     | Presentation state (edit / running / paused)                 |
| `currentSlide`              | Current slide number                                         |
| `slidesRemaining`           | Slides left in the deck                                      |
| `notes`                     | Current slide's notes                                        |
| `sectionIndex`              | Current section index                                        |
| `sectionName`               | Current section name                                         |
| `sectionSlidesRemaining`    | Slides remaining in the current section                      |
| `previousSectionName`       | Previous section name — "Start of deck" if this is the first |
| `previousSectionFirstSlide` | First slide of the previous section                          |
| `nextSectionName`           | Next section name — "End of deck" if this is the last        |
| `nextSectionFirstSlide`     | First slide of the next section                              |
| `mediaDuration`             | Media duration in seconds                                    |
| `mediaDurationFormatted`    | The same, as mm:ss                                           |
| `fileAccessEnabled`         | Whether OSC file-open access is enabled                      |
| `activeFolder`              | Watched folder, relative to the home directory               |
| `activeFolderFullPath`      | Watched folder, full path                                    |
| `activeFolderFileCount`     | Number of files in the watched folder                        |
| `activeFolderFileNames`     | JSON array of file names in the watched folder               |

`notes` is the one worth building a surface around: a big text button showing
`$(<connection-label>:notes)` turns any Stream Deck into a confidence monitor (a small one, but
still). The prefix is whatever you called the connection in Companion.

---

## Troubleshooting

| Symptom                                | Cause                                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Module doesn't appear in Companion** | The developer modules path points at the repo folder rather than **its parent**.                                 |
| **Buttons work, all variables empty**  | Feedback isn't getting back. The Client's **Feedback host** must be the Companion machine's IP, not `127.0.0.1`. |
| **Nothing happens at all**             | OSC isn't started in the Client, or App host / App listen port is wrong.                                         |
| **Media buttons do nothing**           | Not PowerPoint, not Windows, or no independently-running PowerPoint slideshow.                                   |
| **Section dropdown is empty or stale** | The list is whatever the Client last reported. Fire **Request feedback refresh**.                                |
| **File-open action does nothing**      | File access is disabled in the Client; check the `fileAccessEnabled` variable.                                   |
| **I want routing / scenes / blackout** | Wrong module — that is the Server one.                                                                           |

---

## See also

- [README](../README.md): what it does, installing it, and the prior art I looked at for how to
  structure the module
- [presentation-commander-client](https://github.com/stoatworks-labs/presentation-commander-client):
  the app this controls, and its OSC protocol
- [companion-module-presentationcommander-server](https://github.com/stoatworks-labs/companion-module-presentationcommander-server):
  the sibling module for the Master Server
