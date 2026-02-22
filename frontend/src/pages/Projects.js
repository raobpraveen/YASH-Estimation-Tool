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
    const baseCost = project.resources.reduce((sum, r) => {
      const resourceCost = r.avg_monthly_salary * r.man_months;
      const logisticsCost = r.is_onsite
        ? (r.per_diem_monthly + r.accommodation_monthly + r.local_conveyance_monthly) * r.man_months +
          r.flight_cost_per_trip * r.num_trips +
          r.visa_cost +
          r.insurance_cost +
          r.misc_cost
        : 0;
      return sum + resourceCost + logisticsCost;
    }, 0);

    const withOverhead = baseCost * (1 + project.overhead_percentage / 100);
    const sellingPrice = withOverhead * (1 + project.profit_margin_percentage / 100);
    return { baseCost, withOverhead, sellingPrice };
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
                  const { sellingPrice } = calculateProjectValue(project);
                  return (
                    <TableRow key={project.id} data-testid={`project-row-${project.id}`}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{project.description || "—"}</TableCell>
                      <TableCell className="text-right">{project.resources.length}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold text-[#10B981]">
                        ${sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <h3 className="font-semibold text-[#0F172A] mb-1">Overhead Percentage</h3>
                    <p className="font-mono text-lg">{selectedProject.overhead_percentage}%</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F172A] mb-1">Profit Margin Percentage</h3>
                    <p className="font-mono text-lg">{selectedProject.profit_margin_percentage}%</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-3">Resources</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead className="text-right">Salary/Month</TableHead>
                        <TableHead className="text-right">Man-Months</TableHead>
                        <TableHead className="text-center">Onsite</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProject.resources.map((resource, idx) => (
                        <TableRow key={idx} className={resource.is_onsite ? "bg-blue-50/50" : ""}>
                          <TableCell className="font-medium">{resource.skill_name}</TableCell>
                          <TableCell>{resource.proficiency_level}</TableCell>
                          <TableCell className="text-right font-mono">${resource.avg_monthly_salary.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">{resource.man_months}</TableCell>
                          <TableCell className="text-center">
                            {resource.is_onsite && <Plane className="w-4 h-4 inline text-[#0EA5E9]" />}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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