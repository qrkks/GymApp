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

  
  export default function TableDemo({item, mutateWorkoutSet, children}) {
    return (
      <Table>
        {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
        <TableHeader>
          <TableRow >
            {/* <TableHead className="w-[100px]">Invoice</TableHead> */}
            <TableHead>Set</TableHead>
            <TableHead>Weight (kg)</TableHead>
            <TableHead>Reps (rm)</TableHead>
            <TableHead>Actions</TableHead>
            {/* <TableHead className="text-right">Amount</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
            {/* <TableRow > */}
              {/* <TableCell className="font-medium">{invoice.invoice}</TableCell> */}
              {children}
              {/* <TableCell className="text-right">{invoice.totalAmount}</TableCell> */}
            {/* </TableRow> */}
        </TableBody>
        {/* <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right">$2,500.00</TableCell>
          </TableRow>
        </TableFooter> */}
      </Table>
    )
  }
  