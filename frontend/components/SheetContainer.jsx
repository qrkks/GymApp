import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {useState} from "react";

export default function SheetProvider({
  triggerButton,
  title,
  description,
  children,
  submitButtonText,
  onHandleSubmit = () => {},
  side = "left",
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{triggerButton}</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4 ">
          {/* <div className="grid items-center w-full grid-cols-4 gap-4"> */}
          {children}
          {/* </div> */}
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onHandleSubmit();
              }}
            >
              {submitButtonText}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
