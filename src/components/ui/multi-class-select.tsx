import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiClassSelectProps {
  availableClasses: string[];
  selectedClasses: string[];
  onChange: (classes: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiClassSelect({
  availableClasses,
  selectedClasses,
  onChange,
  placeholder = "Sinflarni tanlang",
  className,
}: MultiClassSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleClass = (className: string) => {
    if (selectedClasses.includes(className)) {
      onChange(selectedClasses.filter((c) => c !== className));
    } else {
      onChange([...selectedClasses, className]);
    }
  };

  const selectAll = () => {
    onChange([...availableClasses]);
  };

  const clearAll = () => {
    onChange([]);
  };

  const removeClass = (className: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedClasses.filter((c) => c !== className));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-10", className)}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedClasses.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedClasses.map((cls) => (
                <Badge
                  key={cls}
                  variant="secondary"
                  className="mr-1 mb-0.5"
                >
                  {cls}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={(e) => removeClass(cls, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="text-sm font-medium">Sinflar</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Barchasi
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Tozalash
            </Button>
          </div>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
          {availableClasses.map((cls) => (
            <div
              key={cls}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
              onClick={() => toggleClass(cls)}
            >
              <Checkbox
                id={`class-${cls}`}
                checked={selectedClasses.includes(cls)}
                onCheckedChange={() => toggleClass(cls)}
              />
              <Label
                htmlFor={`class-${cls}`}
                className="text-sm cursor-pointer truncate"
              >
                {cls}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
