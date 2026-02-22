import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Edit2, Copy, FileText, History, GitCompare } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      toast.error("Failed to fetch projects");
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    
    try {
      await axios.delete(`${API}/projects/${id}`);
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const handleCloneProject = async (id) => {
    try {
      const response = await axios.post(`${API}/projects/${id}/clone`);
      toast.success(`Project cloned as ${response.data.project_number}`);
      fetchProjects();
    } catch (error) {
      toast.error("Failed to clone project");
    }
  };

  const calculateProjectValue = (project) => {
    if (!project.waves || project.waves.length === 0) {
      return { baseCost: 0, withOverhead: 0, sellingPrice: 0, totalMM: 0, resourceCount: 0 };
    }
    
    let totalBaseCost = 0;
    let totalCostToCompany = 0;
    let totalMM = 0;
    let resourceCount = 0;
    const profitMargin = project.profit_margin_percentage || 35;
    
    project.waves.forEach((wave) => {
      if (!wave.grid_allocations) return;
      resourceCount += wave.grid_allocations.length;
      
      wave.grid_allocations.forEach((allocation) => {
        const manMonths = Object.values(allocation.phase_allocations || {}).reduce((s, v) => s + v, 0);
        totalMM += manMonths;
        
        const baseSalaryCost = (allocation.avg_monthly_salary || 0) * manMonths;
        
        // Calculate logistics
        const perDiemCost = allocation.is_onsite ? (allocation.per_diem_daily || 0) * (allocation.per_diem_days || 0) * manMonths : 0;
        const accommodationCost = allocation.is_onsite ? (allocation.accommodation_daily || 0) * (allocation.accommodation_days || 0) * manMonths : 0;
        const conveyanceCost = allocation.is_onsite ? (allocation.local_conveyance_daily || 0) * (allocation.local_conveyance_days || 0) * manMonths : 0;
        const flightCost = allocation.is_onsite ? (allocation.flight_cost_per_trip || 0) * (allocation.num_trips || 0) : 0;
        const visaInsuranceCost = allocation.is_onsite ? (allocation.visa_insurance_per_trip || 0) * (allocation.num_trips || 0) : 0;
        
        const logisticsCost = perDiemCost + accommodationCost + conveyanceCost + flightCost + visaInsuranceCost;
        
        const baseCost = baseSalaryCost + logisticsCost;
        const overheadCost = baseCost * ((allocation.overhead_percentage || 0) / 100);
        const costToCompany = baseCost + overheadCost;
        
        totalBaseCost += baseCost;
        totalCostToCompany += costToCompany;
      });
    });

    const sellingPrice = profitMargin < 100 ? totalCostToCompany / (1 - (profitMargin / 100)) : totalCostToCompany;
    return { baseCost: totalBaseCost, withOverhead: totalCostToCompany, sellingPrice, totalMM, resourceCount };
  };

  return (
    <div data-testid="projects">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Saved Projects</h1>
        <p className="text-base text-gray-600 mt-2">View and manage your project estimates</p>
      </div>

      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#0F172A]">Projects List</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No projects saved yet. Create an estimate in the Estimator page.</p>
              <Button className="mt-4 bg-[#0EA5E9]" onClick={() => navigate("/estimator")}>
                Create New Project
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project #</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Version</TableHead>
                  <TableHead className="text-center">Resources</TableHead>
                  <TableHead className="text-right">Man-Months</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const { sellingPrice, totalMM, resourceCount } = calculateProjectValue(project);
                  return (
                    <TableRow key={project.id} data-testid={`project-row-${project.id}`}>
                      <TableCell className="font-mono font-medium">
                        {project.project_number || "—"}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">{project.name}</TableCell>
                      <TableCell>{project.customer_name || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          v{project.version || 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{resourceCount}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{totalMM.toFixed(1)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold text-[#10B981]">
                        ${sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/projects/${project.id}/summary`)}
                            className="text-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                            title="View Summary"
                            data-testid={`summary-project-${project.id}`}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/projects/${project.id}/compare`)}
                            className="text-indigo-600 hover:text-indigo-600 hover:bg-indigo-600/10"
                            title="Compare Versions"
                            data-testid={`compare-project-${project.id}`}
                          >
                            <GitCompare className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/estimator?edit=${project.id}`)}
                            className="text-[#0EA5E9] hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                            title="Edit"
                            data-testid={`edit-project-${project.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCloneProject(project.id)}
                            className="text-[#F59E0B] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10"
                            title="Clone"
                            data-testid={`clone-project-${project.id}`}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                            title="Delete"
                            data-testid={`delete-project-${project.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Projects;
