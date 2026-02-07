import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useInstructor } from "@/lib/instructor-context";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff } from "lucide-react";

interface InstructorLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstructorLoginModal({ open, onOpenChange }: InstructorLoginModalProps) {
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useInstructor();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginName.trim() || !password.trim()) {
      toast.error("Login va parolni kiriting");
      return;
    }

    setIsLoading(true);
    const result = await login(loginName.trim(), password);
    setIsLoading(false);

    if (result.success) {
      toast.success("Muvaffaqiyatli kirdingiz!");
      onOpenChange(false);
      setLoginName("");
      setPassword("");
      navigate("/instructor");
    } else {
      toast.error(result.error || "Xatolik yuz berdi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl">Mashg'ulot rahbari</DialogTitle>
              <DialogDescription>
                Tizimga kirish uchun login va parolni kiriting
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="instructor-login">Login</Label>
            <Input
              id="instructor-login"
              type="text"
              placeholder="login_name"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructor-password">Parol</Label>
            <div className="relative">
              <Input
                id="instructor-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Kirilyapti..." : "Kirish"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
