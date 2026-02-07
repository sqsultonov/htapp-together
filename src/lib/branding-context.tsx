import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "@/lib/database";

interface BrandingSettings {
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

interface BrandingContextType {
  branding: BrandingSettings;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaultBranding: BrandingSettings = {
  app_name: "HTApp",
  app_logo_url: null,
  app_description: "O'quv platformasi - darslar, testlar va o'zlashtirish ko'rsatkichlarini bir joyda boshqaring",
  app_mission: "Zamonaviy ta'lim tizimi orqali o'quvchilarning bilim va ko'nikmalarini oshirish",
  login_bg_image_url: null,
  login_bg_overlay_opacity: 0.7,
  heading_font_size: 32,
  body_font_size: 16,
  sidebar_font_size: 14,
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: true,
  refetch: async () => {},
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [loading, setLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const { data, error } = await db
        .from("app_settings")
        .select("app_name, app_logo_url, app_description, app_mission, login_bg_image_url, login_bg_overlay_opacity, heading_font_size, body_font_size, sidebar_font_size")
        .maybeSingle();

      if (!error && data) {
        setBranding({
          app_name: data.app_name || defaultBranding.app_name,
          app_logo_url: data.app_logo_url,
          app_description: data.app_description || defaultBranding.app_description,
          app_mission: data.app_mission || defaultBranding.app_mission,
          login_bg_image_url: data.login_bg_image_url,
          login_bg_overlay_opacity: Number(data.login_bg_overlay_opacity) || defaultBranding.login_bg_overlay_opacity,
          heading_font_size: data.heading_font_size || defaultBranding.heading_font_size,
          body_font_size: data.body_font_size || defaultBranding.body_font_size,
          sidebar_font_size: data.sidebar_font_size || defaultBranding.sidebar_font_size,
        });
      }
    } catch (err) {
      console.log("Branding fetch error (using defaults):", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading, refetch: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
