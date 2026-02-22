import { Outlet, NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Cpu, 
  Briefcase as BriefcaseIcon,
  MapPin, 
  Layers, 
  Briefcase, 
  Calculator, 
  FolderKanban 
} from "lucide-react";

const Layout = () => {
  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/technologies", icon: Cpu, label: "Technologies" },
    { path: "/project-types", icon: BriefcaseIcon, label: "Project Types" },
    { path: "/base-locations", icon: MapPin, label: "Base Locations" },
    { path: "/skills", icon: Layers, label: "Skills" },
    { path: "/proficiency-rates", icon: Briefcase, label: "Proficiency Rates" },
    { path: "/estimator", icon: Calculator, label: "Estimator" },
    { path: "/projects", icon: FolderKanban, label: "Projects" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-[#0F172A] sidebar-texture flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Project Estimator</h1>
          <p className="text-xs text-white/60 mt-1">IT Cost Calculator</p>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
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
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/40">© 2026 Project Estimator</p>
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