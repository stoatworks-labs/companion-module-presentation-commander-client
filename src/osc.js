import osc from "osc";
import { InstanceStatus } from "@companion-module/base";

const PREFIX = "/presentcommander";

function textArg(args) {
  if (!args?.length) return "";
  const arg = args[0];
  if (arg.type === "b" || arg.type === "blob") {
    return Buffer.from(arg.value).toString("utf8");
  }
  return String(arg.value);
}

/** previousSection/nextSection are computed locally from the sections array
 * the app's /presentation JSON blob already carries, plus the currently
 * active section index — the app itself only ever reports "the section
 * we're in right now", not "what comes before/after it". */
function updateDerivedSectionNav(self) {
  const sections = self.state.sections ?? [];
  const idx = self.state.sectionIndex;
  if (!sections.length || !idx) {
    self.state.previousSectionName = "";
    self.state.previousSectionFirstSlide = 0;
    self.state.nextSectionName = "";
    self.state.nextSectionFirstSlide = 0;
    return;
  }
  const i = idx - 1;
  if (i > 0) {
    self.state.previousSectionName = sections[i - 1].name;
    self.state.previousSectionFirstSlide = sections[i - 1].firstSlide;
  } else {
    self.state.previousSectionName = "Start of deck";
    self.state.previousSectionFirstSlide = 1;
  }
  if (i < sections.length - 1) {
    self.state.nextSectionName = sections[i + 1].name;
    self.state.nextSectionFirstSlide = sections[i + 1].firstSlide;
  } else {
    self.state.nextSectionName = "End of deck";
    self.state.nextSectionFirstSlide =
      self.state.slideCount || sections[i].lastSlide;
  }
}

function handleMessage(self, oscMsg) {
  if (!oscMsg.address.startsWith(`${PREFIX}/`)) return;
  const address = oscMsg.address.slice(PREFIX.length);
  const args = oscMsg.args ?? [];
  let definitionsChanged = false;

  switch (address) {
    case "/presentation": {
      try {
        self.state.presentation = JSON.parse(textArg(args));
      } catch (e) {
        self.log("error", `Error parsing presentation JSON: ${e}`);
        break;
      }
      const sections = self.state.presentation?.sections ?? [];
      definitionsChanged =
        JSON.stringify(sections) !== JSON.stringify(self.state.sections);
      self.state.sections = sections;
      self.state.filePath = self.state.presentation?.path ?? "";
      updateDerivedSectionNav(self);
      break;
    }
    case "/presentation/name":
      self.state.presentationName = textArg(args);
      break;
    case "/presentation/slides/count":
      self.state.slideCount = args[0]?.value ?? 0;
      break;
    case "/presentation/slides/count/visible":
      self.state.slideCountVisible = args[0]?.value ?? 0;
      break;
    case "/slideshow/state":
      self.state.state = textArg(args);
      break;
    case "/slideshow/currentslide":
      self.state.currentSlide = args[0]?.value ?? 0;
      break;
    case "/slideshow/slidesremaining":
      self.state.slidesRemaining = args[0]?.value ?? 0;
      break;
    case "/slideshow/notes":
      // The UTF-8 blob variant (/slideshow/notes-utf8) carries the same
      // text more robustly for non-ASCII content — both update the same
      // variable, whichever arrives.
      self.state.notes = textArg(args);
      break;
    case "/slideshow/notes-utf8":
      self.state.notes = textArg(args);
      break;
    case "/slideshow/section/index":
      self.state.sectionIndex = args[0]?.value ?? 0;
      updateDerivedSectionNav(self);
      break;
    case "/slideshow/section/name":
      self.state.sectionName = textArg(args);
      break;
    case "/slideshow/section/slidesremaining":
      self.state.sectionSlidesRemaining = args[0]?.value ?? 0;
      break;
    case "/slideshow/media/duration":
      self.state.mediaDurationMs = args[0]?.value ?? null;
      break;
    case "/files/enabled":
      self.state.filesEnabled = !!args[0]?.value;
      break;
    case "/files/activefolder":
      self.state.activeFolder = textArg(args);
      break;
    case "/files/activefolder/fullpath":
      self.state.activeFolderFullPath = textArg(args);
      break;
    case "/files": {
      try {
        const files = JSON.parse(textArg(args));
        definitionsChanged =
          definitionsChanged ||
          JSON.stringify(files) !== JSON.stringify(self.state.files);
        self.state.files = files;
      } catch (e) {
        self.log("error", `Error parsing files JSON: ${e}`);
      }
      break;
    }
    default:
      return;
  }

  self.refreshVariableValues();
  self.checkAllFeedbacks();
  if (definitionsChanged) {
    self.updateActions();
    self.updateFeedbacks();
  }
}

const oscListener = {
  udpPort: null,

  async connect(self) {
    this.udpPort = new osc.UDPPort({
      localAddress: "0.0.0.0",
      localPort: self.config.localport,
      metadata: true,
    });

    this.udpPort.open();

    this.udpPort.on("ready", () => {
      self.log(
        "info",
        `Listening for OSC feedback on port ${self.config.localport}`,
      );
      self.updateStatus(InstanceStatus.Ok, "Connected.");
      self.log(
        "info",
        `Requesting feedback refresh from ${self.config.remotehost}:${self.config.remoteport}`,
      );
      self.oscSend(
        self.config.remotehost,
        self.config.remoteport,
        `${PREFIX}/feedbacks/refresh`,
        [],
      );
    });

    this.udpPort.on("message", (oscMsg) => {
      handleMessage(self, oscMsg);
    });

    this.udpPort.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        self.log("error", `Port ${self.config.localport} already in use`);
        self.updateStatus(
          InstanceStatus.ConnectionFailure,
          `Port ${self.config.localport} in use elsewhere.`,
        );
      } else {
        self.log("error", `UDP port error: ${err.message}`);
        self.updateStatus(InstanceStatus.UnknownError, err.message);
      }
    });
  },

  /**
   * Close the listen socket.
   *
   * osc's UDPPort.close() takes NO callback — it just calls socket.close()
   * (node_modules/osc/src/platforms/osc-node.js). The obvious-looking
   * `new Promise((r) => port.close(r))` therefore never settles: destroy()
   * never finishes, and configUpdated() never gets past the close to reconnect,
   * so editing the host or port kills the instance until Companion restarts.
   *
   * The port does emit "close", so that is what to await — with a timeout,
   * because a socket that never opened emits nothing and a module that cannot
   * be destroyed is worse than one that leaks a UDP port.
   */
  async close() {
    const port = this.udpPort;
    if (!port) return;
    this.udpPort = null;
    await new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(done, 1000);
      port.once("close", done);
      try {
        port.close();
      } catch {
        done();
      }
    });
  },
};

export default oscListener;
