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
  UserCog
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const Layout = ({ user, onLogout }) => {
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
      <aside className="w-64 bg-[#0F172A] sidebar-texture flex flex-col">
        <div className="p-6 border-b border-white/10">
          <img 
            src="/yash-logo.svg" 
            alt="YASH Technologies" 
            className="h-8 mb-3"
          />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Project Estimator</h1>
          <p className="text-xs text-white/60 mt-1">IT Cost Calculator</p>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-[#0EA5E9] text-white shadow-lg"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                  data-testid={`nav-${item.label.toLowerCase().replace(/ /g, '-')}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {user && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white/50 truncate">{user.email}</p>
                </div>
              </div>
            </div>
            <Badge className={`${getRoleBadge(user.role).color} text-xs mb-3 ml-2`}>
              {getRoleBadge(user.role).label}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="w-full text-white/70 hover:text-white hover:bg-white/10"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/40">© 2026 YASH Technologies</p>
        </div>
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