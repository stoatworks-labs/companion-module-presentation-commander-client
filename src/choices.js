// Dropdown choice lists derived from the last-received OSC feedback
// (self.state, updated by osc.js) — shared between actions.js and
// feedbacks.js so both stay in sync with whatever the app's current
// sections/files actually are, instead of requiring the operator to know
// exact names by heart.

export function sectionChoices(self) {
  return (self.state.sections ?? []).map((s) => ({
    id: s.name,
    label: s.name,
  }));
}

export function fileChoices(self) {
  return (self.state.files ?? []).map((name) => ({ id: name, label: name }));
}
