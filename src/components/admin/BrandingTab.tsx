import { useState, useEffect, useRef } from "react";
import { db, isElectron } from "@/lib/database";
import { storage } from "@/lib/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Save, Upload, Trash2, Loader2, Image, Type, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useBranding } from "@/lib/branding-context";

interface BrandingSettings {
  id: string;
  app_name: string;
  app_logo_url: string | null;
  app_description: string;
  app_mission: string;
  login_bg_image_url: string | null;
  login_bg_overlay_opacity: number;
  heading_font_size: number;
  body_font_size: number;
  sidebar_font_size: number;
}

export function BrandingTab() {
  const { refetch: refetchBranding } = useBranding();
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [appName, setAppName] = useState("");
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [appDescription, setAppDescription] = useState("");
  const [appMission, setAppMission] = useState("");
  const [loginBgImageUrl, setLoginBgImageUrl] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);
  const [headingFontSize, setHeadingFontSize] = useState(32);
  const [bodyFontSize, setBodyFontSize] = useState(16);
  const [sidebarFontSize, setSidebarFontSize] = useState(14);

  // Resolved URLs for display (handles local-file:// protocol)
  const [resolvedLogoUrl, setResolvedLogoUrl] = useState<string | null>(null);
  const [resolvedBgUrl, setResolvedBgUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Resolve URLs when they change
  useEffect(() => {
    resolveUrl(appLogoUrl).then(setResolvedLogoUrl);
  }, [appLogoUrl]);

  useEffect(() => {
    resolveUrl(loginBgImageUrl).then(setResolvedBgUrl);
  }, [loginBgImageUrl]);

  const resolveUrl = async (url: string | null): Promise<string | null> => {
    if (!url) return null;
    return await storage.resolveUrl(url);
  };

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("app_settings")
      .select("id, app_name, app_logo_url, app_description, app_mission, login_bg_image_url, login_bg_overlay_opacity, heading_font_size, body_font_size, sidebar_font_size")
      .maybeSingle();

    if (error) {
      console.error("Error fetching settings:", error);
      toast.error("Sozlamalarni yuklashda xatolik");
    } else if (data) {
      setSettings(data as BrandingSettings);
      setAppName(data.app_name || "HTApp");
      setAppLogoUrl(data.app_logo_url);
      setAppDescription(data.app_description || "");
      setAppMission(data.app_mission || "");
      setLoginBgImageUrl(data.login_bg_image_url);
      setOverlayOpacity(Number(data.login_bg_overlay_opacity) || 0.7);
      setHeadingFontSize(data.heading_font_size || 32);
      setBodyFontSize(data.body_font_size || 16);
      setSidebarFontSize(data.sidebar_font_size || 14);
    }
    setLoading(false);
  };

  const handleFileUpload = async (
    file: File,
    type: "logo" | "bg"
  ) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fayl 5MB dan katta bo'lmasligi kerak");
      return;
    }

    const setUploading = type === "logo" ? setUploadingLogo : setUploadingBg;
    const setUrl = type === "logo" ? setAppLogoUrl : setLoginBgImageUrl;

    setUploading(true);

    try {
      const result = await storage.upload("app-assets", file, type);

      if (result.error) {
        toast.error("Yuklashda xatolik: " + result.error);
        setUploading(false);
        return;
      }

      if (result.data) {
        setUrl(result.data.path);
        toast.success("Fayl yuklandi");
      }
    } catch (err) {
      toast.error("Yuklashda xatolik");
      console.error(err);
    }
    
    setUploading(false);
  };

  const handleRemoveImage = async (type: "logo" | "bg") => {
    const url = type === "logo" ? appLogoUrl : loginBgImageUrl;
    
    if (url) {
      await storage.delete(url);
    }
    
    if (type === "logo") {
      setAppLogoUrl(null);
    } else {
      setLoginBgImageUrl(null);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    if (!appName.trim()) {
      toast.error("Dastur nomini kiriting");
      return;
    }

    setSaving(true);
    const { error } = await db
      .from("app_settings")
      .update({
        app_name: appName.trim(),
        app_logo_url: appLogoUrl,
        app_description: appDescription.trim(),
        app_mission: appMission.trim(),
        login_bg_image_url: loginBgImageUrl,
        login_bg_overlay_opacity: overlayOpacity,
        heading_font_size: headingFontSize,
        body_font_size: bodyFontSize,
        sidebar_font_size: sidebarFontSize,
      })
      .eq("id", settings.id);

    if (error) {
      toast.error("Saqlashda xatolik: " + (typeof error === 'string' ? error : String(error)));
    } else {
      toast.success("Sozlamalar saqlandi ✨");
      await refetchBranding();
      fetchSettings();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="shadow-card border-0">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Yuklanmoqda...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fontConfigs = [
    { 
      label: "Sarlavha hajmi", 
      value: headingFontSize, 
      setValue: setHeadingFontSize, 
      min: 20, 
      max: 48,
      description: "Asosiy sarlavhalar uchun"
    },
    { 
      label: "Matn hajmi", 
      value: bodyFontSize, 
      setValue: setBodyFontSize, 
      min: 12, 
      max: 24,
      description: "Oddiy matnlar uchun"
    },
    { 
      label: "Sidebar hajmi", 
      value: sidebarFontSize, 
      setValue: setSidebarFontSize, 
      min: 10, 
      max: 20,
      description: "Yon panel uchun"
    },
  ];

  return (
    <div className="space-y-6">
      {/* App Identity */}
      <Card className="shadow-card border-0 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Dastur identifikatsiyasi</CardTitle>
              <CardDescription>
                Dastur nomi, logosi va tavsifi - barcha sahifalarda ko'rinadi
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Dastur nomi *</Label>
              <Input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="HTApp"
                className="text-lg font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label>Dastur logosi</Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "logo");
                }}
              />
              
              {resolvedLogoUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors">
                  <img
                    src={resolvedLogoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-contain rounded-lg border bg-white p-1"
                  />
                  <span className="flex-1 text-sm truncate">{appLogoUrl?.split("/").pop()}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveImage("logo")}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {uploadingLogo ? (
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Logo rasmini yuklash uchun bosing
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dastur tavsifi</Label>
            <Textarea
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              placeholder="Dastur haqida qisqacha tavsif"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Dastur maqsadi va vazifalari</Label>
            <Textarea
              value={appMission}
              onChange={(e) => setAppMission(e.target.value)}
              placeholder="Dasturning asosiy maqsadi va vazifalari"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Font Settings */}
      <Card className="shadow-card border-0 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-secondary via-primary to-accent" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Type className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <CardTitle>Shrift sozlamalari</CardTitle>
              <CardDescription>
                Matn hajmlarini o'zingizga qulay qilib sozlang - o'zgarishlar real vaqtda ko'rsatiladi
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {fontConfigs.map((config) => (
            <div key={config.label} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">{config.label}</Label>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span 
                    className="px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg font-mono font-bold text-primary text-lg"
                  >
                    {config.value}px
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground font-medium w-10">{config.min}px</span>
                <Slider
                  value={[config.value]}
                  onValueChange={([value]) => config.setValue(value)}
                  min={config.min}
                  max={config.max}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground font-medium w-10">{config.max}px</span>
              </div>
              {/* Live Preview */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-dashed">
                <p style={{ fontSize: `${config.value}px` }} className="text-foreground transition-all duration-200">
                  Namuna: {config.label} ko'rinishi ✨
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Login Page Background */}
      <Card className="shadow-card border-0 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-accent via-primary to-secondary" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Image className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle>Kirish sahifasi foni</CardTitle>
              <CardDescription>
                O'quvchilar kirish sahifasining chap qismida ko'rsatiladigan fon rasmi
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Fon rasmi</Label>
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, "bg");
              }}
            />

            {resolvedBgUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors">
                  <img
                    src={resolvedBgUrl}
                    alt="Background"
                    className="w-20 h-12 object-cover rounded-lg border"
                  />
                  <span className="flex-1 text-sm truncate">{loginBgImageUrl?.split("/").pop()}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => bgInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveImage("bg")}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => bgInputRef.current?.click()}
              >
                {uploadingBg ? (
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
                ) : (
                  <>
                    <Image className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Fon rasmini yuklash uchun bosing
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tavsiya: 1920x1080 o'lchamda
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Qoramtir qatlam shaffofligi</Label>
              <span className="px-3 py-1 bg-primary/10 rounded-lg text-sm font-mono font-medium text-primary">
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
            <Slider
              value={[overlayOpacity]}
              onValueChange={([value]) => setOverlayOpacity(value)}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              0% - shaffof (rasm to'liq ko'rinadi), 100% - qoramtir (rasm ko'rinmaydi)
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Ko'rinishi</Label>
            <div
              className="relative h-48 rounded-xl overflow-hidden border-2 shadow-lg"
              style={{
                backgroundImage: resolvedBgUrl ? `url(${resolvedBgUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: resolvedBgUrl ? undefined : "hsl(var(--sidebar))",
              }}
            >
              <div
                className="absolute inset-0 bg-sidebar"
                style={{ opacity: overlayOpacity }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  {resolvedLogoUrl ? (
                    <img src={resolvedLogoUrl} alt="Logo" className="w-16 h-16 mx-auto mb-3 object-contain" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mx-auto mb-3 flex items-center justify-center">
                      <Sparkles className="w-8 h-8" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold drop-shadow-lg">{appName || "HTApp"}</h3>
                  <p className="text-sm text-white/80 drop-shadow">{appDescription || "O'quv platformasi"}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          size="lg" 
          onClick={handleSave} 
          disabled={saving}
          className="gap-2 px-8"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Saqlash
        </Button>
      </div>
    </div>
  );
}
