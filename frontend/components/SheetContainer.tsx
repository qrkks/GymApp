import {Button} from "@/components/ui/button";
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

import {useState, ReactNode} from "react";

interface SheetContainerProps {
  triggerButton: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  submitButtonText: string;
  onHandleSubmit?: () => void;
  side?: "top" | "right" | "bottom" | "left";
}

export default function SheetContainer({
  triggerButton,
  title,
  description,
  children,
  submitButtonText,
  onHandleSubmit = () => {},
  side = "top",
}: SheetContainerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{triggerButton}</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : (
            <SheetDescription className="sr-only">无描述</SheetDescription>
          )}
        </SheetHeader>
        <div className="grid gap-4 py-4 w-full">
          {children}
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

