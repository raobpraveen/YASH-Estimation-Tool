import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FolderKanban, TrendingUp, DollarSign, Users, 
  FileCheck, FileClock, FileX, FileEdit,
  Bell, ArrowRight, CheckCircle, XCircle, Clock, Filter, X,
  Cpu, MapPin, Briefcase, UserCircle
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_COLORS = {
  draft: "#6B7280",
  in_review: "#F59E0B", 
  approved: "#10B981",
  rejected: "#EF4444"
};

const CHART_COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    customerId: "",
  });

  useEffect(() => {
    fetchDashboardData();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error("Failed to fetch customers");
    }
  };

  const fetchDashboardData = async () => {
    try {
      let url = `${API}/dashboard/analytics`;
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append("date_from", filters.dateFrom);
      if (filters.dateTo) params.append("date_to", filters.dateTo);
      if (filters.customerId) params.append("customer_id", filters.customerId);
      if (params.toString()) url += `?${params.toString()}`;

      const [analyticsRes, notificationsRes] = await Promise.all([
        axios.get(url),
        axios.get(`${API}/notifications?unread_only=true`)
      ]);
      setAnalytics(analyticsRes.data);
      setNotifications(notificationsRes.data.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setLoading(true);
    fetchDashboardData();
  };

  const clearFilters = () => {
    setFilters({ dateFrom: "", dateTo: "", customerId: "" });
    setLoading(true);
    setTimeout(() => fetchDashboardData(), 100);
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Failed to mark notification as read");
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "review_request": return <Clock className="w-4 h-4 text-amber-500" />;
      case "approved": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0EA5E9]"></div>
      </div>
    );
  }

  const statusData = analytics ? [
    { name: "Draft", value: analytics.projects_by_status?.draft || 0, color: STATUS_COLORS.draft },
    { name: "In Review", value: analytics.projects_by_status?.in_review || 0, color: STATUS_COLORS.in_review },
    { name: "Approved", value: analytics.projects_by_status?.approved || 0, color: STATUS_COLORS.approved },
    { name: "Rejected", value: analytics.projects_by_status?.rejected || 0, color: STATUS_COLORS.rejected },
  ].filter(item => item.value > 0) : [];

  return (
    <div data-testid="dashboard" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Dashboard</h1>
          <p className="text-base text-gray-600 mt-2">Project estimation analytics and overview</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-cyan-50 border-cyan-300" : ""}
          data-testid="toggle-filters-button"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border border-cyan-200 bg-cyan-50/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  data-testid="filter-date-from"
                />
              </div>
              <div>
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  data-testid="filter-date-to"
                />
              </div>
              <div>
                <Label>Customer</Label>
                <Select 
                  value={filters.customerId || "all"} 
                  onValueChange={(v) => setFilters({ ...filters, customerId: v === "all" ? "" : v })}
                >
                  <SelectTrigger data-testid="filter-customer">
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={applyFilters} className="bg-[#0EA5E9]" data-testid="apply-filters">
                  Apply
                </Button>
                <Button variant="outline" onClick={clearFilters} data-testid="clear-filters">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-[#E2E8F0] shadow-sm" data-testid="total-projects-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#0EA5E9]" />
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-mono tabular-nums text-[#0F172A]">
              {analytics?.total_projects || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-[#E2E8F0] shadow-sm" data-testid="total-estimation-value-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#10B981]" />
              Total Value of Estimations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-mono tabular-nums text-[#10B981]">
              {formatCurrency(analytics?.total_revenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-sm" data-testid="approved-projects-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#10B981]" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-mono tabular-nums text-[#10B981]">
              {analytics?.projects_by_status?.approved || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-sm" data-testid="pending-review-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileClock className="w-4 h-4 text-[#F59E0B]" />
              In Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-mono tabular-nums text-[#F59E0B]">
              {analytics?.projects_by_status?.in_review || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 - Status + Revenue Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Projects"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">No project data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Estimation Value Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.monthly_data?.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.monthly_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [formatCurrency(value), "Value"]} labelFormatter={(label) => `Month: ${label}`} />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ fill: "#10B981", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">No trend data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Technology + Project Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-[#E2E8F0] shadow-sm" data-testid="technology-kpi-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#8B5CF6]" />
              By Technology
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.technology_data?.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.technology_data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [formatCurrency(value), "Value"]} />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">No technology data</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-sm" data-testid="project-type-kpi-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#0EA5E9]" />
              By Project Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.project_type_data?.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.project_type_data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [formatCurrency(value), "Value"]} />
                    <Bar dataKey="value" fill="#0EA5E9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">No project type data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 - Location + Sales Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-[#E2E8F0] shadow-sm" data-testid="location-kpi-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#10B981]" />
              By Project Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.location_data?.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.location_data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [formatCurrency(value), "Value"]} />
                    <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">No location data</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-sm" data-testid="sales-manager-kpi-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-[#F59E0B]" />
              By Sales Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.sales_manager_data?.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.sales_manager_data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [formatCurrency(value), "Value"]} />
                    <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">No sales manager data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Customers + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#8B5CF6]" />
              Top Customers by Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.top_customers?.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.top_customers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [formatCurrency(value), "Value"]} />
                    <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">No customer data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#0EA5E9]" />
              Recent Notifications
              {notifications.length > 0 && (
                <Badge className="bg-red-500 text-white">{notifications.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    data-testid={`notification-${notification.id}`}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#0F172A] truncate">{notification.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{notification.project_number}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" variant="ghost"
                        className="text-[#0EA5E9] hover:bg-[#0EA5E9]/10 h-8 w-8 p-0"
                        onClick={() => navigate(`/estimator?edit=${notification.project_id}`)}
                        title="View Project"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" variant="ghost"
                        className="text-gray-400 hover:bg-gray-200 h-8 w-8 p-0"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as Read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-gray-500">
                <Bell className="w-12 h-12 text-gray-300 mb-3" />
                <p>No new notifications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
              onClick={() => navigate("/estimator")}
              data-testid="quick-new-estimate"
            >
              <FileEdit className="w-6 h-6" />
              <span>New Estimate</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
              onClick={() => navigate("/projects")}
              data-testid="quick-view-projects"
            >
              <FolderKanban className="w-6 h-6" />
              <span>View Projects</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10"
              onClick={() => navigate("/customers")}
              data-testid="quick-manage-customers"
            >
              <Users className="w-6 h-6" />
              <span>Manage Customers</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10"
              onClick={() => navigate("/proficiency-rates")}
              data-testid="quick-update-rates"
            >
              <TrendingUp className="w-6 h-6" />
              <span>Update Rates</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
