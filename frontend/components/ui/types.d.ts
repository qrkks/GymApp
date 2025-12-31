/**
 * Type declarations for UI components
 * These components are JSX files without TypeScript types
 */

import * as React from 'react';

declare module '@/components/ui/button' {
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
  }
  export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
}

declare module '@/components/ui/dropdown-menu' {
  export const DropdownMenu: React.ComponentType<any>;
  export const DropdownMenuTrigger: React.ComponentType<any>;
  export const DropdownMenuContent: React.ComponentType<any>;
  export const DropdownMenuItem: React.ComponentType<any>;
  export const DropdownMenuLabel: React.ComponentType<any>;
  export const DropdownMenuSeparator: React.ComponentType<any>;
}

declare module '@/components/ui/sheet' {
  interface SheetProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
  }
  interface SheetTriggerProps {
    asChild?: boolean;
    children?: React.ReactNode;
  }
  interface SheetContentProps {
    side?: 'top' | 'right' | 'bottom' | 'left';
    children?: React.ReactNode;
  }
  export const Sheet: React.ComponentType<SheetProps>;
  export const SheetTrigger: React.ComponentType<SheetTriggerProps>;
  export const SheetContent: React.ComponentType<SheetContentProps>;
}

