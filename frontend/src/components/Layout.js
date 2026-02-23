import { useState, useEffect, useCallback } from "react";
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
  History
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const Layout = ({ user, onLogout }) => {
  // Load saved preference from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [isHovering, setIsHovering] = useState(false);

  // Save preference to localStorage when changed
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  // Keyboard shortcut: Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Determine if sidebar should show expanded state (collapsed but hovering)
  const showExpanded = !isCollapsed || isHovering;

  // Main navigation items
  const mainNavItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/estimator", icon: Calculator, label: "Estimator" },
    { path: "/projects", icon: FolderKanban, label: "Projects" },
  ];

  // Master Data items
  const masterDataItems = [
    { path: "/customers", icon: Users, label: "Customers" },
    { path: "/technologies", icon: Cpu, label: "Technologies" },
    { path: "/project-types", icon: BriefcaseIcon, label: "Project Types" },
    { path: "/base-locations", icon: MapPin, label: "Base Locations" },
    { path: "/skills", icon: Layers, label: "Skills" },
    { path: "/proficiency-rates", icon: Briefcase, label: "Proficiency Rates" },
  ];

  // Admin items
  const adminItems = [];
  if (user?.role === "admin") {
    adminItems.push({ path: "/users", icon: UserCog, label: "User Management" });
    adminItems.push({ path: "/audit-logs", icon: History, label: "Audit Logs" });
  }

  // Settings
  const settingsItems = [
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const getRoleBadge = (role) => {
    const config = {
      admin: { label: "Admin", color: "bg-red-500/20 text-red-300" },
      approver: { label: "Approver", color: "bg-amber-500/20 text-amber-300" },
      user: { label: "User", color: "bg-blue-500/20 text-blue-300" },
    };
    return config[role] || config.user;
  };

  const NavItem = ({ item }) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg ${
                isActive
                  ? "bg-[#0EA5E9] text-white shadow-lg"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              } ${!showExpanded ? 'justify-center' : ''}`
            }
            data-testid={`nav-${item.label.toLowerCase().replace(/ /g, '-')}`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {showExpanded && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        </TooltipTrigger>
        {!showExpanded && (
          <TooltipContent side="right" className="bg-[#1E293B] text-white border-white/10">
            {item.label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  const NavSection = ({ title, items }) => (
    <>
      {showExpanded && items.length > 0 && (
        <div className="px-3 py-2 mt-4 first:mt-0">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{title}</p>
        </div>
      )}
      {!showExpanded && items.length > 0 && (
        <div className="h-px bg-white/10 mx-2 my-3" />
      )}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.path}>
            <NavItem item={item} />
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <div className="flex min-h-screen">
      <aside 
        className={`${showExpanded ? 'w-64' : 'w-16'} bg-[#0F172A] sidebar-texture flex flex-col transition-all duration-300 ease-in-out`}
        onMouseEnter={() => isCollapsed && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Header with logos */}
        <div className={`p-4 border-b border-white/10 ${!showExpanded ? 'flex justify-center' : ''}`}>
          {!showExpanded ? (
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
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="mx-auto my-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                data-testid="toggle-sidebar"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-white/70" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-white/70" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1E293B] text-white border-white/10">
              {isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <NavSection title="Main" items={mainNavItems} />
          <NavSection title="Master Data" items={masterDataItems} />
          {adminItems.length > 0 && <NavSection title="Admin" items={adminItems} />}
          <NavSection title="" items={settingsItems} />
        </nav>

        {/* User info */}
        {user && (
          <div className={`p-3 border-t border-white/10 ${!showExpanded ? 'flex flex-col items-center' : ''}`}>
            {showExpanded && (
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
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onLogout}
                    className={`text-white/70 hover:text-white hover:bg-white/10 ${!showExpanded ? 'w-10 h-10 p-0' : 'w-full'}`}
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4" />
                    {showExpanded && <span className="ml-2">Sign Out</span>}
                  </Button>
                </TooltipTrigger>
                {!showExpanded && (
                  <TooltipContent side="right" className="bg-[#1E293B] text-white border-white/10">
                    Sign Out
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Footer */}
        {showExpanded && (
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
