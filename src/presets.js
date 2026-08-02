// Variable references in preset text use `self.label`, the CONNECTION's label,
// not the module id. Companion resolves $(label:variable) against whatever the
// operator named this connection — hardcoding the module id produces buttons
// that render the raw $(...) text on any connection that has been renamed, and
// on a second instance of the same module.
// Presets are a starting layout, not a fixed one — an operator drags one onto a
// button and then edits it.
//
// Two constraints shaped what is here:
//
//  * Only two feedbacks exist (slideshow state, and file access enabled),
//    because those are the only two things the app broadcasts. Presets for the
//    laser pointer and auto-advance therefore ship WITHOUT lighting — the app
//    never sends either as a standalone value, and a button that lit from a
//    value this module had guessed would lie during exactly the moment it
//    matters. See AGENTS.md; adding the feedback means adding the broadcast to
//    the app first.
//
//  * Section navigation is driven by variables the app does publish, so the
//    next/previous section buttons can carry the section NAME on their face.
//    That is the difference between a usable deck-navigation page and eight
//    identical grey squares.

const WHITE = 0xffffff;
const BLACK = 0x000000;
const GREY = 0x333333;
const RED = 0xcc0000;
const AMBER = 0xcc7a00;
const GREEN = 0x009900;
const DARKGREEN = 0x003300;
const BRIGHTGREEN = 0x00ff00;

function preset({
  name,
  text,
  size = "14",
  color = WHITE,
  bgcolor = GREY,
  actions = [],
  feedbacks = [],
}) {
  return {
    type: "simple",
    name,
    style: { text, size, color, bgcolor, show_topbar: false },
    steps: [{ down: actions, up: [] }],
    feedbacks,
  };
}

export default function UpdatePresets(self) {
  const presets = {};

  // --- Navigation ----------------------------------------------------------
  presets.next = preset({
    name: "Next slide",
    text: `NEXT\n$(${self.label}:currentSlide)/$(${self.label}:slideCount)`,
    size: "18",
    bgcolor: GREEN,
    actions: [{ actionId: "next", options: {} }],
  });
  presets.previous = preset({
    name: "Previous slide",
    text: "PREV",
    size: "18",
    actions: [{ actionId: "previous", options: {} }],
  });
  presets.first = preset({
    name: "First slide",
    text: "FIRST",
    actions: [{ actionId: "goto_first_slide", options: {} }],
  });
  presets.last = preset({
    name: "Last slide",
    text: "LAST",
    actions: [{ actionId: "goto_last_slide", options: {} }],
  });
  presets.goto = preset({
    name: "Go to a slide number (edit it)",
    text: "GO TO\nSLIDE 1",
    actions: [{ actionId: "goto_slide", options: { slideNumber: 1 } }],
  });
  presets.slide_display = preset({
    name: "Slide counter (no action)",
    text: `$(${self.label}:currentSlide) / $(${self.label}:slideCount)\n$(${self.label}:slidesRemaining) left`,
    bgcolor: BLACK,
  });

  // --- Sections ------------------------------------------------------------
  presets.section_next = preset({
    name: "Next section (shows its name)",
    text: `SECTION >\n$(${self.label}:nextSectionName)`,
    actions: [{ actionId: "goto_next_section", options: {} }],
  });
  presets.section_previous = preset({
    name: "Previous section (shows its name)",
    text: `< SECTION\n$(${self.label}:previousSectionName)`,
    actions: [{ actionId: "goto_previous_section", options: {} }],
  });
  presets.section_display = preset({
    name: "Current section (no action)",
    text: `$(${self.label}:sectionName)\n$(${self.label}:sectionSlidesRemaining) left`,
    bgcolor: BLACK,
    color: AMBER,
  });
  presets.section_goto = preset({
    name: "Go to a named section (edit the name)",
    text: "SECTION\n(edit)",
    actions: [{ actionId: "goto_section", options: { sectionName: "" } }],
  });

  // --- The output window ---------------------------------------------------
  presets.start_top = preset({
    name: "Start the Output window from the top",
    text: "START\nFROM TOP",
    bgcolor: BLACK,
    actions: [{ actionId: "start_slideshow_top", options: {} }],
    feedbacks: [
      {
        feedbackId: "slideshowState",
        options: { state: "running" },
        style: { bgcolor: GREEN, color: WHITE },
      },
    ],
  });
  presets.start_current = preset({
    name: "Start the Output window at the current slide",
    text: "START\nHERE",
    bgcolor: BLACK,
    actions: [{ actionId: "start_slideshow_current", options: {} }],
    feedbacks: [
      {
        feedbackId: "slideshowState",
        options: { state: "running" },
        style: { bgcolor: GREEN, color: WHITE },
      },
    ],
  });
  presets.end = preset({
    name: "Close the Output window",
    text: "END\nSHOW",
    bgcolor: BLACK,
    actions: [{ actionId: "end_slideshow", options: {} }],
    feedbacks: [
      {
        feedbackId: "slideshowState",
        options: { state: "edit" },
        style: { bgcolor: RED, color: WHITE },
      },
    ],
  });
  presets.state_display = preset({
    name: "Slideshow state (no action)",
    text: `$(${self.label}:presentationName)\n$(${self.label}:state)`,
    bgcolor: BLACK,
    feedbacks: [
      {
        feedbackId: "slideshowState",
        options: { state: "running" },
        style: { bgcolor: DARKGREEN, color: BRIGHTGREEN },
      },
      {
        feedbackId: "slideshowState",
        options: { state: "paused" },
        style: { bgcolor: AMBER, color: BLACK },
      },
    ],
  });

  // --- Screen ---------------------------------------------------------------
  presets.black = preset({
    name: "Black screen",
    text: "BLACK",
    size: "18",
    bgcolor: BLACK,
    actions: [{ actionId: "toggle_black", options: {} }],
  });
  presets.white = preset({
    name: "White screen",
    text: "WHITE",
    size: "18",
    bgcolor: GREY,
    actions: [{ actionId: "toggle_white", options: {} }],
  });
  // No feedback on this one, deliberately: the app never broadcasts
  // laser-pointer state, so any colour here would be invented.
  presets.laser = preset({
    name: "Laser pointer (no state feedback — see the README)",
    text: "LASER",
    actions: [{ actionId: "toggle_laser_pointer", options: {} }],
  });
  presets.wallpaper = preset({
    name: "Set the current slide as desktop wallpaper",
    text: "SLIDE TO\nWALLPAPER",
    size: "14",
    actions: [{ actionId: "set_wallpaper", options: {} }],
  });

  // --- Auto-advance ---------------------------------------------------------
  presets.pause_auto = preset({
    name: "Pause timed auto-advance",
    text: "AUTO\nPAUSE",
    actions: [{ actionId: "pause_auto_advance", options: {} }],
    feedbacks: [
      {
        feedbackId: "slideshowState",
        options: { state: "paused" },
        style: { bgcolor: AMBER, color: BLACK },
      },
    ],
  });
  presets.resume_auto = preset({
    name: "Resume timed auto-advance",
    text: "AUTO\nRESUME",
    actions: [{ actionId: "resume_auto_advance", options: {} }],
  });

  // --- Files ----------------------------------------------------------------
  presets.open_file = preset({
    name: "Open a file from the watched folder (edit the name)",
    text: "OPEN\nFILE",
    bgcolor: BLACK,
    actions: [{ actionId: "open_file", options: { filename: "" } }],
    feedbacks: [
      {
        feedbackId: "filesEnabled",
        options: {},
        style: { bgcolor: DARKGREEN, color: BRIGHTGREEN },
      },
    ],
  });
  presets.files_refresh = preset({
    name: "Refresh the watched-folder file list",
    text: "FILES\nREFRESH",
    actions: [{ actionId: "request_files_list", options: {} }],
  });
  presets.files_display = preset({
    name: "Watched folder (no action)",
    text: `$(${self.label}:activeFolder)\n$(${self.label}:activeFolderFileCount) files`,
    bgcolor: BLACK,
    feedbacks: [
      {
        feedbackId: "filesEnabled",
        options: {},
        style: { bgcolor: DARKGREEN, color: BRIGHTGREEN },
      },
    ],
  });

  presets.refresh_feedbacks = preset({
    name: "Ask the app to re-send everything",
    text: "REFRESH",
    actions: [{ actionId: "refresh_feedbacks", options: {} }],
  });

  // --- PowerPoint media transport (Windows only) ---------------------------
  // Deliberately without feedback: the Client Node broadcasts no media state,
  // and a play button that lit from a value this module had assumed would be
  // wrong exactly when a video failed to start.
  presets.media_playpause = preset({
    name: "Media: play / pause (PowerPoint on Windows only)",
    text: "MEDIA\nPLAY/PAUSE",
    bgcolor: BLACK,
    actions: [{ actionId: "media_playpause", options: {} }],
  });
  presets.media_play = preset({
    name: "Media: play (PowerPoint on Windows only)",
    text: "MEDIA\nPLAY",
    bgcolor: BLACK,
    actions: [{ actionId: "media_play", options: {} }],
  });
  presets.media_pause = preset({
    name: "Media: pause (PowerPoint on Windows only)",
    text: "MEDIA\nPAUSE",
    bgcolor: BLACK,
    actions: [{ actionId: "media_pause", options: {} }],
  });
  presets.media_stop = preset({
    name: "Media: stop (PowerPoint on Windows only)",
    text: "MEDIA\nSTOP",
    bgcolor: BLACK,
    actions: [{ actionId: "media_stop", options: {} }],
  });

  const structure = [
    {
      id: "navigation",
      name: "Navigation",
      definitions: [
        {
          id: "navigation-main",
          type: "simple",
          name: "Slides",
          presets: [
            "next",
            "previous",
            "first",
            "last",
            "goto",
            "slide_display",
          ],
        },
      ],
      keywords: ["next", "previous", "slide"],
    },
    {
      id: "sections",
      name: "Sections",
      description:
        "The section buttons carry the section's NAME on their face, from the variables the app publishes — the difference between a usable navigation page and eight identical grey squares.",
      definitions: [
        {
          id: "sections-main",
          type: "simple",
          name: "Sections",
          presets: [
            "section_next",
            "section_previous",
            "section_display",
            "section_goto",
          ],
        },
      ],
    },
    {
      id: "output",
      name: "Output window",
      definitions: [
        {
          id: "output-main",
          type: "simple",
          name: "Output",
          presets: ["start_top", "start_current", "end", "state_display"],
        },
      ],
    },
    {
      id: "screen",
      name: "Screen and pointer",
      description:
        "The laser button has no state colour: the app never broadcasts laser-pointer state, so any colour here would be invented rather than reported.",
      definitions: [
        {
          id: "screen-main",
          type: "simple",
          name: "Screen",
          presets: ["black", "white", "laser", "wallpaper"],
        },
      ],
    },
    {
      id: "auto",
      name: "Auto-advance",
      definitions: [
        {
          id: "auto-main",
          type: "simple",
          name: "Auto-advance",
          presets: ["pause_auto", "resume_auto"],
        },
      ],
    },
    {
      id: "media",
      name: "Media transport",
      description:
        "PowerPoint on Windows only. No state colour — the Client Node broadcasts no media state, so any would be invented.",
      definitions: [
        {
          id: "media-main",
          type: "simple",
          name: "Media",
          presets: [
            "media_playpause",
            "media_play",
            "media_pause",
            "media_stop",
          ],
        },
      ],
    },
    {
      id: "files",
      name: "Files",
      description:
        "File actions only work while the app's OSC file access is on — that is what the green on these buttons reports.",
      definitions: [
        {
          id: "files-main",
          type: "simple",
          name: "Files",
          presets: [
            "open_file",
            "files_refresh",
            "files_display",
            "refresh_feedbacks",
          ],
        },
      ],
    },
  ];

  self.setPresetDefinitions(structure, presets);
}
