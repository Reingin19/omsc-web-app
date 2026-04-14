import { useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../components/ui/command';

interface CommandItem {
  label: string;
  path: string;
  icon: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  onSelect: (path: string) => void;
}

export default function CommandPalette({ open, onOpenChange, items, onSelect }: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type to search..." className="text-foreground" />
      <CommandList>
        <CommandEmpty className="text-muted-foreground">No results found.</CommandEmpty>
        <CommandGroup heading="Navigation" className="text-foreground">
          {items.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => onSelect(item.path)}
              className="text-foreground cursor-pointer"
            >
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}