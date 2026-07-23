import { sectionChoices, fileChoices } from "./choices.js";

const PREFIX = "/presentcommander";

function send(self, path, args = []) {
  self.oscSend(
    self.config.remotehost,
    self.config.remoteport,
    `${PREFIX}${path}`,
    args,
  );
}

function slideNumberOption(defaultValue = 1) {
  return {
    id: "slideNumber",
    type: "number",
    label: "Slide number",
    min: 1,
    default: defaultValue,
    useVariables: true,
  };
}

export default function UpdateActions(self) {
  const sections = sectionChoices(self);
  const files = fileChoices(self);

  self.setActionDefinitions({
    next: {
      name: "Next slide",
      options: [],
      callback: async () => send(self, "/next"),
    },
    previous: {
      name: "Previous slide",
      options: [],
      callback: async () => send(self, "/previous"),
    },
    goto_slide: {
      name: "Go to slide number",
      options: [slideNumberOption()],
      callback: async (event) => {
        const n = parseInt(
          await self.parseVariablesInField(String(event.options.slideNumber)),
          10,
        );
        if (!isNaN(n)) send(self, "/goto/slide", [{ type: "i", value: n }]);
      },
    },
    goto_first_slide: {
      name: "Go to first slide",
      options: [],
      callback: async () => send(self, "/goto/slide/first"),
    },
    goto_last_slide: {
      name: "Go to last slide",
      options: [],
      callback: async () => send(self, "/goto/slide/last"),
    },
    goto_section: {
      name: "Go to first slide of section",
      options: [
        {
          id: "sectionName",
          type: "dropdown",
          label: "Section",
          choices: sections,
          default: sections[0]?.id ?? "",
          allowCustom: true,
          useVariables: true,
        },
      ],
      callback: async (event) => {
        const name = await self.parseVariablesInField(
          String(event.options.sectionName),
        );
        send(self, "/goto/section", [{ type: "s", value: name }]);
      },
    },
    goto_next_section: {
      name: "Go to first slide of next section",
      options: [],
      callback: async () => {
        const n = self.state.nextSectionFirstSlide;
        if (n) send(self, "/goto/slide", [{ type: "i", value: n }]);
      },
    },
    goto_previous_section: {
      name: "Go to first slide of previous section",
      options: [],
      callback: async () => {
        const n = self.state.previousSectionFirstSlide;
        if (n) send(self, "/goto/slide", [{ type: "i", value: n }]);
      },
    },
    start_slideshow_top: {
      name: "Start Program Out from first slide",
      options: [],
      callback: async () =>
        send(self, "/slideshow/start", [{ type: "i", value: 1 }]),
    },
    start_slideshow_current: {
      name: "Start Program Out from current slide",
      options: [],
      callback: async () => send(self, "/slideshow/start/current"),
    },
    end_slideshow: {
      name: "Close Program Out",
      options: [],
      callback: async () => send(self, "/slideshow/end"),
    },
    toggle_black: {
      name: "Toggle black screen",
      options: [],
      callback: async () => send(self, "/slideshow/black"),
    },
    toggle_white: {
      name: "Toggle white screen",
      options: [],
      callback: async () => send(self, "/slideshow/white"),
    },
    toggle_laser_pointer: {
      name: "Toggle laser pointer overlay",
      options: [],
      callback: async () => send(self, "/slideshow/laserpointer"),
    },
    set_wallpaper: {
      name: "Set current slide as desktop wallpaper",
      options: [
        {
          id: "width",
          type: "number",
          label: "Width (px)",
          min: 1,
          default: 1920,
        },
        {
          id: "height",
          type: "number",
          label: "Height (px)",
          min: 1,
          default: 1080,
        },
      ],
      callback: async (event) =>
        send(self, "/slideshow/setwallpaper", [
          { type: "i", value: event.options.width },
          { type: "i", value: event.options.height },
        ]),
    },
    pause_auto_advance: {
      name: "Pause auto-advance",
      options: [],
      callback: async () => send(self, "/slideshow/pause"),
    },
    resume_auto_advance: {
      name: "Resume auto-advance",
      options: [],
      callback: async () => send(self, "/slideshow/resume"),
    },
    media_play: {
      name: "Media: play (PowerPoint on Windows only)",
      options: [],
      callback: async () => send(self, "/media/play"),
    },
    media_pause: {
      name: "Media: pause (PowerPoint on Windows only)",
      options: [],
      callback: async () => send(self, "/media/pause"),
    },
    media_playpause: {
      name: "Media: toggle play/pause (PowerPoint on Windows only)",
      options: [],
      callback: async () => send(self, "/media/playpause"),
    },
    media_stop: {
      name: "Media: stop (PowerPoint on Windows only)",
      options: [],
      callback: async () => send(self, "/media/stop"),
    },
    enable_actions: {
      name: "Enable OSC actions",
      options: [],
      callback: async () => send(self, "/actions/enable"),
    },
    disable_actions: {
      name: "Disable OSC actions",
      options: [],
      callback: async () => send(self, "/actions/disable"),
    },
    enable_feedbacks: {
      name: "Enable OSC feedback",
      options: [],
      callback: async () => send(self, "/feedbacks/enable"),
    },
    disable_feedbacks: {
      name: "Disable OSC feedback",
      options: [],
      callback: async () => send(self, "/feedbacks/disable"),
    },
    refresh_feedbacks: {
      name: "Request feedback refresh",
      options: [],
      callback: async () => send(self, "/feedbacks/refresh"),
    },
    set_files_path: {
      name: "Set watched folder",
      options: [
        {
          id: "relativePath",
          type: "textinput",
          label: "Folder path, relative to home directory",
          default: "",
          useVariables: true,
        },
      ],
      callback: async (event) => {
        const path = await self.parseVariablesInField(
          String(event.options.relativePath),
        );
        send(self, "/files/setpath", [{ type: "s", value: path }]);
      },
    },
    request_files_list: {
      name: "Request watched-folder file list",
      options: [],
      callback: async () => send(self, "/files/list"),
    },
    open_file: {
      name: "Open file from watched folder",
      options: [
        {
          id: "filename",
          type: "dropdown",
          label: "File (.pdf / .key / .pptx / .ppt)",
          choices: files,
          default: files[0]?.id ?? "",
          allowCustom: true,
          useVariables: true,
        },
      ],
      callback: async (event) => {
        const filename = await self.parseVariablesInField(
          String(event.options.filename),
        );
        send(self, "/files/open", [{ type: "s", value: filename }]);
      },
    },
  });
}
