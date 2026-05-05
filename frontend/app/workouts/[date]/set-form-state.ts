export interface SetFormData {
  weight: string;
  reps: string;
  note: string;
}

export function clearTrainingNoteAfterSetSubmit(formData: SetFormData): SetFormData {
  return {
    ...formData,
    note: "",
  };
}
