import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trash2, Edit2, Copy, FileText, GitCompare, 
  ChevronDown, ChevronRight, Clock, CheckCircle, XCircle, FileEdit,
  Bookmark, BookmarkCheck, Plus
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: FileEdit },
  in_review: { label: "In Review", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [allVersions, setAllVersions] = useState({});
  const [expandedProjects, setExpandedProjects] = useState({});
  const [loadingVersions, setLoadingVersions] = useState({});
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [createFromTemplateDialogOpen, setCreateFromTemplateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchTemplates();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      toast.error("Failed to fetch projects");
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error("Failed to fetch templates");
    }
  };

  const fetchVersions = async (projectId, projectNumber) => {
    if (allVersions[projectNumber]) {
      return; // Already fetched
    }
    
    setLoadingVersions(prev => ({ ...prev, [projectNumber]: true }));
    try {
      const response = await axios.get(`${API}/projects/${projectId}/versions`);
      setAllVersions(prev => ({ ...prev, [projectNumber]: response.data }));
    } catch (error) {
      toast.error("Failed to fetch versions");
    } finally {
      setLoadingVersions(prev => ({ ...prev, [projectNumber]: false }));
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!selectedProject || !templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    try {
      await axios.post(`${API}/projects/${selectedProject.id}/save-as-template?template_name=${encodeURIComponent(templateName)}`);
      toast.success("Project saved as template");
      setTemplateDialogOpen(false);
      setTemplateName("");
      setSelectedProject(null);
      fetchProjects();
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save as template");
    }
  };

  const handleRemoveTemplate = async (projectId) => {
    try {
      await axios.post(`${API}/projects/${projectId}/remove-template`);
      toast.success("Template removed");
      fetchProjects();
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to remove template");
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template");
      return;
    }
    try {
      const response = await axios.post(`${API}/projects/create-from-template/${selectedTemplateId}`);
      toast.success("Project created from template");
      setCreateFromTemplateDialogOpen(false);
      setSelectedTemplateId("");
      navigate(`/estimator?edit=${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create from template");
    }
  };

  const openTemplateDialog = (project) => {
    setSelectedProject(project);
    setTemplateName(project.name);
    setTemplateDialogOpen(true);
  };

  const toggleExpanded = async (project) => {
    const projectNumber = project.project_number;
    const isExpanded = expandedProjects[projectNumber];
    
    if (!isExpanded) {
      await fetchVersions(project.id, projectNumber);
    }
    
    setExpandedProjects(prev => ({
      ...prev,
      [projectNumber]: !prev[projectNumber]
    }));
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    
    try {
      await axios.delete(`${API}/projects/${id}`);
      toast.success("Project deleted successfully");
      fetchProjects();
      // Clear versions cache
      setAllVersions({});
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
      
      const config = wave.logistics_config || {};
      let waveTravelingMM = 0;
      let waveTravelingCount = 0;
      
      wave.grid_allocations.forEach((allocation) => {
        const manMonths = Object.values(allocation.phase_allocations || {}).reduce((s, v) => s + v, 0);
        totalMM += manMonths;
        
        const baseSalaryCost = (allocation.avg_monthly_salary || 0) * manMonths;
        const overheadCost = baseSalaryCost * ((allocation.overhead_percentage || 0) / 100);
        
        totalBaseCost += baseSalaryCost;
        totalCostToCompany += baseSalaryCost + overheadCost;
        
        if (allocation.travel_required) {
          waveTravelingMM += manMonths;
          waveTravelingCount++;
        }
      });
      
      // Calculate wave-level logistics for traveling resources
      if (waveTravelingCount > 0) {
        const perDiem = waveTravelingMM * (config.per_diem_daily || 50) * (config.per_diem_days || 30);
        const accommodation = waveTravelingMM * (config.accommodation_daily || 80) * (config.accommodation_days || 30);
        const conveyance = waveTravelingMM * (config.local_conveyance_daily || 15) * (config.local_conveyance_days || 21);
        const flights = waveTravelingCount * (config.flight_cost_per_trip || 450) * (config.num_trips || 6);
        const visa = waveTravelingCount * (config.visa_medical_per_trip || 400) * (config.num_trips || 6);
        const subtotal = perDiem + accommodation + conveyance + flights + visa;
        const contingency = subtotal * ((config.contingency_percentage || 5) / 100);
        const logistics = subtotal + contingency;
        
        totalCostToCompany += logistics;
      }
    });

    const sellingPrice = profitMargin < 100 ? totalCostToCompany / (1 - (profitMargin / 100)) : totalCostToCompany;
    return { baseCost: totalBaseCost, withOverhead: totalCostToCompany, sellingPrice, totalMM, resourceCount };
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const renderProjectRow = (project, isSubVersion = false) => {
    const { sellingPrice, totalMM, resourceCount } = calculateProjectValue(project);
    const hasVersions = project.version > 1 || (allVersions[project.project_number]?.length > 1);
    const isExpanded = expandedProjects[project.project_number];
    const isLoading = loadingVersions[project.project_number];
    
    return (
      <TableRow 
        key={project.id} 
        className={isSubVersion ? "bg-gray-50/50" : ""}
        data-testid={`project-row-${project.id}`}
      >
        <TableCell className="font-mono font-medium">
          <div className="flex items-center gap-2">
            {!isSubVersion && hasVersions && (
              <button
                onClick={() => toggleExpanded(project)}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={isLoading}
                data-testid={`expand-versions-${project.id}`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
            {isSubVersion && <span className="w-6" />}
            <span className={isSubVersion ? "text-gray-500" : ""}>
              {project.project_number || "—"}
            </span>
          </div>
        </TableCell>
        <TableCell className={`font-medium max-w-xs truncate ${isSubVersion ? "text-gray-600" : ""}`}>
          {project.name}
        </TableCell>
        <TableCell>{project.customer_name || "—"}</TableCell>
        <TableCell className="text-center">
          <Badge variant="outline" className={`font-mono ${!project.is_latest_version ? "bg-gray-100" : ""}`}>
            v{project.version || 1}
            {project.is_latest_version && <span className="ml-1 text-green-600">●</span>}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          {getStatusBadge(project.status)}
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
  };

  return (
    <div data-testid="projects">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Saved Projects</h1>
        <p className="text-base text-gray-600 mt-2">View and manage your project estimates</p>
      </div>

      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-[#0F172A]">Projects List</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1 inline-block"></span>
              Latest Version
            </Badge>
          </div>
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
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Resources</TableHead>
                  <TableHead className="text-right">Man-Months</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const isExpanded = expandedProjects[project.project_number];
                  const versions = allVersions[project.project_number] || [];
                  const otherVersions = versions.filter(v => v.id !== project.id);
                  
                  return (
                    <>
                      {renderProjectRow(project)}
                      {isExpanded && otherVersions.map((version) => renderProjectRow(version, true))}
                    </>
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
