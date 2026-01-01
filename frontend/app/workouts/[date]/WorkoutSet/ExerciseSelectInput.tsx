import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BodyPart, Exercise, MutateFunction } from "@/app/types/workout.types";

interface SelectInputProps {
  placeholder?: string;
  entries?: Array<BodyPart | Exercise>;
  mutate?: MutateFunction;
  selectedExercise?: string;
  onSelectChange?: (value: string) => void;
  className?: string;
  name?: string;
}

export default function SelectInput({
  placeholder,
  entries,
  mutate,
  selectedExercise,
  onSelectChange,
  className,
  name,
}: SelectInputProps) {
  return (
    <Select value={selectedExercise} onValueChange={onSelectChange}>
      <SelectTrigger className={className}>
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

