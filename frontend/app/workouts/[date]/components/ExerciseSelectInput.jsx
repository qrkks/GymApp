import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import {useState} from "react";
  
  export default function SelectInput({placeholder, entries, mutate, selectedExercise, onSelectChange}) {
  
  if (selectedExercise) {
  console.log("selectedExercise", selectedExercise);}

    return (
      <Select value={selectedExercise} onValueChange={onSelectChange} >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{placeholder}</SelectLabel>
            {entries?.map((entry) => (
              <SelectItem key={entry.id} value={entry.name}>
                {entry.name}
              </SelectItem>
            ))}
            <SelectItem key="new" value="new">
              新建...
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }
  