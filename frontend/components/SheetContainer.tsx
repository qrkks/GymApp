import { Button } from "@/components/ui/button";
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

import { useState, ReactNode } from "react";

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
      <SheetContent
        side={side}
        className="flex max-h-[100dvh] flex-col overflow-hidden"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : (
            <SheetDescription className="sr-only">无描述</SheetDescription>
          )}
        </SheetHeader>
        <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain py-4 touch-pan-y">
          <div className="grid w-full gap-4">{children}</div>
        </div>
        <SheetFooter className="shrink-0 border-t bg-background pt-4 pb-[env(safe-area-inset-bottom)]">
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
