import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ExerciseBlock,
  MutateFunction,
  ReactNode,
} from "@/app/types/workout.types";

interface SetTableContainerProps {
  item?: ExerciseBlock;
  exerciseBlock: ExerciseBlock;
  mutateWorkoutSet: MutateFunction;
  children: ReactNode;
}

export default function SetTableContainer({
  exerciseBlock,
  children,
}: SetTableContainerProps) {
  if (exerciseBlock.sets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        还没有组数。添加第一组重量和次数。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-20 text-center text-xs uppercase tracking-wide">
              组
            </TableHead>
            <TableHead className="text-center text-xs uppercase tracking-wide">
              重量 kg
            </TableHead>
            <TableHead className="text-center text-xs uppercase tracking-wide">
              次数
            </TableHead>
            <TableHead className="w-24 text-center text-xs uppercase tracking-wide">
              操作
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}
