# Presentation Commander Client

Drives a Presentation Commander **Client Node** over OSC — slides and sections
across PDF, Keynote, PowerPoint, Google Slides and Canva, plus black and white
screen, notes, the laser pointer and the watched folder.

## Connection

**Start OSC in the app first**, from the button in its titlebar. It is
remembered after the first time, but until it has been pressed once the Client
Node is not listening and the connection sits there looking broken.

| | default | |
| --- | --- | --- |
| **App host** | `127.0.0.1` | the machine running the Client Node |
| **App listen port** | `35551` | matches the app's own default |
| **Local feedback port** | `35550` | matches the app's own default |

Across two machines, change **App host** to the node's real address **and** point
the app's own *Feedback host* back at the Companion machine. Leaving that at
`127.0.0.1` is the usual reason actions work while nothing ever lights up.

## Moving around a deck

Next and previous, a slide number, first and last — and **sections**, which are
the ones worth putting on a surface. Next section, previous section, or a named
one, with variables for the current section's name, its index and how many
slides remain in it. `current_slide_notes` is there too, if you have a screen to
put it on.

The section and file-open dropdowns list **whatever the app last reported**, and
both accept a custom value with variables in it.

## PowerPoint media

Play, pause, toggle and stop — **Windows only**, and only while PowerPoint is
running its own live slideshow alongside the app. There is no playing/paused
feedback, because PowerPoint's object model has no way to report one; the app can
only ever tell you a duration, which is why `media_duration` exists and a state
variable does not.

## What deliberately has no feedback

No *laser pointer on* and no *auto-advance enabled*: the protocol never
broadcasts either on its own, only the combined edit / running /
running-with-auto-advance-paused state. No `sourceKind` either — the app knows
which kind of deck it is driving, but never says so over OSC. Anything claiming
to show these would be inventing them.
