import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FolderKanban, TrendingUp, DollarSign, Users, 
  FileCheck, FileClock, FileX, FileEdit,
  Bell, ArrowRight, CheckCircle, XCircle, Clock
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ["#10B981", "#0EA5E9", "#F59E0B", "#EF4444"];
const STATUS_COLORS = {
  draft: "#6B7280",
  in_review: "#F59E0B", 
  approved: "#10B981",
  rejected: "#EF4444"
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, notificationsRes] = await Promise.all([
        axios.get(`${API}/dashboard/analytics`),
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

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Failed to mark notification as read");
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
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
        <p className="text-lg text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  const statusData = analytics ? [
    { name: "Draft", value: analytics.projects_by_status.draft || 0, color: STATUS_COLORS.draft },
    { name: "In Review", value: analytics.projects_by_status.in_review || 0, color: STATUS_COLORS.in_review },
    { name: "Approved", value: analytics.projects_by_status.approved || 0, color: STATUS_COLORS.approved },
    { name: "Rejected", value: analytics.projects_by_status.rejected || 0, color: STATUS_COLORS.rejected },
  ].filter(item => item.value > 0) : [];

  return (
    <div data-testid="dashboard" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Dashboard</h1>
          <p className="text-base text-gray-600 mt-2">Project estimation analytics and overview</p>
        </div>
        <Button 
          onClick={() => navigate("/estimator")} 
          className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90"
          data-testid="create-project-btn"
        >
          Create New Estimate
        </Button>
      </div>

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

        <Card className="border border-[#E2E8F0] shadow-sm" data-testid="total-revenue-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#10B981]" />
              Total Revenue
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects by Status */}
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
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
              <div className="h-64 flex items-center justify-center text-gray-500">
                No project data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="border border-[#E2E8F0] shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.monthly_data?.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.monthly_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)} 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), "Revenue"]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: "#10B981", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#8B5CF6]" />
              Top Customers by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.top_customers?.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.top_customers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(value) => formatCurrency(value)}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => [formatCurrency(value), "Revenue"]} />
                    <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No customer data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
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
                      <p className="font-semibold text-sm text-[#0F172A] truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.project_number}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-[#0EA5E9] hover:bg-[#0EA5E9]/10 h-8 w-8 p-0"
                        onClick={() => navigate(`/estimator?edit=${notification.project_id}`)}
                        title="View Project"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
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
            >
              <FileEdit className="w-6 h-6" />
              <span>New Estimate</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
              onClick={() => navigate("/projects")}
            >
              <FolderKanban className="w-6 h-6" />
              <span>View Projects</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10"
              onClick={() => navigate("/customers")}
            >
              <Users className="w-6 h-6" />
              <span>Manage Customers</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10"
              onClick={() => navigate("/proficiency-rates")}
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
