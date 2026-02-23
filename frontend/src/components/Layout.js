import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { 
  LayoutDashboard,
  Users,
  Cpu, 
  Briefcase as BriefcaseIcon,
  MapPin, 
  Layers, 
  Briefcase, 
  Calculator, 
  FolderKanban,
  LogOut,
  User,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const Layout = ({ user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/customers", icon: Users, label: "Customers" },
    { path: "/technologies", icon: Cpu, label: "Technologies" },
    { path: "/project-types", icon: BriefcaseIcon, label: "Project Types" },
    { path: "/base-locations", icon: MapPin, label: "Base Locations" },
    { path: "/skills", icon: Layers, label: "Skills" },
    { path: "/proficiency-rates", icon: Briefcase, label: "Proficiency Rates" },
    { path: "/estimator", icon: Calculator, label: "Estimator" },
    { path: "/projects", icon: FolderKanban, label: "Projects" },
  ];

  // Add User Management for admins
  if (user?.role === "admin") {
    navItems.push({ path: "/users", icon: UserCog, label: "User Management" });
  }

  // Add Settings for all users
  navItems.push({ path: "/settings", icon: Settings, label: "Settings" });

  const getRoleBadge = (role) => {
    const config = {
      admin: { label: "Admin", color: "bg-red-500/20 text-red-300" },
      approver: { label: "Approver", color: "bg-amber-500/20 text-amber-300" },
      user: { label: "User", color: "bg-blue-500/20 text-blue-300" },
    };
    return config[role] || config.user;
  };

  return (
    <div className="flex min-h-screen">
      <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-[#0F172A] sidebar-texture flex flex-col transition-all duration-300`}>
        {/* Header with logos */}
        <div className={`p-4 border-b border-white/10 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {isCollapsed ? (
            <img 
              src="/estipro-logo-new.png" 
              alt="EstiPro" 
              className="h-8 w-8 object-contain"
            />
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src="/yash-logo-new.png" 
                  alt="YASH Technologies" 
                  className="h-8"
                />
                <img 
                  src="/estipro-logo-new.png" 
                  alt="YASH EstiPro" 
                  className="h-8"
                />
              </div>
              <p className="text-xs text-white/60">Project Cost Estimator</p>
            </>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mx-auto my-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
          data-testid="toggle-sidebar"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-white/70" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white/70" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg ${
                      isActive
                        ? "bg-[#0EA5E9] text-white shadow-lg"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    } ${isCollapsed ? 'justify-center' : ''}`
                  }
                  data-testid={`nav-${item.label.toLowerCase().replace(/ /g, '-')}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info */}
        {user && (
          <div className={`p-3 border-t border-white/10 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            {!isCollapsed && (
              <>
                <div className="flex items-center gap-3 mb-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-white/50 truncate">{user.email}</p>
                  </div>
                </div>
                <Badge className={`${getRoleBadge(user.role).color} text-xs mb-3 ml-2`}>
                  {getRoleBadge(user.role).label}
                </Badge>
              </>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className={`text-white/70 hover:text-white hover:bg-white/10 ${isCollapsed ? 'w-10 h-10 p-0' : 'w-full'}`}
              data-testid="logout-button"
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        )}

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-white/10">
            <p className="text-xs text-white/40">© 2026 YASH Technologies</p>
          </div>
        )}
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
