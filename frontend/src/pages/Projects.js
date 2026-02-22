import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Trash2, Plane } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

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
    try {
      await axios.delete(`${API}/projects/${id}`);
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const handleViewProject = async (projectId) => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}`);
      setSelectedProject(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error("Failed to load project details");
    }
  };

  const calculateProjectValue = (project) => {
    // Handle wave-based structure
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
        const logisticsCost = allocation.is_onsite
          ? ((allocation.per_diem_monthly || 0) + (allocation.accommodation_monthly || 0) + (allocation.local_conveyance_monthly || 0)) * manMonths +
            ((allocation.flight_cost_per_trip || 0) + (allocation.visa_insurance_cost || 0)) * (allocation.num_trips || 0)
          : 0;
        
        const baseCost = baseSalaryCost + logisticsCost;
        const overheadCost = baseCost * ((allocation.overhead_percentage || 0) / 100);
        const costToCompany = baseCost + overheadCost;
        
        totalBaseCost += baseCost;
        totalCostToCompany += costToCompany;
      });
    });

    // Selling Price = Cost to Company / (1 - Profit Margin %)
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
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Resources</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const { sellingPrice, totalMM, resourceCount } = calculateProjectValue(project);
                  return (
                    <TableRow key={project.id} data-testid={`project-row-${project.id}`}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{project.description || "—"}</TableCell>
                      <TableCell className="text-right">{resourceCount}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold text-[#10B981]">
                        ${sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProject(project.id)}
                            className="text-[#0EA5E9] hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                            data-testid={`view-project-${project.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-[#0F172A]">{selectedProject.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {selectedProject.description && (
                  <div>
                    <h3 className="font-semibold text-[#0F172A] mb-1">Description</h3>
                    <p className="text-gray-600">{selectedProject.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-[#0F172A] mb-1">Profit Margin Percentage</h3>
                    <p className="font-mono text-lg">{selectedProject.profit_margin_percentage}%</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F172A] mb-1">Project Phases</h3>
                    <p className="text-sm">{selectedProject.phases?.join(", ") || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-3">Resource Allocations</h3>
                  {selectedProject.grid_allocations && selectedProject.grid_allocations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-[#E2E8F0]">
                        <thead>
                          <tr className="bg-[#F1F5F9]">
                            <th className="border border-[#E2E8F0] p-2 text-left text-sm">Skill</th>
                            <th className="border border-[#E2E8F0] p-2 text-left text-sm">Level</th>
                            <th className="border border-[#E2E8F0] p-2 text-left text-sm">Location</th>
                            <th className="border border-[#E2E8F0] p-2 text-center text-sm">Onsite</th>
                            <th className="border border-[#E2E8F0] p-2 text-right text-sm">Total MM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProject.grid_allocations.map((allocation, idx) => {
                            const totalMM = Object.values(allocation.phase_allocations || {}).reduce((s, v) => s + v, 0);
                            return (
                              <tr key={idx} className={allocation.is_onsite ? "bg-blue-50/30" : ""}>
                                <td className="border border-[#E2E8F0] p-2 text-sm">{allocation.skill_name}</td>
                                <td className="border border-[#E2E8F0] p-2 text-sm">{allocation.proficiency_level}</td>
                                <td className="border border-[#E2E8F0] p-2 text-sm">{allocation.base_location_name}</td>
                                <td className="border border-[#E2E8F0] p-2 text-center">
                                  {allocation.is_onsite && <Plane className="w-4 h-4 inline text-[#0EA5E9]" />}
                                </td>
                                <td className="border border-[#E2E8F0] p-2 text-right font-mono">{totalMM.toFixed(1)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No resources allocated</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-[#0F172A] mb-3">Cost Summary</h3>
                  <div className="space-y-2">
                    {(() => {
                      const { baseCost, withOverhead, sellingPrice } = calculateProjectValue(selectedProject);
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Base Cost:</span>
                            <span className="font-mono font-semibold">
                              ${baseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost + Overhead ({selectedProject.overhead_percentage}%):</span>
                            <span className="font-mono font-semibold">
                              ${withOverhead.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between text-lg font-bold">
                            <span>Selling Price:</span>
                            <span className="font-mono text-[#10B981]">
                              ${sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;