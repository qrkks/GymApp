import RemoveSetButton from "./RemoveButton";
import SetEditPopover from "./EditPopover";
import SetTable from "../SetTableContainer";
import {TableCell, TableRow} from "@/components/ui/table";
import type { Set, ExerciseBlock, MutateFunction } from "@/app/types/workout.types";

interface SetRowProps {
  item: Set;
  mutateWorkoutSet: MutateFunction;
  exerciseBlock?: ExerciseBlock;
}

function SetRow({item, mutateWorkoutSet, exerciseBlock}: SetRowProps) {
  return (
    <>
      <TableRow>
        <TableCell className="font-medium text-center">
          {item.setNumber}
        </TableCell>
        <TableCell className="font-medium text-center">
          {" "}
          {item.weight}{" "}
        </TableCell>
        <TableCell className="font-medium text-center"> {item.reps}</TableCell>
        <TableCell className="flex items-center justify-center gap-1">
          <RemoveSetButton item={item} mutateWorkoutSet={mutateWorkoutSet} />
          <SetEditPopover item={item} mutateWorkoutSet={mutateWorkoutSet} />
        </TableCell>
      </TableRow>
      {item.note ? (
        <TableRow>
          <TableCell colSpan={4} className="px-4 py-2 text-sm text-muted-foreground">
            {item.note}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export default SetRow;

