import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/database";
import {
  GraphicTestBankItem,
  GraphicTestConfig,
  fileToDataUrl,
  isImageString,
} from "@/lib/graphic-test-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Image,
  Type,
  Settings2,
  Upload,
  Eye,
  X,
  Layers,
} from "lucide-react";
import { fetchActiveGradeClassNames } from "@/lib/grade-classes";

interface GraphicTestBankManagerProps {
  createdBy: string; // admin yoki instructor id
}

export function GraphicTestBankManager({ createdBy }: GraphicTestBankManagerProps) {
  const [bankItems, setBankItems] = useState<GraphicTestBankItem[]>([]);
  const [configs, setConfigs] = useState<GraphicTestConfig[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Bank item form
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    text_label: "",
    category: "",
    class_name: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Config form
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState({
    title: "",
    class_name: "",
    category: "",
    total_questions: 10,
  });

  // Filters
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [bankRes, configRes, classRes] = await Promise.all([
      db.from("graphic_test_bank").select("*").order("created_at", { ascending: false }),
      db.from("graphic_test_configs").select("*").order("created_at", { ascending: false }),
      fetchActiveGradeClassNames(),
    ]);
    setBankItems((bankRes.data || []) as GraphicTestBankItem[]);
    setConfigs((configRes.data || []) as GraphicTestConfig[]);
    setAvailableClasses(classRes.data || []);
    setLoading(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Faqat rasm fayllarini yuklang");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm hajmi 5MB dan oshmasligi kerak");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setImagePreview(dataUrl);
  };

  const handleAddItem = async () => {
    if (!imagePreview) {
      toast.error("Rasm yuklang");
      return;
    }
    if (!itemForm.text_label.trim()) {
      toast.error("Matn ifodasini kiriting");
      return;
    }
    if (!itemForm.category.trim()) {
      toast.error("Kategoriyani kiriting");
      return;
    }
    if (!itemForm.class_name) {
      toast.error("Sinfni tanlang");
      return;
    }

    const { error } = await db.from("graphic_test_bank").insert({
      image_data: imagePreview,
      text_label: itemForm.text_label.trim(),
      category: itemForm.category.trim(),
      class_name: itemForm.class_name,
      created_by: createdBy,
    });

    if (error) {
      toast.error("Qo'shishda xatolik: " + error);
      return;
    }

    toast.success("Rasm-matn juftligi qo'shildi");
    setIsAddItemOpen(false);
    setItemForm({ text_label: "", category: "", class_name: "" });
    setImagePreview(null);
    fetchData();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Bu elementni o'chirmoqchimisiz?")) return;

    const { error } = await db.from("graphic_test_bank").delete().eq("id", id);
    if (error) {
      toast.error("O'chirishda xatolik");
      return;
    }
    toast.success("Element o'chirildi");
    fetchData();
  };

  const handleAddConfig = async () => {
    if (!configForm.title.trim()) {
      toast.error("Test nomini kiriting");
      return;
    }
    if (!configForm.class_name) {
      toast.error("Sinfni tanlang");
      return;
    }
    if (!configForm.category.trim()) {
      toast.error("Kategoriyani tanlang");
      return;
    }
    if (configForm.total_questions < 2) {
      toast.error("Kamida 2 ta savol bo'lishi kerak");
      return;
    }

    // Bazada yetarli element borligini tekshirish
    const { data: categoryItems } = await db
      .from("graphic_test_bank")
      .select("*")
      .eq("class_name", configForm.class_name)
      .eq("category", configForm.category);

    const itemCount = (categoryItems || []).length;
    if (itemCount < 4) {
      toast.error(
        `Kamida 4 ta rasm-matn juftligi kerak. Hozir ${itemCount} ta bor.`
      );
      return;
    }

    const { error } = await db.from("graphic_test_configs").insert({
      title: configForm.title.trim(),
      class_name: configForm.class_name,
      category: configForm.category.trim(),
      total_questions: Math.min(configForm.total_questions, itemCount),
      is_active: true,
      created_by: createdBy,
    });

    if (error) {
      toast.error("Xatolik: " + error);
      return;
    }

    toast.success("Grafik test sozlamasi yaratildi");
    setIsConfigOpen(false);
    setConfigForm({ title: "", class_name: "", category: "", total_questions: 10 });
    fetchData();
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm("Bu test sozlamasini o'chirmoqchimisiz?")) return;
    const { error } = await db.from("graphic_test_configs").delete().eq("id", id);
    if (error) {
      toast.error("O'chirishda xatolik");
      return;
    }
    toast.success("Test sozlamasi o'chirildi");
    fetchData();
  };

  const handleToggleConfig = async (config: GraphicTestConfig) => {
    const { error } = await db
      .from("graphic_test_configs")
      .update({ is_active: !config.is_active })
      .eq("id", config.id);
    if (error) {
      toast.error("Xatolik yuz berdi");
      return;
    }
    toast.success(config.is_active ? "Test o'chirildi" : "Test faollashtirildi");
    fetchData();
  };

  // Get unique categories
  const categories = [...new Set(bankItems.map((item) => item.category))];

  // Filtered items
  const filteredItems = bankItems.filter((item) => {
    if (filterClass !== "all" && item.class_name !== filterClass) return false;
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    return true;
  });

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-3">
        <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Rasm-matn qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Yangi rasm-matn juftligi
              </DialogTitle>
              <DialogDescription>
                Rasm va uning matnli ifodasini kiriting
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Rasm</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-lg border bg-muted"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-8 h-8"
                      onClick={() => {
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Rasm yuklash uchun bosing
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG, WEBP (max 5MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Text Label */}
              <div className="space-y-2">
                <Label>Matn ifodasi (javob)</Label>
                <Input
                  value={itemForm.text_label}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, text_label: e.target.value })
                  }
                  placeholder="Masalan: Yaponiya bayrog'i"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Kategoriya</Label>
                <Input
                  value={itemForm.category}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, category: e.target.value })
                  }
                  placeholder="Masalan: Bayroqlar"
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              {/* Class */}
              <div className="space-y-2">
                <Label>Sinf</Label>
                <Select
                  value={itemForm.class_name}
                  onValueChange={(val) =>
                    setItemForm({ ...itemForm, class_name: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sinfni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleAddItem} className="w-full">
                Qo'shish
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Test sozlamasi yaratish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Grafik test sozlamasi
              </DialogTitle>
              <DialogDescription>
                O'quvchilarga ko'rsatiladigan testni sozlang
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Test nomi</Label>
                <Input
                  value={configForm.title}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, title: e.target.value })
                  }
                  placeholder="Masalan: Bayroqlar testi"
                />
              </div>
              <div className="space-y-2">
                <Label>Sinf</Label>
                <Select
                  value={configForm.class_name}
                  onValueChange={(val) =>
                    setConfigForm({ ...configForm, class_name: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sinfni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kategoriya</Label>
                <Select
                  value={configForm.category}
                  onValueChange={(val) =>
                    setConfigForm({ ...configForm, category: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategoriyani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Savollar soni</Label>
                <Input
                  type="number"
                  min={2}
                  max={50}
                  value={configForm.total_questions}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      total_questions: parseInt(e.target.value) || 2,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Yarmi rasm→matn, yarmi matn→rasm shaklida bo'ladi
                </p>
              </div>
              <Button onClick={handleAddConfig} className="w-full">
                Yaratish
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Image className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bankItems.length}</p>
                <p className="text-sm text-muted-foreground">Rasm-matn juftliklari</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Kategoriyalar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{configs.length}</p>
                <p className="text-sm text-muted-foreground">Faol testlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Configs */}
      {configs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test sozlamalari</CardTitle>
            <CardDescription>O'quvchilarga ko'rsatiladigan grafik testlar</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Sinf</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead>Savollar</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.title}</TableCell>
                    <TableCell>{config.class_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{config.category}</Badge>
                    </TableCell>
                    <TableCell>{config.total_questions}</TableCell>
                    <TableCell>
                      <Badge
                        variant={config.is_active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleConfig(config)}
                      >
                        {config.is_active ? "Faol" : "Nofaol"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteConfig(config.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Bank Items Filter */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sinf" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha sinflar</SelectItem>
            {availableClasses.map((cls) => (
              <SelectItem key={cls} value={cls}>
                {cls}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Kategoriya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kategoriyalar</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bank Items Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Image className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Rasm-matn juftliklari topilmadi
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Grafik test yaratish uchun avval rasm-matn juftliklarini qo'shing
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden">
              <div className="aspect-square relative bg-muted">
                <img
                  src={item.image_data}
                  alt={item.text_label}
                  className="w-full h-full object-contain p-2"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{item.text_label}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {item.class_name}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
// S.Sultonov
