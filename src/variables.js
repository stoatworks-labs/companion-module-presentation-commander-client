// setVariableDefinitions expects an object keyed by variable id, NOT an array —
// @companion-module/base 2.x throws "Variable definitions should be an object,
// not an array" outright, which fails init() and leaves the instance dead with
// no actions, no feedbacks and no obvious cause. This file used to pass an
// array.
export default function UpdateVariableDefinitions(self) {
  self.setVariableDefinitions({
    presentationName: { name: "Presentation/deck file name" },
    filePath: { name: "Full path of the open file" },
    slideCount: { name: "Total slide count" },
    slideCountVisible: { name: "Total slide count, excluding hidden slides" },
    state: { name: "Presentation state (edit / running / paused)" },
    currentSlide: { name: "Current slide number" },
    slidesRemaining: { name: "Number of slides left in the deck" },
    notes: { name: "Current slide notes" },
    sectionIndex: { name: "Current section index" },
    sectionName: { name: "Current section name" },
    sectionSlidesRemaining: { name: "Slides remaining in current section" },
    previousSectionName: {
      name: 'Name of previous section ("Start of deck" if this is the first)',
    },
    previousSectionFirstSlide: { name: "First slide of previous section" },
    nextSectionName: {
      name: 'Name of next section ("End of deck" if this is the last)',
    },
    nextSectionFirstSlide: { name: "First slide of next section" },
    mediaDuration: {
      name: "Current slide media duration in seconds (PowerPoint on Windows only)",
    },
    mediaDurationFormatted: { name: "Media duration, formatted mm:ss" },
    fileAccessEnabled: { name: "Whether OSC file-open access is enabled" },
    activeFolder: { name: "Watched folder, relative to home directory" },
    activeFolderFullPath: { name: "Watched folder, full path" },
    activeFolderFileCount: { name: "Number of files in the watched folder" },
    activeFolderFileNames: {
      name: "JSON array of file names in the watched folder",
    },
  });
}
