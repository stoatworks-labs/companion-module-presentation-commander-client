// No mediaState feedback (playing/paused/stopped): the app's wire protocol
// only ever sends media/duration, never a queryable playback state — the
// underlying PowerPoint COM object model has no way to report it, so a
// feedback for it would have nothing real to reflect.
export default function UpdateFeedbacks(self) {
  self.setFeedbackDefinitions({
    slideshowState: {
      type: "boolean",
      name: "Slideshow state",
      description:
        "Highlights the button when Program Out is in the given state.",
      defaultStyle: { bgcolor: 0xcc0000, color: 0xffffff },
      options: [
        {
          id: "state",
          type: "dropdown",
          label: "State",
          choices: [
            { id: "edit", label: "Edit (Program Out closed)" },
            { id: "running", label: "Running" },
            { id: "paused", label: "Running, auto-advance paused" },
          ],
          default: "running",
        },
      ],
      callback: (feedback) => self.state.state === feedback.options.state,
    },
    filesEnabled: {
      type: "boolean",
      name: "OSC file access enabled",
      description:
        "Highlights the button while the watched-folder OSC file actions are enabled.",
      defaultStyle: { bgcolor: 0x00aa00, color: 0xffffff },
      options: [],
      callback: () => !!self.state.filesEnabled,
    },
  });
}
