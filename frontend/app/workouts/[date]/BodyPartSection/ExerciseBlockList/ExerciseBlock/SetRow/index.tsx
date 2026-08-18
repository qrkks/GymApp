import RemoveSetButton from "./RemoveButton";
import SetEditPopover from "./EditPopover";
import { TableCell, TableRow } from "@/components/ui/table";
import { Clock3 } from "lucide-react";
import type {
  Set,
  ExerciseBlock,
  MutateFunction,
} from "@/app/types/workout.types";

interface SetRowProps {
  item: Set;
  mutateWorkoutSet: MutateFunction;
  exerciseBlock?: ExerciseBlock;
}

function SetRow({ item, mutateWorkoutSet, exerciseBlock }: SetRowProps) {
  return (
    <>
      <TableRow className="bg-white">
        <TableCell className="text-center font-semibold text-muted-foreground">
          #{item.setNumber}
        </TableCell>
        <TableCell className="text-center font-medium">{item.weight}</TableCell>
        <TableCell className="text-center font-medium">{item.reps}</TableCell>
        <TableCell className="flex items-center justify-center gap-1">
          {item.pending ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
              <Clock3 className="h-3.5 w-3.5" />
              待同步
            </span>
          ) : (
            <>
              <SetEditPopover item={item} mutateWorkoutSet={mutateWorkoutSet} />
              <RemoveSetButton item={item} mutateWorkoutSet={mutateWorkoutSet} />
            </>
          )}
        </TableCell>
      </TableRow>
      {item.note ? (
        <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
          <TableCell colSpan={4} className="px-4 py-3 text-sm leading-6 text-muted-foreground">
            {item.note}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export default SetRow;
