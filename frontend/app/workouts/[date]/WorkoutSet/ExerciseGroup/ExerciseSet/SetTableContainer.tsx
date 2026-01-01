import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import type { ExerciseBlock, MutateFunction, ReactNode } from "@/app/types/workout.types";

interface SetTableContainerProps {
  item?: ExerciseBlock;
  set: ExerciseBlock;
  mutateWorkoutSet: MutateFunction;
  children: ReactNode;
}

export default function SetTableContainer({item, set, mutateWorkoutSet, children}: SetTableContainerProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow >
          <TableHead>Set</TableHead>
          <TableHead>Weight (kg)</TableHead>
          <TableHead>Reps (rm)</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {children}
      </TableBody>
    </Table>
  );
}

