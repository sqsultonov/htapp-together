import { useState, useEffect } from "react";
import { db } from "@/lib/database";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface GradeClass {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

interface InstructorClassesSelectProps {
  selectedClasses: string[];
  onChange: (classes: string[]) => void;
}

export function InstructorClassesSelect({ selectedClasses, onChange }: InstructorClassesSelectProps) {
  const [availableClasses, setAvailableClasses] = useState<GradeClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await db
        .from("grade_classes")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (data) {
        setAvailableClasses(data as GradeClass[]);
      }
      setLoading(false);
    };

    fetchClasses();
  }, []);

  const handleToggle = (className: string) => {
    if (selectedClasses.includes(className)) {
      onChange(selectedClasses.filter((c) => c !== className));
    } else {
      onChange([...selectedClasses, className]);
    }
  };

  const handleSelectAll = () => {
    if (selectedClasses.length === availableClasses.length) {
      onChange([]);
    } else {
      onChange(availableClasses.map(c => c.name));
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (availableClasses.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Sinflar topilmadi. Avval "Sinflar" bo'limida sinf qo'shing.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Tayinlangan sinflar</Label>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs text-primary hover:underline"
        >
          {selectedClasses.length === availableClasses.length ? "Barchasini bekor qilish" : "Barchasini tanlash"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableClasses.map((cls) => {
          const isSelected = selectedClasses.includes(cls.name);
          return (
            <div
              key={cls.id}
              onClick={() => handleToggle(cls.name)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer border transition-colors
                ${isSelected 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-background hover:bg-accent border-input"
                }
              `}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggle(cls.name)}
                className={isSelected ? "border-primary-foreground" : ""}
              />
              <span className="text-sm font-medium">{cls.name}</span>
            </div>
          );
        })}
      </div>
      {selectedClasses.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedClasses.length} ta sinf tanlangan
        </p>
      )}
    </div>
  );
}
