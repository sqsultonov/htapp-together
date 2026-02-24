import { useStudent } from "@/lib/student-context";
import { useBranding } from "@/lib/branding-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Trophy,
  LogOut,
  GraduationCap,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Bosh sahifa", path: "/dashboard" },
  { icon: BookOpen, label: "Darslar", path: "/lessons" },
  { icon: FileText, label: "Testlar", path: "/tests" },
  { icon: Trophy, label: "Natijalar", path: "/results" },
];

export function StudentSidebar() {
  const { student, logout } = useStudent();
  const { branding } = useBranding();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={`flex items-center gap-3 px-2 py-3 ${isCollapsed ? "justify-center" : ""}`}>
          {branding.app_logo_url ? (
            <img
              src={branding.app_logo_url}
              alt={branding.app_name}
              className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
          )}
          {!isCollapsed && (
            <span className="font-bold text-lg text-sidebar-foreground truncate">
              {branding.app_name}
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink to={item.path}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className={`p-2 ${isCollapsed ? "flex flex-col items-center gap-2" : ""}`}>
          {/* User info */}
          <div className={`flex items-center gap-3 mb-2 ${isCollapsed ? "flex-col" : ""}`}>
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {student ? getInitials(student.full_name) : "?"}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground">
                  {student?.full_name}
                </p>
                <p className="text-xs text-sidebar-foreground/60">
                  {student?.class_name || "Noma'lum"}
                </p>
              </div>
            )}
          </div>

          {/* Logout button */}
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            className={`text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent ${
              isCollapsed ? "w-9 h-9" : "w-full justify-start"
            }`}
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span className="ml-2">Chiqish</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
