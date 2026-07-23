export default function UpdateVariableDefinitions(self) {
  self.setVariableDefinitions([
    { variableId: "presentationName", name: "Presentation/deck file name" },
    { variableId: "filePath", name: "Full path of the open file" },
    { variableId: "slideCount", name: "Total slide count" },
    {
      variableId: "slideCountVisible",
      name: "Total slide count, excluding hidden slides",
    },
    {
      variableId: "state",
      name: "Presentation state (edit / running / paused)",
    },
    { variableId: "currentSlide", name: "Current slide number" },
    {
      variableId: "slidesRemaining",
      name: "Number of slides left in the deck",
    },
    { variableId: "notes", name: "Current slide notes" },
    { variableId: "sectionIndex", name: "Current section index" },
    { variableId: "sectionName", name: "Current section name" },
    {
      variableId: "sectionSlidesRemaining",
      name: "Slides remaining in current section",
    },
    {
      variableId: "previousSectionName",
      name: 'Name of previous section ("Start of deck" if this is the first)',
    },
    {
      variableId: "previousSectionFirstSlide",
      name: "First slide of previous section",
    },
    {
      variableId: "nextSectionName",
      name: 'Name of next section ("End of deck" if this is the last)',
    },
    {
      variableId: "nextSectionFirstSlide",
      name: "First slide of next section",
    },
    {
      variableId: "mediaDuration",
      name: "Current slide media duration in seconds (PowerPoint on Windows only)",
    },
    {
      variableId: "mediaDurationFormatted",
      name: "Media duration, formatted mm:ss",
    },
    {
      variableId: "fileAccessEnabled",
      name: "Whether OSC file-open access is enabled",
    },
    {
      variableId: "activeFolder",
      name: "Watched folder, relative to home directory",
    },
    { variableId: "activeFolderFullPath", name: "Watched folder, full path" },
    {
      variableId: "activeFolderFileCount",
      name: "Number of files in the watched folder",
    },
    {
      variableId: "activeFolderFileNames",
      name: "JSON array of file names in the watched folder",
    },
  ]);
}
