import { clearTrainingNoteAfterSetSubmit } from "../set-form-state";

describe("clearTrainingNoteAfterSetSubmit", () => {
  it("keeps reusable set values and clears the training note", () => {
    const nextFormData = clearTrainingNoteAfterSetSubmit({
      weight: "80",
      reps: "8",
      note: "Right shoulder felt unstable.",
    });

    expect(nextFormData).toEqual({
      weight: "80",
      reps: "8",
      note: "",
    });
  });
});
