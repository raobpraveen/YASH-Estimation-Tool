import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Briefcase, FolderKanban, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSkills: 0,
    totalRates: 0,
    totalProjects: 0,
    avgProjectValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [skillsRes, ratesRes, projectsRes] = await Promise.all([
        axios.get(`${API}/skills`),
        axios.get(`${API}/proficiency-rates`),
        axios.get(`${API}/projects`),
      ]);

      const projects = projectsRes.data;
      const avgValue = projects.length > 0
        ? projects.reduce((sum, p) => sum + calculateProjectValue(p), 0) / projects.length
        : 0;

      setStats({
        totalSkills: skillsRes.data.length,
        totalRates: ratesRes.data.length,
        totalProjects: projects.length,
        avgProjectValue: avgValue,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProjectValue = (project) => {
    if (!project.grid_allocations || project.grid_allocations.length === 0) return 0;
    
    const costWithOverhead = project.grid_allocations.reduce((sum, allocation) => {
      const totalManMonths = Object.values(allocation.phase_allocations || {}).reduce((s, v) => s + v, 0);
      const baseSalaryCost = allocation.avg_monthly_salary * totalManMonths;
      const logisticsCost = allocation.is_onsite
        ? (allocation.per_diem_monthly + allocation.accommodation_monthly + allocation.local_conveyance_monthly) *
            totalManMonths +
          allocation.flight_cost_per_trip * allocation.num_trips +
          allocation.visa_cost +
          allocation.insurance_cost +
          allocation.misc_cost
        : 0;
      const subtotal = baseSalaryCost + logisticsCost;
      const withOverhead = subtotal * (1 + allocation.overhead_percentage / 100);
      return sum + withOverhead;
    }, 0);

    const sellingPrice = costWithOverhead * (1 + project.profit_margin_percentage / 100);
    return sellingPrice;
  };

  const statCards = [
    { title: "Total Skills", value: stats.totalSkills, icon: Layers, color: "#0EA5E9" },
    { title: "Proficiency Rates", value: stats.totalRates, icon: Briefcase, color: "#10B981" },
    { title: "Projects", value: stats.totalProjects, icon: FolderKanban, color: "#F59E0B" },
    {
      title: "Avg. Project Value",
      value: `$${stats.avgProjectValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: "#0F172A",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div data-testid="dashboard">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Dashboard</h1>
        <p className="text-base text-gray-600 mt-2">Overview of your project estimation system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="border border-[#E2E8F0] shadow-sm" data-testid={`stat-card-${index}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold font-mono tabular-nums" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#0F172A]">Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#0EA5E9] text-white flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <h3 className="font-semibold text-[#0F172A]">Add Skills</h3>
                <p className="text-sm text-gray-600">Define your technology skills in the Skills section</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#0EA5E9] text-white flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <h3 className="font-semibold text-[#0F172A]">Configure Proficiency Rates</h3>
                <p className="text-sm text-gray-600">Set monthly salary rates for each skill and proficiency level</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#0EA5E9] text-white flex items-center justify-center font-bold text-sm">3</div>
              <div>
                <h3 className="font-semibold text-[#0F172A]">Create Estimates</h3>
                <p className="text-sm text-gray-600">Use the Estimator to calculate project costs with overhead and profit margins</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;