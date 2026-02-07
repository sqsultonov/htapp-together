import { useState, useEffect } from "react";
import { db } from "@/lib/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, GraduationCap, GripVertical, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface GradeClass {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export function ClassesTab() {
  const [classes, setClasses] = useState<GradeClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("grade_classes")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching classes:", error);
      toast.error("Sinflarni yuklashda xatolik");
    } else {
      setClasses((data || []) as GradeClass[]);
    }
    setLoading(false);
  };

  const handleAddClass = async () => {
    const name = newClassName.trim();
    if (!name) {
      toast.error("Sinf nomini kiriting");
      return;
    }

    // Check for duplicate
    if (classes.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Bu nomdagi sinf allaqachon mavjud");
      return;
    }

    // Get max display_order
    const maxOrder = classes.length > 0 
      ? Math.max(...classes.map(c => c.display_order)) 
      : 0;

    const { error } = await db
      .from("grade_classes")
      .insert({
        name: name,
        display_order: maxOrder + 1,
        is_active: true,
      });

    if (error) {
      toast.error("Sinf qo'shishda xatolik: " + error);
      return;
    }

    toast.success(`"${name}" sinfi qo'shildi`);
    setNewClassName("");
    setIsAddDialogOpen(false);
    fetchClasses();
  };

  const handleRemoveClass = async (cls: GradeClass) => {
    if (!confirm(`"${cls.name}" sinfini o'chirmoqchimisiz? Bu sinfdagi darslar va testlar saqlanib qoladi.`)) {
      return;
    }

    const { error } = await db
      .from("grade_classes")
      .delete()
      .eq("id", cls.id);

    if (error) {
      toast.error("Sinf o'chirishda xatolik: " + error);
      return;
    }

    toast.success(`"${cls.name}" sinfi o'chirildi`);
    fetchClasses();
  };

  const handleToggleActive = async (cls: GradeClass) => {
    const { error } = await db
      .from("grade_classes")
      .update({ is_active: !cls.is_active })
      .eq("id", cls.id);

    if (error) {
      toast.error("Holat o'zgartirishda xatolik");
      return;
    }

    toast.success(`"${cls.name}" ${!cls.is_active ? "faollashtirildi" : "o'chirildi"}`);
    fetchClasses();
  };

  const startEditing = (cls: GradeClass) => {
    setEditingId(cls.id);
    setEditingName(cls.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEditing = async () => {
    if (!editingId) return;
    
    const name = editingName.trim();
    if (!name) {
      toast.error("Sinf nomini kiriting");
      return;
    }

    // Check for duplicate (excluding current)
    if (classes.some(c => c.id !== editingId && c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Bu nomdagi sinf allaqachon mavjud");
      return;
    }

    const { error } = await db
      .from("grade_classes")
      .update({ name })
      .eq("id", editingId);

    if (error) {
      toast.error("Sinf nomini o'zgartirishda xatolik");
      return;
    }

    toast.success("Sinf nomi o'zgartirildi");
    cancelEditing();
    fetchClasses();
  };

  const moveClass = async (cls: GradeClass, direction: "up" | "down") => {
    const currentIndex = classes.findIndex(c => c.id === cls.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= classes.length) return;

    const targetClass = classes[targetIndex];
    
    // Swap display_order values
    const updates = [
      { id: cls.id, display_order: targetClass.display_order },
      { id: targetClass.id, display_order: cls.display_order },
    ];

    for (const update of updates) {
      const { error } = await db
        .from("grade_classes")
        .update({ display_order: update.display_order })
        .eq("id", update.id);
      
      if (error) {
        toast.error("Tartib o'zgartirishda xatolik");
        return;
      }
    }

    fetchClasses();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Yuklanmoqda...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sinflarni boshqarish</CardTitle>
          <CardDescription>
            O'quvchilar uchun mavjud sinflar. Istalgan nom (raqam, harf, so'z, belgi) ishlatish mumkin.
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Sinf qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi sinf qo'shish</DialogTitle>
              <DialogDescription>
                Istalgan nom kiriting: raqam, harf, so'z yoki belgi.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Sinf nomi</Label>
                <Input
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Masalan: 10-A, Boshlang'ich, Maxsus guruh"
                  onKeyDown={(e) => e.key === "Enter" && handleAddClass()}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddClass} className="flex-1">
                  Qo'shish
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Bekor qilish
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Hozircha sinflar yo'q. Yangi sinf qo'shing.
          </div>
        ) : (
          <div className="space-y-2">
            {classes.map((cls, index) => (
              <div
                key={cls.id}
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  cls.is_active ? "bg-card" : "bg-muted/50 opacity-60"
                }`}
              >
                {/* Drag handle / order controls */}
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    disabled={index === 0}
                    onClick={() => moveClass(cls, "up")}
                  >
                    <GripVertical className="w-3 h-3 rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    disabled={index === classes.length - 1}
                    onClick={() => moveClass(cls, "down")}
                  >
                    <GripVertical className="w-3 h-3 rotate-90" />
                  </Button>
                </div>

                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>

                {/* Name */}
                <div className="flex-1">
                  {editingId === cls.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditing();
                          if (e.key === "Escape") cancelEditing();
                        }}
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEditing}>
                        <Check className="w-4 h-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant={cls.is_active ? "secondary" : "outline"} className="text-sm">
                      {cls.name}
                    </Badge>
                  )}
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Faol</Label>
                  <Switch
                    checked={cls.is_active}
                    onCheckedChange={() => handleToggleActive(cls)}
                  />
                </div>

                {/* Edit button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => startEditing(cls)}
                  disabled={editingId !== null}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveClass(cls)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
