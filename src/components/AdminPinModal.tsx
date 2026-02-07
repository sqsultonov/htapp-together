import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Shield, Lock } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/database";

interface AdminPinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AdminPinModal({ open, onOpenChange, onSuccess }: AdminPinModalProps) {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setPin("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      toast.error("4 xonali PIN kiriting");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await db
        .from("admin_settings")
        .select("pin_hash")
        .maybeSingle();

      if (error) throw error;

      if (data?.pin_hash === pin) {
        toast.success("Admin tizimiga xush kelibsiz!");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error("Noto'g'ri PIN kod");
        setPin("");
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Admin kirish</DialogTitle>
          <DialogDescription className="text-center">
            Davom etish uchun 4 xonali PIN kodni kiriting
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Lock className="w-4 h-4" />
            <span>Maxfiy PIN kod</span>
          </div>
          
          <InputOTP
            maxLength={4}
            value={pin}
            onChange={setPin}
            onComplete={handleSubmit}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={pin.length !== 4 || isLoading}
          >
            {isLoading ? "Tekshirilmoqda..." : "Kirish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
