import RemoveButton from "./RemoveButton";
import EditPopover from "./EditPopover";
import SetTable from "../SetTableContainer";
import {TableCell, TableRow} from "@/components/ui/table";

function index({item, mutateWorkoutSet}) {
  return (
    <>
      {/* {JSON.stringify(item)} */}
      <TableRow>
        <TableCell className="font-medium text-center">
          {item.set_number}
        </TableCell>
        <TableCell className="font-medium text-center">
          {" "}
          {item.weight}{" "}
        </TableCell>
        <TableCell className="font-medium text-center"> {item.reps}</TableCell>
        <TableCell className="flex items-center justify-center gap-1">
          <RemoveButton item={item} mutateWorkoutSet={mutateWorkoutSet} />
          <EditPopover item={item} mutateWorkoutSet={mutateWorkoutSet} />
        </TableCell>
      </TableRow>
    </>
  );
}

export default index;
