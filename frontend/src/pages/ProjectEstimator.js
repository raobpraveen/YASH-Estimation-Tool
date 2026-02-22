import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, Plane, Save, FileDown, X, Settings, Copy, History, RefreshCw, Send, CheckCircle, XCircle, Clock, Calculator } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { COUNTRIES, LOGISTICS_DEFAULTS } from "@/utils/constants";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: Clock },
  in_review: { label: "In Review", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
};

const ProjectEstimator = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editProjectId = searchParams.get("edit");
  
  const [rates, setRates] = useState([]);
  const [locations, setLocations] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Project header
  const [projectId, setProjectId] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [projectVersion, setProjectVersion] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [projectLocations, setProjectLocations] = useState([]); // Multiple locations
  const [technologyId, setTechnologyId] = useState("");
  const [projectTypeId, setProjectTypeId] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [profitMarginPercentage, setProfitMarginPercentage] = useState(35);
  const [versionNotes, setVersionNotes] = useState("");
  const [isLatestVersion, setIsLatestVersion] = useState(true);
  
  // Approval workflow
  const [projectStatus, setProjectStatus] = useState("draft");
  const [approverEmail, setApproverEmail] = useState("");
  const [approvalComments, setApprovalComments] = useState("");
  const [submitForReviewDialog, setSubmitForReviewDialog] = useState(false);
  const [approvalActionDialog, setApprovalActionDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState("");
  
  // Waves
  const [waves, setWaves] = useState([]);
  const [activeWaveId, setActiveWaveId] = useState("");
  
  // Dialog states
  const [addWaveDialogOpen, setAddWaveDialogOpen] = useState(false);
  const [addResourceDialogOpen, setAddResourceDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [editLogisticsDialogOpen, setEditLogisticsDialogOpen] = useState(false);
  const [batchLogisticsDialogOpen, setBatchLogisticsDialogOpen] = useState(false);
  const [editingWaveId, setEditingWaveId] = useState("");
  const [saveAsNewVersionDialog, setSaveAsNewVersionDialog] = useState(false);
  
  const [newWave, setNewWave] = useState({ name: "", duration_months: "" });
  const [newAllocation, setNewAllocation] = useState({
    rate_id: "",
    is_onsite: false,
    travel_required: false,
    custom_salary: "",
  });
  
  // Check if project is read-only (not latest version or approved)
  const isReadOnly = !isLatestVersion || projectStatus === "approved";
  
  // Wave-level logistics (applied to all onsite resources based on formula)
  const [waveLogistics, setWaveLogistics] = useState({
    per_diem_daily: LOGISTICS_DEFAULTS.per_diem_daily,
    per_diem_days: 30,
    accommodation_daily: LOGISTICS_DEFAULTS.accommodation_daily,
    accommodation_days: 30,
    local_conveyance_daily: LOGISTICS_DEFAULTS.local_conveyance_daily,
    local_conveyance_days: 21,
    flight_cost_per_trip: 450,
    visa_medical_per_trip: 400,
    num_trips: 6,
    contingency_percentage: 5,
  });

  useEffect(() => {
    fetchRates();
    fetchLocations();
    fetchTechnologies();
    fetchProjectTypes();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (editProjectId) {
      loadProject(editProjectId);
    }
  }, [editProjectId]);

  const loadProject = async (id) => {
    try {
      const response = await axios.get(`${API}/projects/${id}`);
      const project = response.data;
      
      setProjectId(project.id);
      setProjectNumber(project.project_number || "");
      setProjectVersion(project.version || 1);
      setProjectName(project.name);
      setCustomerId(project.customer_id || "");
      // Handle both single location (legacy) and multiple locations
      if (project.project_locations && project.project_locations.length > 0) {
        setProjectLocations(project.project_locations);
      } else if (project.project_location) {
        setProjectLocations([project.project_location]);
      } else {
        setProjectLocations([]);
      }
      setTechnologyId(project.technology_id || "");
      setProjectTypeId(project.project_type_id || "");
      setProjectDescription(project.description || "");
      setProfitMarginPercentage(project.profit_margin_percentage || 35);
      setVersionNotes(project.version_notes || "");
      setProjectStatus(project.status || "draft");
      setApproverEmail(project.approver_email || "");
      setApprovalComments(project.approval_comments || "");
      setIsLatestVersion(project.is_latest_version !== false);
      
      if (project.waves && project.waves.length > 0) {
        setWaves(project.waves);
        setActiveWaveId(project.waves[0].id);
      }
      
      const versionInfo = `${project.project_number || "project"} v${project.version || 1}`;
      if (!project.is_latest_version) {
        toast.info(`Loaded ${versionInfo} (Read-only: older version)`);
      } else if (project.status === "approved") {
        toast.info(`Loaded ${versionInfo} (Read-only: approved)`);
      } else {
        toast.success(`Loaded ${versionInfo}`);
      }
    } catch (error) {
      toast.error("Failed to load project");
      console.error(error);
    }
  };

  const fetchRates = async () => {
    try {
      const response = await axios.get(`${API}/proficiency-rates`);
      setRates(response.data);
    } catch (error) {
      toast.error("Failed to fetch proficiency rates");
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API}/base-locations`);
      setLocations(response.data);
    } catch (error) {
      toast.error("Failed to fetch base locations");
    }
  };

  const fetchTechnologies = async () => {
    try {
      const response = await axios.get(`${API}/technologies`);
      setTechnologies(response.data);
    } catch (error) {
      toast.error("Failed to fetch technologies");
    }
  };

  const fetchProjectTypes = async () => {
    try {
      const response = await axios.get(`${API}/project-types`);
      setProjectTypes(response.data);
    } catch (error) {
      toast.error("Failed to fetch project types");
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error("Failed to fetch customers");
    }
  };

  const handleAddWave = () => {
    if (!newWave.name || !newWave.duration_months) {
      toast.error("Please fill wave name and duration");
      return;
    }

    const numMonths = Math.ceil(parseFloat(newWave.duration_months));
    const phaseNames = Array(numMonths).fill("").map((_, i) => `Month ${i + 1}`);

    const wave = {
      id: Math.random().toString(36).substr(2, 9),
      name: newWave.name,
      duration_months: parseFloat(newWave.duration_months),
      phase_names: phaseNames,
      logistics_config: { ...waveLogistics },
      grid_allocations: [],
    };

    setWaves([...waves, wave]);
    setActiveWaveId(wave.id);
    setNewWave({ name: "", duration_months: "" });
    setAddWaveDialogOpen(false);
    toast.success("Wave added successfully");
  };

  const handleDeleteWave = (waveId) => {
    setWaves(waves.filter(w => w.id !== waveId));
    if (activeWaveId === waveId && waves.length > 1) {
      const remainingWaves = waves.filter(w => w.id !== waveId);
      setActiveWaveId(remainingWaves[0]?.id || "");
    }
    toast.success("Wave deleted");
  };

  const handleUpdatePhaseName = (waveId, phaseIndex, newName) => {
    setWaves(waves.map(w => 
      w.id === waveId 
        ? { ...w, phase_names: w.phase_names.map((name, i) => i === phaseIndex ? newName : name) }
        : w
    ));
  };

  const handleOpenLogisticsEditor = (waveId) => {
    const wave = waves.find(w => w.id === waveId);
    if (wave) {
      setWaveLogistics(wave.logistics_config || {
        per_diem_daily: 50,
        per_diem_days: 30,
        accommodation_daily: 80,
        accommodation_days: 30,
        local_conveyance_daily: 15,
        local_conveyance_days: 21,
        flight_cost_per_trip: 450,
        visa_medical_per_trip: 400,
        num_trips: 6,
        contingency_percentage: 5,
      });
      setEditingWaveId(waveId);
      setEditLogisticsDialogOpen(true);
    }
  };

  const handleSaveWaveLogistics = () => {
    setWaves(waves.map(w => 
      w.id === editingWaveId 
        ? { ...w, logistics_config: { ...waveLogistics } }
        : w
    ));
    toast.success("Wave logistics updated");
    setEditLogisticsDialogOpen(false);
  };

  const handleOpenBatchLogistics = (waveId) => {
    const wave = waves.find(w => w.id === waveId);
    if (wave) {
      setWaveLogistics(wave.logistics_config || {
        per_diem_daily: 50,
        per_diem_days: 30,
        accommodation_daily: 80,
        accommodation_days: 30,
        local_conveyance_daily: 15,
        local_conveyance_days: 21,
        flight_cost_per_trip: 450,
        visa_medical_per_trip: 400,
        num_trips: 6,
        contingency_percentage: 5,
      });
      setEditingWaveId(waveId);
      setBatchLogisticsDialogOpen(true);
    }
  };

  const handleBatchUpdateLogistics = () => {
    setWaves(waves.map(w => 
      w.id === editingWaveId 
        ? { ...w, logistics_config: { ...waveLogistics } }
        : w
    ));
    toast.success("Logistics updated for all onsite resources in this wave");
    setBatchLogisticsDialogOpen(false);
  };

  const handleAddAllocation = () => {
    if (!activeWaveId) {
      toast.error("Please add a wave first");
      return;
    }

    if (!newAllocation.rate_id) {
      toast.error("Please select a skill");
      return;
    }

    const selectedRate = rates.find((r) => r.id === newAllocation.rate_id);
    if (!selectedRate) return;

    const location = locations.find(l => l.id === selectedRate.base_location_id);
    if (!location) {
      toast.error("Location not found for selected skill");
      return;
    }

    const customSalary = newAllocation.custom_salary ? parseFloat(newAllocation.custom_salary) : selectedRate.avg_monthly_salary;
    
    const allocation = {
      id: Math.random().toString(36).substr(2, 9),
      skill_id: selectedRate.skill_id,
      skill_name: selectedRate.skill_name,
      proficiency_level: selectedRate.proficiency_level,
      avg_monthly_salary: customSalary,
      original_monthly_salary: selectedRate.avg_monthly_salary,
      base_location_id: selectedRate.base_location_id,
      base_location_name: selectedRate.base_location_name,
      overhead_percentage: location.overhead_percentage,
      is_onsite: newAllocation.is_onsite,
      travel_required: newAllocation.travel_required,
      phase_allocations: {},
    };

    setWaves(waves.map(w => 
      w.id === activeWaveId 
        ? { ...w, grid_allocations: [...w.grid_allocations, allocation] }
        : w
    ));

    setNewAllocation({
      rate_id: "",
      is_onsite: false,
      travel_required: false,
      custom_salary: "",
    });
    setAddResourceDialogOpen(false);
    toast.success("Resource added to wave");
  };

  const handleDeleteAllocation = (waveId, allocationId) => {
    setWaves(waves.map(w => 
      w.id === waveId 
        ? { ...w, grid_allocations: w.grid_allocations.filter(a => a.id !== allocationId) }
        : w
    ));
  };

  const handleToggleOnsite = (waveId, allocationId) => {
    setWaves(waves.map(w => 
      w.id === waveId
        ? {
            ...w,
            grid_allocations: w.grid_allocations.map(a =>
              a.id === allocationId ? { ...a, is_onsite: !a.is_onsite } : a
            )
          }
        : w
    ));
  };

  const handleToggleTravelRequired = (waveId, allocationId) => {
    setWaves(waves.map(w => 
      w.id === waveId
        ? {
            ...w,
            grid_allocations: w.grid_allocations.map(a =>
              a.id === allocationId ? { ...a, travel_required: !a.travel_required } : a
            )
          }
        : w
    ));
  };

  const handlePhaseAllocationChange = (waveId, allocationId, phaseIndex, value) => {
    setWaves(waves.map(w => 
      w.id === waveId
        ? {
            ...w,
            grid_allocations: w.grid_allocations.map(a =>
              a.id === allocationId
                ? { ...a, phase_allocations: { ...a.phase_allocations, [phaseIndex]: parseFloat(value) || 0 } }
                : a
            )
          }
        : w
    ));
  };

  const handleSalaryChange = (waveId, allocationId, value) => {
    setWaves(waves.map(w => 
      w.id === waveId
        ? {
            ...w,
            grid_allocations: w.grid_allocations.map(a =>
              a.id === allocationId
                ? { ...a, avg_monthly_salary: parseFloat(value) || 0 }
                : a
            )
          }
        : w
    ));
  };

  // Calculate resource base cost (salary only)
  const calculateResourceBaseCost = (allocation) => {
    const totalManMonths = Object.values(allocation.phase_allocations || {}).reduce((sum, val) => sum + val, 0);
    const baseSalaryCost = allocation.avg_monthly_salary * totalManMonths;
    return { totalManMonths, baseSalaryCost };
  };

  // Calculate wave-level logistics based on the formula from the image
  // Per-diem/Accommodation/Conveyance: Total Traveling MM × Rate × Days
  // Flights/Visa: Num Traveling Resources × Rate × Trips
  // Only resources with travel_required=true are counted for logistics
  const calculateWaveLogistics = (wave) => {
    const config = wave.logistics_config || {
      per_diem_daily: 50,
      per_diem_days: 30,
      accommodation_daily: 80,
      accommodation_days: 30,
      local_conveyance_daily: 15,
      local_conveyance_days: 21,
      flight_cost_per_trip: 450,
      visa_medical_per_trip: 400,
      num_trips: 6,
      contingency_percentage: 5,
    };

    // Calculate total traveling MM and count of traveling resources
    let totalTravelingMM = 0;
    let travelingResourceCount = 0;
    let totalOnsiteMM = 0;
    let onsiteResourceCount = 0;
    
    wave.grid_allocations.forEach(allocation => {
      const mm = Object.values(allocation.phase_allocations || {}).reduce((sum, val) => sum + val, 0);
      
      // Track all onsite resources for display
      if (allocation.is_onsite) {
        totalOnsiteMM += mm;
        onsiteResourceCount++;
      }
      
      // Only count resources with travel_required for logistics calculations
      if (allocation.travel_required) {
        totalTravelingMM += mm;
        travelingResourceCount++;
      }
    });

    // Calculate logistics costs using formula - only for traveling resources
    const perDiemCost = totalTravelingMM * config.per_diem_daily * config.per_diem_days;
    const accommodationCost = totalTravelingMM * config.accommodation_daily * config.accommodation_days;
    const conveyanceCost = totalTravelingMM * config.local_conveyance_daily * config.local_conveyance_days;
    const flightCost = travelingResourceCount * config.flight_cost_per_trip * config.num_trips;
    const visaMedicalCost = travelingResourceCount * config.visa_medical_per_trip * config.num_trips;
    
    const subtotal = perDiemCost + accommodationCost + conveyanceCost + flightCost + visaMedicalCost;
    const contingencyCost = subtotal * (config.contingency_percentage / 100);
    const totalLogistics = subtotal + contingencyCost;

    return {
      totalOnsiteMM,
      onsiteResourceCount,
      totalTravelingMM,
      travelingResourceCount,
      perDiemCost,
      accommodationCost,
      conveyanceCost,
      flightCost,
      visaMedicalCost,
      contingencyCost,
      totalLogistics,
      config,
    };
  };

  // Calculate wave summary with new logistics formula
  const calculateWaveSummary = (wave) => {
    let totalMM = 0;
    let onsiteMM = 0;
    let onsiteSalaryCost = 0;
    let offshoreMM = 0;
    let offshoreSalaryCost = 0;
    let totalBaseSalaryCost = 0;

    wave.grid_allocations.forEach(allocation => {
      const { totalManMonths, baseSalaryCost } = calculateResourceBaseCost(allocation);
      totalMM += totalManMonths;
      totalBaseSalaryCost += baseSalaryCost;

      if (allocation.is_onsite) {
        onsiteMM += totalManMonths;
        onsiteSalaryCost += baseSalaryCost;
      } else {
        offshoreMM += totalManMonths;
        offshoreSalaryCost += baseSalaryCost;
      }
    });

    // Get wave-level logistics (calculated based on travel_required flag)
    const logistics = calculateWaveLogistics(wave);
    
    // Calculate costs
    const baseCost = totalBaseSalaryCost + logistics.totalLogistics;
    
    // Calculate average overhead (weighted by MM)
    let totalOverheadCost = 0;
    wave.grid_allocations.forEach(allocation => {
      const { totalManMonths, baseSalaryCost } = calculateResourceBaseCost(allocation);
      totalOverheadCost += baseSalaryCost * (allocation.overhead_percentage / 100);
    });
    // Add overhead on logistics too
    const avgOverhead = wave.grid_allocations.length > 0 
      ? wave.grid_allocations.reduce((sum, a) => sum + a.overhead_percentage, 0) / wave.grid_allocations.length 
      : 0;
    totalOverheadCost += logistics.totalLogistics * (avgOverhead / 100);
    
    const costToCompany = baseCost + totalOverheadCost;
    const sellingPrice = costToCompany / (1 - (profitMarginPercentage / 100));

    return {
      totalMM,
      onsiteMM,
      onsiteSalaryCost,
      offshoreMM,
      offshoreSalaryCost,
      totalLogisticsCost: logistics.totalLogistics,
      totalCostToCompany: costToCompany,
      sellingPrice,
      onsiteResourceCount: logistics.onsiteResourceCount,
      travelingResourceCount: logistics.travelingResourceCount,
      travelingMM: logistics.totalTravelingMM,
      logistics,
    };
  };

  const calculateOverallSummary = () => {
    let totalMM = 0;
    let onsiteMM = 0;
    let onsiteSalaryCost = 0;
    let offshoreMM = 0;
    let offshoreSalaryCost = 0;
    let totalLogisticsCost = 0;
    let totalCostToCompany = 0;
    let totalSellingPrice = 0;

    waves.forEach(wave => {
      const summary = calculateWaveSummary(wave);
      totalMM += summary.totalMM;
      onsiteMM += summary.onsiteMM;
      onsiteSalaryCost += summary.onsiteSalaryCost;
      offshoreMM += summary.offshoreMM;
      offshoreSalaryCost += summary.offshoreSalaryCost;
      totalLogisticsCost += summary.totalLogisticsCost;
      totalCostToCompany += summary.totalCostToCompany;
      totalSellingPrice += summary.sellingPrice;
    });

    return {
      totalMM,
      onsiteMM,
      onsiteSalaryCost,
      offshoreMM,
      offshoreSalaryCost,
      totalLogisticsCost,
      totalCostToCompany,
      sellingPrice: totalSellingPrice,
    };
  };

  const getProjectPayload = () => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    const selectedTech = technologies.find(t => t.id === technologyId);
    const selectedType = projectTypes.find(t => t.id === projectTypeId);
    const selectedLocationNames = projectLocations.map(code => 
      COUNTRIES.find(c => c.code === code)?.name || code
    );

    return {
      name: projectName,
      customer_id: customerId,
      customer_name: selectedCustomer?.name || "",
      project_locations: projectLocations,
      project_location_names: selectedLocationNames,
      // Keep single location for backward compatibility
      project_location: projectLocations[0] || "",
      project_location_name: selectedLocationNames[0] || "",
      technology_id: technologyId,
      technology_name: selectedTech?.name || "",
      project_type_id: projectTypeId,
      project_type_name: selectedType?.name || "",
      description: projectDescription,
      profit_margin_percentage: profitMarginPercentage,
      waves: waves.map(w => ({
        id: w.id,
        name: w.name,
        duration_months: w.duration_months,
        phase_names: w.phase_names,
        logistics_config: w.logistics_config,
        grid_allocations: w.grid_allocations,
      })),
      version_notes: versionNotes,
      status: projectStatus,
      approver_email: approverEmail,
    };
  };

  const handleSubmitForReview = async () => {
    if (!projectId) {
      toast.error("Please save the project first");
      return;
    }
    if (!approverEmail || !approverEmail.includes("@")) {
      toast.error("Please enter a valid approver email");
      return;
    }

    try {
      await axios.post(`${API}/projects/${projectId}/submit-for-review?approver_email=${encodeURIComponent(approverEmail)}`);
      setProjectStatus("in_review");
      setSubmitForReviewDialog(false);
      toast.success("Project submitted for review");
    } catch (error) {
      toast.error("Failed to submit for review");
      console.error(error);
    }
  };

  const handleApprovalAction = async () => {
    if (!projectId) return;

    try {
      if (approvalAction === "approve") {
        await axios.post(`${API}/projects/${projectId}/approve?comments=${encodeURIComponent(approvalComments)}`);
        setProjectStatus("approved");
        toast.success("Project approved");
      } else if (approvalAction === "reject") {
        await axios.post(`${API}/projects/${projectId}/reject?comments=${encodeURIComponent(approvalComments)}`);
        setProjectStatus("rejected");
        toast.success("Project rejected");
      }
      setApprovalActionDialog(false);
      setApprovalComments("");
    } catch (error) {
      toast.error(`Failed to ${approvalAction} project`);
      console.error(error);
    }
  };

  const handleSaveProject = async () => {
    if (!projectName || !customerId) {
      toast.error("Please enter project name and select customer");
      return;
    }

    if (waves.length === 0) {
      toast.error("Please add at least one wave");
      return;
    }

    const payload = getProjectPayload();

    try {
      if (projectId) {
        await axios.put(`${API}/projects/${projectId}`, payload);
        toast.success(`Project ${projectNumber} v${projectVersion} updated`);
      } else {
        const response = await axios.post(`${API}/projects`, payload);
        setProjectId(response.data.id);
        setProjectNumber(response.data.project_number);
        setProjectVersion(response.data.version);
        toast.success(`Project ${response.data.project_number} created`);
      }
    } catch (error) {
      toast.error("Failed to save project");
      console.error(error);
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!projectId) {
      toast.error("No existing project to version");
      return;
    }

    const payload = getProjectPayload();

    try {
      const response = await axios.post(`${API}/projects/${projectId}/new-version`, payload);
      setProjectId(response.data.id);
      setProjectVersion(response.data.version);
      setSaveAsNewVersionDialog(false);
      toast.success(`New version ${response.data.project_number} v${response.data.version} created`);
    } catch (error) {
      toast.error("Failed to create new version");
      console.error(error);
    }
  };

  const handleCloneProject = async () => {
    if (!projectId) {
      toast.error("Please save the project first");
      return;
    }

    try {
      const response = await axios.post(`${API}/projects/${projectId}/clone`);
      toast.success(`Project cloned as ${response.data.project_number}`);
      navigate(`/estimator?edit=${response.data.id}`);
    } catch (error) {
      toast.error("Failed to clone project");
      console.error(error);
    }
  };

  const handleNewProject = () => {
    setProjectId("");
    setProjectNumber("");
    setProjectVersion(1);
    setProjectName("");
    setCustomerId("");
    setProjectLocations([]);
    setTechnologyId("");
    setProjectTypeId("");
    setProjectDescription("");
    setProfitMarginPercentage(35);
    setVersionNotes("");
    setProjectStatus("draft");
    setApproverEmail("");
    setApprovalComments("");
    setIsLatestVersion(true);
    setWaves([]);
    setActiveWaveId("");
    navigate("/estimator");
    toast.info("Ready for new project");
  };

  const handleExportToExcel = () => {
    if (waves.length === 0) {
      toast.error("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    const selectedCustomer = customers.find(c => c.id === customerId);
    
    // Summary sheet
    const summaryData = [];
    summaryData.push(["PROJECT ESTIMATE SUMMARY"]);
    summaryData.push([]);
    summaryData.push(["Project Number", projectNumber || "Not Saved"]);
    summaryData.push(["Version", projectVersion]);
    summaryData.push(["Customer Name", selectedCustomer?.name || ""]);
    summaryData.push(["Project Name", projectName]);
    summaryData.push(["Project Location", COUNTRIES.find(c => c.code === projectLocation)?.name || projectLocation]);
    summaryData.push(["Technology", technologies.find(t => t.id === technologyId)?.name || ""]);
    summaryData.push(["Project Type", projectTypes.find(t => t.id === projectTypeId)?.name || ""]);
    summaryData.push(["Description", projectDescription]);
    summaryData.push(["Profit Margin %", `${profitMarginPercentage}%`]);
    summaryData.push([]);

    waves.forEach(wave => {
      const summary = calculateWaveSummary(wave);
      const logistics = summary.logistics;
      
      summaryData.push([`WAVE: ${wave.name}`, `Duration: ${wave.duration_months} months`]);
      summaryData.push(["Total Man-Months", summary.totalMM.toFixed(2)]);
      summaryData.push(["Onsite Man-Months", summary.onsiteMM.toFixed(2)]);
      summaryData.push(["Onsite Resources", summary.onsiteResourceCount]);
      summaryData.push(["Offshore Man-Months", summary.offshoreMM.toFixed(2)]);
      summaryData.push([]);
      summaryData.push(["LOGISTICS BREAKDOWN"]);
      summaryData.push(["Per-diem", `${summary.onsiteMM.toFixed(2)} MM × $${logistics.config.per_diem_daily} × ${logistics.config.per_diem_days} days`, `$${logistics.perDiemCost.toFixed(2)}`]);
      summaryData.push(["Accommodation", `${summary.onsiteMM.toFixed(2)} MM × $${logistics.config.accommodation_daily} × ${logistics.config.accommodation_days} days`, `$${logistics.accommodationCost.toFixed(2)}`]);
      summaryData.push(["Conveyance", `${summary.onsiteMM.toFixed(2)} MM × $${logistics.config.local_conveyance_daily} × ${logistics.config.local_conveyance_days} days`, `$${logistics.conveyanceCost.toFixed(2)}`]);
      summaryData.push(["Air Fare", `${summary.onsiteResourceCount} resources × $${logistics.config.flight_cost_per_trip} × ${logistics.config.num_trips} trips`, `$${logistics.flightCost.toFixed(2)}`]);
      summaryData.push(["Visa & Medical", `${summary.onsiteResourceCount} resources × $${logistics.config.visa_medical_per_trip} × ${logistics.config.num_trips} trips`, `$${logistics.visaMedicalCost.toFixed(2)}`]);
      summaryData.push(["Contingency", `${logistics.config.contingency_percentage}%`, `$${logistics.contingencyCost.toFixed(2)}`]);
      summaryData.push(["Total Logistics", "", `$${logistics.totalLogistics.toFixed(2)}`]);
      summaryData.push([]);
      summaryData.push(["Cost to Company", `$${summary.totalCostToCompany.toFixed(2)}`]);
      summaryData.push(["Wave Selling Price", `$${summary.sellingPrice.toFixed(2)}`]);
      summaryData.push([]);
    });

    const overall = calculateOverallSummary();
    summaryData.push(["OVERALL PROJECT"]);
    summaryData.push(["Total Man-Months", overall.totalMM.toFixed(2)]);
    summaryData.push(["Total Onsite MM", overall.onsiteMM.toFixed(2)]);
    summaryData.push(["Total Offshore MM", overall.offshoreMM.toFixed(2)]);
    summaryData.push(["Total Logistics", `$${overall.totalLogisticsCost.toFixed(2)}`]);
    summaryData.push(["Total Cost to Company", `$${overall.totalCostToCompany.toFixed(2)}`]);
    summaryData.push(["Profit Margin %", `${profitMarginPercentage}%`]);
    summaryData.push(["GRAND TOTAL (Selling Price)", `$${overall.sellingPrice.toFixed(2)}`]);

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 50 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Detail sheets for each wave
    waves.forEach(wave => {
      const waveData = [];
      waveData.push([`${wave.name} - ${wave.duration_months} months`]);
      waveData.push([]);
      
      const header = ["Skill", "Level", "Location", "$/Month", "Onsite", ...wave.phase_names, "Total MM", "Salary Cost"];
      waveData.push(header);

      wave.grid_allocations.forEach(alloc => {
        const { totalManMonths, baseSalaryCost } = calculateResourceBaseCost(alloc);
        const row = [
          alloc.skill_name,
          alloc.proficiency_level,
          alloc.base_location_name,
          alloc.avg_monthly_salary,
          alloc.is_onsite ? "ON" : "OFF",
          ...wave.phase_names.map((_, i) => alloc.phase_allocations[i] || 0),
          totalManMonths.toFixed(2),
          baseSalaryCost.toFixed(2),
        ];
        waveData.push(row);
      });

      const waveWs = XLSX.utils.aoa_to_sheet(waveData);
      XLSX.utils.book_append_sheet(wb, waveWs, wave.name.substring(0, 30));
    });

    XLSX.writeFile(wb, `${projectNumber || projectName || "Project"}_v${projectVersion}_Estimate.xlsx`);
    toast.success("Exported to Excel successfully");
  };

  const activeWave = waves.find(w => w.id === activeWaveId);
  const overall = calculateOverallSummary();

  const getStatusBadge = () => {
    const config = STATUS_CONFIG[projectStatus] || STATUS_CONFIG.draft;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <TooltipProvider>
    <div data-testid="project-estimator" className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">Project Estimator</h1>
            {projectNumber && (
              <Badge variant="outline" className="text-sm font-mono" data-testid="project-number-badge">
                {projectNumber} v{projectVersion}
              </Badge>
            )}
            {projectId && getStatusBadge()}
          </div>
          <p className="text-sm text-gray-600 mt-1">Wave-based project estimation with version management</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleNewProject} variant="outline" size="sm" data-testid="new-project-button">
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
          {projectId && (
            <>
              <Button onClick={handleCloneProject} variant="outline" size="sm" className="border-[#8B5CF6] text-[#8B5CF6]" data-testid="clone-project-button">
                <Copy className="w-4 h-4 mr-1" />
                Clone
              </Button>
              <Button onClick={() => setSaveAsNewVersionDialog(true)} variant="outline" size="sm" className="border-[#F59E0B] text-[#F59E0B]" data-testid="new-version-button">
                <History className="w-4 h-4 mr-1" />
                New Version
              </Button>
              {projectStatus === "draft" && !isReadOnly && (
                <Button 
                  onClick={() => setSubmitForReviewDialog(true)} 
                  variant="outline" 
                  size="sm"
                  className="border-purple-600 text-purple-600"
                  data-testid="submit-review-button"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Submit for Review
                </Button>
              )}
              {projectStatus === "in_review" && (
                <>
                  <Button 
                    onClick={() => { setApprovalAction("approve"); setApprovalActionDialog(true); }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                    data-testid="approve-button"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => { setApprovalAction("reject"); setApprovalActionDialog(true); }}
                    variant="outline"
                    size="sm"
                    className="border-red-600 text-red-600"
                    data-testid="reject-button"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
            </>
          )}
          <Button onClick={() => setSummaryDialogOpen(true)} variant="outline" size="sm" className="border-[#0EA5E9] text-[#0EA5E9]" data-testid="view-summary-button">
            View Summary
          </Button>
          <Button onClick={handleExportToExcel} variant="outline" size="sm" className="border-[#10B981] text-[#10B981]" data-testid="export-excel-button">
            <FileDown className="w-4 h-4 mr-1" />
            Export Excel
          </Button>
          {!isReadOnly && (
          <Button onClick={handleSaveProject} size="sm" className="bg-[#10B981] hover:bg-[#10B981]/90 text-white" data-testid="save-project-button">
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          )}
        </div>
      </div>

      {/* Submit for Review Dialog */}
      <Dialog open={submitForReviewDialog} onOpenChange={setSubmitForReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0F172A]">Submit for Review</DialogTitle>
            <DialogDescription>Enter the approver's email address to submit this project for review.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="approver-email">Approver Email *</Label>
              <Input
                id="approver-email"
                type="email"
                placeholder="approver@company.com"
                value={approverEmail}
                onChange={(e) => setApproverEmail(e.target.value)}
                data-testid="approver-email-input"
              />
            </div>
            <p className="text-xs text-gray-500">
              The approver will receive a notification and can approve, reject, or request changes to this estimate.
            </p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSubmitForReviewDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitForReview} 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="confirm-submit-review"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Action Dialog */}
      <Dialog open={approvalActionDialog} onOpenChange={setApprovalActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0F172A]">
              {approvalAction === "approve" ? "Approve Project" : "Reject Project"}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approve" 
                ? "Add any comments for the approval."
                : "Please provide a reason for rejection."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="approval-comments">Comments</Label>
              <Textarea
                id="approval-comments"
                placeholder={approvalAction === "approve" ? "Optional approval comments..." : "Reason for rejection..."}
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={3}
                data-testid="approval-comments-input"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setApprovalActionDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleApprovalAction}
              className={approvalAction === "approve" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              data-testid="confirm-approval-action"
            >
              {approvalAction === "approve" ? (
                <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>
              ) : (
                <><XCircle className="w-4 h-4 mr-2" /> Reject</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Header */}
      <Card className={`border ${isReadOnly ? 'border-amber-300 bg-amber-50/30' : 'border-[#E2E8F0]'} shadow-sm`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-[#0F172A]">Project Information</CardTitle>
          {isReadOnly && (
            <Badge className="bg-amber-100 text-amber-800">
              {!isLatestVersion ? "Read-only: Older Version" : "Read-only: Approved"}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="customer">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId} disabled={isReadOnly}>
                <SelectTrigger id="customer" data-testid="customer-select">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                data-testid="project-name-input"
                disabled={isReadOnly}
              />
            </div>
            <div>
              <Label>Project Location(s)</Label>
              <div className="flex flex-wrap gap-1 min-h-[40px] p-2 border rounded-md bg-white">
                {projectLocations.map(code => {
                  const country = COUNTRIES.find(c => c.code === code);
                  return (
                    <Badge key={code} variant="secondary" className="flex items-center gap-1">
                      {country?.name || code}
                      {!isReadOnly && (
                        <button
                          onClick={() => setProjectLocations(projectLocations.filter(c => c !== code))}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  );
                })}
                {!isReadOnly && (
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !projectLocations.includes(value)) {
                        setProjectLocations([...projectLocations, value]);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[140px] h-7 text-xs border-dashed" data-testid="project-location-select">
                      <SelectValue placeholder="+ Add location" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.filter(c => !projectLocations.includes(c.code)).map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="technology">Technology</Label>
              <Select value={technologyId} onValueChange={setTechnologyId} disabled={isReadOnly}>
                <SelectTrigger id="technology" data-testid="technology-select">
                  <SelectValue placeholder="Select technology" />
                </SelectTrigger>
                <SelectContent>
                  {technologies.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="project-type">Project Type</Label>
              <Select value={projectTypeId} onValueChange={setProjectTypeId} disabled={isReadOnly}>
                <SelectTrigger id="project-type" data-testid="project-type-select">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label>Profit Margin %</Label>
                <span className="font-mono font-semibold text-[#0F172A]" data-testid="profit-margin-display">
                  {profitMarginPercentage}%
                </span>
              </div>
              <Slider
                value={[profitMarginPercentage]}
                onValueChange={([value]) => setProfitMarginPercentage(value)}
                disabled={isReadOnly}
                min={0}
                max={50}
                step={1}
                data-testid="profit-margin-slider"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                placeholder="Project description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                data-testid="project-description-input"
                rows={2}
                disabled={isReadOnly}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Label htmlFor="version-notes">Version Notes</Label>
              <Textarea
                id="version-notes"
                placeholder="Notes for this version (e.g., changes made, reason for update)"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                data-testid="version-notes-input"
                rows={2}
                disabled={isReadOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Man-Months</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold font-mono text-[#0F172A]" data-testid="total-mm">
              {overall.totalMM.toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Onsite MM</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold font-mono text-[#F59E0B]" data-testid="onsite-mm">
              {overall.onsiteMM.toFixed(1)}
            </p>
            {overall.onsiteMM > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Avg: ${(overall.sellingPrice > 0 && overall.onsiteMM > 0 
                  ? (overall.onsiteSalaryCost / overall.onsiteMM * (1 + profitMarginPercentage/100)).toFixed(0) 
                  : 0).toLocaleString()}/MM
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Offshore MM</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold font-mono text-[#0EA5E9]" data-testid="offshore-mm">
              {overall.offshoreMM.toFixed(1)}
            </p>
            {overall.offshoreMM > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Avg: ${(overall.offshoreMM > 0 
                  ? (overall.offshoreSalaryCost / overall.offshoreMM * (1 + profitMarginPercentage/100)).toFixed(0) 
                  : 0).toLocaleString()}/MM
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Selling Price/MM</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold font-mono text-[#8B5CF6]" data-testid="avg-selling-price">
              ${overall.totalMM > 0 
                ? (overall.sellingPrice / overall.totalMM).toLocaleString(undefined, { maximumFractionDigits: 0 }) 
                : 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Selling Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold font-mono text-[#10B981]" data-testid="selling-price">
              ${overall.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wave Management */}
      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-[#0F172A]">Project Waves</CardTitle>
            {!isReadOnly && (
            <Dialog open={addWaveDialogOpen} onOpenChange={setAddWaveDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white" data-testid="add-wave-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Wave
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-[#0F172A]">Add New Wave</DialogTitle>
                  <DialogDescription>Configure wave details and logistics rates</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="wave-name">Wave Name</Label>
                      <Input
                        id="wave-name"
                        placeholder="e.g., Wave 1"
                        value={newWave.name}
                        onChange={(e) => setNewWave({ ...newWave, name: e.target.value })}
                        data-testid="wave-name-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wave-duration">Duration (Months)</Label>
                      <Input
                        id="wave-duration"
                        type="number"
                        placeholder="e.g., 6"
                        value={newWave.duration_months}
                        onChange={(e) => setNewWave({ ...newWave, duration_months: e.target.value })}
                        data-testid="wave-duration-input"
                      />
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold">Logistics Configuration</Label>
                    <p className="text-xs text-gray-500 mb-3">Per-diem/Accommodation/Conveyance: Traveling MM × Rate × Days | Flights/Visa: Traveling Resources × Rate × Trips</p>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Per-Diem ($/day)</Label>
                        <Input type="number" value={waveLogistics.per_diem_daily} onChange={(e) => setWaveLogistics({ ...waveLogistics, per_diem_daily: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label className="text-xs">Days/Month</Label>
                        <Input type="number" value={waveLogistics.per_diem_days} onChange={(e) => setWaveLogistics({ ...waveLogistics, per_diem_days: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="flex items-end">
                        <p className="text-xs text-gray-500 pb-2">= MM × ${waveLogistics.per_diem_daily} × {waveLogistics.per_diem_days}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Accommodation ($/day)</Label>
                        <Input type="number" value={waveLogistics.accommodation_daily} onChange={(e) => setWaveLogistics({ ...waveLogistics, accommodation_daily: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label className="text-xs">Days/Month</Label>
                        <Input type="number" value={waveLogistics.accommodation_days} onChange={(e) => setWaveLogistics({ ...waveLogistics, accommodation_days: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="flex items-end">
                        <p className="text-xs text-gray-500 pb-2">= MM × ${waveLogistics.accommodation_daily} × {waveLogistics.accommodation_days}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Conveyance ($/day)</Label>
                        <Input type="number" value={waveLogistics.local_conveyance_daily} onChange={(e) => setWaveLogistics({ ...waveLogistics, local_conveyance_daily: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label className="text-xs">Days/Month</Label>
                        <Input type="number" value={waveLogistics.local_conveyance_days} onChange={(e) => setWaveLogistics({ ...waveLogistics, local_conveyance_days: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="flex items-end">
                        <p className="text-xs text-gray-500 pb-2">= MM × ${waveLogistics.local_conveyance_daily} × {waveLogistics.local_conveyance_days}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Air Fare ($/trip)</Label>
                        <Input type="number" value={waveLogistics.flight_cost_per_trip} onChange={(e) => setWaveLogistics({ ...waveLogistics, flight_cost_per_trip: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label className="text-xs">Number of Trips</Label>
                        <Input type="number" value={waveLogistics.num_trips} onChange={(e) => setWaveLogistics({ ...waveLogistics, num_trips: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="flex items-end">
                        <p className="text-xs text-gray-500 pb-2">= Resources × ${waveLogistics.flight_cost_per_trip} × {waveLogistics.num_trips}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Visa & Medical ($/trip)</Label>
                        <Input type="number" value={waveLogistics.visa_medical_per_trip} onChange={(e) => setWaveLogistics({ ...waveLogistics, visa_medical_per_trip: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label className="text-xs">Contingency %</Label>
                        <Input type="number" value={waveLogistics.contingency_percentage} onChange={(e) => setWaveLogistics({ ...waveLogistics, contingency_percentage: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div></div>
                    </div>
                  </div>
                  
                  <Button onClick={handleAddWave} className="w-full bg-[#0F172A] hover:bg-[#0F172A]/90" data-testid="submit-wave-button">
                    Add Wave
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {waves.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No waves added yet. Click "Add Wave" to start.</p>
            </div>
          ) : (
            <Tabs value={activeWaveId} onValueChange={setActiveWaveId}>
              <TabsList className="mb-4">
                {waves.map((wave) => (
                  <TabsTrigger key={wave.id} value={wave.id} data-testid={`wave-tab-${wave.id}`}>
                    {wave.name} ({wave.duration_months}m)
                  </TabsTrigger>
                ))}
              </TabsList>
              {waves.map((wave) => {
                const waveSummary = calculateWaveSummary(wave);
                return (
                <TabsContent key={wave.id} value={wave.id}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-[#0F172A]">{wave.name}</h3>
                        <span className="text-sm text-gray-600">Duration: {wave.duration_months} months</span>
                        <span className="text-sm text-gray-600">Resources: {wave.grid_allocations.length}</span>
                        <span className="text-sm text-[#F59E0B]">Onsite: {waveSummary.onsiteResourceCount}</span>
                        <span className="text-sm text-purple-600">Traveling: {waveSummary.travelingResourceCount}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleOpenLogisticsEditor(wave.id)}
                          data-testid={`edit-logistics-${wave.id}`}
                          disabled={isReadOnly}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Logistics Config
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-[#F59E0B] text-[#F59E0B]"
                          onClick={() => handleOpenBatchLogistics(wave.id)}
                          data-testid={`batch-logistics-${wave.id}`}
                          disabled={isReadOnly}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Batch Update
                        </Button>
                        {!isReadOnly && (
                        <Dialog open={addResourceDialogOpen && activeWaveId === wave.id} onOpenChange={setAddResourceDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white" data-testid="add-resource-button">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Resource
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold text-[#0F172A]">Add Resource to {wave.name}</DialogTitle>
                              <DialogDescription>Select skill and optionally override salary</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <Label htmlFor="resource-rate">Skill & Proficiency</Label>
                                <Select value={newAllocation.rate_id} onValueChange={(value) => {
                                  const rate = rates.find(r => r.id === value);
                                  setNewAllocation({ 
                                    ...newAllocation, 
                                    rate_id: value,
                                    custom_salary: rate?.avg_monthly_salary?.toString() || ""
                                  });
                                }}>
                                  <SelectTrigger id="resource-rate" data-testid="resource-rate-select">
                                    <SelectValue placeholder="Select skill" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {rates.map((rate) => (
                                      <SelectItem key={rate.id} value={rate.id}>
                                        {rate.skill_name} ({rate.proficiency_level}) - {rate.base_location_name} - ${rate.avg_monthly_salary}/mo
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor="custom-salary">Monthly Salary (override)</Label>
                                <Input
                                  id="custom-salary"
                                  type="number"
                                  placeholder="Enter custom salary"
                                  value={newAllocation.custom_salary}
                                  onChange={(e) => setNewAllocation({ ...newAllocation, custom_salary: e.target.value })}
                                  data-testid="custom-salary-input"
                                />
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={newAllocation.is_onsite}
                                  onCheckedChange={(checked) => setNewAllocation({ ...newAllocation, is_onsite: checked })}
                                  data-testid="onsite-switch"
                                />
                                <Label className="flex items-center gap-2">
                                  <Plane className="w-4 h-4" />
                                  Onsite Resource
                                </Label>
                              </div>

                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={newAllocation.travel_required}
                                  onCheckedChange={(checked) => setNewAllocation({ ...newAllocation, travel_required: checked })}
                                  data-testid="travel-required-switch"
                                />
                                <Label className="flex items-center gap-2 text-purple-600">
                                  Travel Required (Logistics Apply)
                                </Label>
                              </div>

                              {newAllocation.travel_required && (
                                <div className="bg-purple-50 p-3 rounded text-xs border border-purple-200">
                                  <p className="font-semibold mb-1">Logistics will be calculated at wave level:</p>
                                  <p>Per-diem, Accommodation, Conveyance: Total Traveling MM × Rate × Days</p>
                                  <p>Flights, Visa/Medical: Traveling Resources × Rate × Trips</p>
                                </div>
                              )}
                              
                              <Button onClick={handleAddAllocation} className="w-full bg-[#0F172A] hover:bg-[#0F172A]/90" data-testid="submit-resource-button">
                                Add Resource
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        )}
                        {!isReadOnly && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10"
                          onClick={() => handleDeleteWave(wave.id)}
                          data-testid={`delete-wave-${wave.id}`}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Delete Wave
                        </Button>
                        )}
                      </div>
                    </div>

                    {wave.grid_allocations.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-300 rounded">
                        <p className="text-gray-500">No resources in this wave. Click "Add Resource" to start.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-[#E2E8F0] rounded">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b-2 border-[#E2E8F0] bg-[#F8FAFC]">
                              <th className="text-left p-3 font-semibold text-sm">Skill</th>
                              <th className="text-left p-3 font-semibold text-sm">Level</th>
                              <th className="text-left p-3 font-semibold text-sm">Location</th>
                              <th className="text-right p-3 font-semibold text-sm">$/Month</th>
                              <th className="text-center p-3 font-semibold text-sm">Onsite</th>
                              <th className="text-center p-3 font-semibold text-sm">Travel</th>
                              {wave.phase_names.map((phaseName, index) => (
                                <th key={index} className="text-center p-2 bg-[#E0F2FE]">
                                  <Input
                                    value={phaseName}
                                    onChange={(e) => handleUpdatePhaseName(wave.id, index, e.target.value)}
                                    className="w-24 text-center font-semibold text-xs border-0 bg-transparent focus:bg-white"
                                    data-testid={`phase-name-${index}`}
                                    disabled={isReadOnly}
                                  />
                                </th>
                              ))}
                              <th className="text-right p-3 font-semibold text-sm">Total MM</th>
                              <th className="text-right p-3 font-semibold text-sm">Salary Cost</th>
                              <th className="text-center p-3 font-semibold text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {wave.grid_allocations.map((allocation) => {
                              const { totalManMonths, baseSalaryCost } = calculateResourceBaseCost(allocation);
                              return (
                                <tr
                                  key={allocation.id}
                                  className={`border-b border-[#E2E8F0] ${allocation.is_onsite ? "bg-amber-50/30" : ""}`}
                                  data-testid={`allocation-row-${allocation.id}`}
                                >
                                  <td className="p-3 font-medium text-sm">{allocation.skill_name}</td>
                                  <td className="p-3 text-sm">{allocation.proficiency_level}</td>
                                  <td className="p-3 text-sm">{allocation.base_location_name}</td>
                                  <td className="p-3 text-right">
                                    <Input
                                      type="number"
                                      className="w-24 text-right font-mono text-sm"
                                      value={allocation.avg_monthly_salary}
                                      onChange={(e) => handleSalaryChange(wave.id, allocation.id, e.target.value)}
                                      data-testid={`salary-${allocation.id}`}
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => handleToggleOnsite(wave.id, allocation.id)}
                                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                        allocation.is_onsite 
                                          ? "bg-amber-500 text-white" 
                                          : "bg-gray-200 text-gray-600"
                                      }`}
                                      data-testid={`onsite-toggle-${allocation.id}`}
                                    >
                                      {allocation.is_onsite ? "ON" : "OFF"}
                                    </button>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => handleToggleTravelRequired(wave.id, allocation.id)}
                                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                            allocation.travel_required 
                                              ? "bg-purple-500 text-white" 
                                              : "bg-gray-200 text-gray-600"
                                          }`}
                                          data-testid={`travel-toggle-${allocation.id}`}
                                        >
                                          {allocation.travel_required ? "YES" : "NO"}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="max-w-xs p-3 text-xs">
                                        {allocation.travel_required ? (
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2 font-semibold text-purple-600">
                                              <Calculator className="w-4 h-4" />
                                              Logistics Formula Applied
                                            </div>
                                            <div className="space-y-1 text-gray-600">
                                              <p><span className="font-medium">Per-diem:</span> MM × ${waveSummary.logistics?.config?.per_diem_daily || 50} × {waveSummary.logistics?.config?.per_diem_days || 30} days</p>
                                              <p><span className="font-medium">Accommodation:</span> MM × ${waveSummary.logistics?.config?.accommodation_daily || 80} × {waveSummary.logistics?.config?.accommodation_days || 30} days</p>
                                              <p><span className="font-medium">Conveyance:</span> MM × ${waveSummary.logistics?.config?.local_conveyance_daily || 15} × {waveSummary.logistics?.config?.local_conveyance_days || 21} days</p>
                                              <p><span className="font-medium">Air Fare:</span> 1 resource × ${waveSummary.logistics?.config?.flight_cost_per_trip || 450} × {waveSummary.logistics?.config?.num_trips || 6} trips</p>
                                              <p><span className="font-medium">Visa/Medical:</span> 1 resource × ${waveSummary.logistics?.config?.visa_medical_per_trip || 400} × {waveSummary.logistics?.config?.num_trips || 6} trips</p>
                                            </div>
                                          </div>
                                        ) : (
                                          <p>No travel logistics. Click to enable travel costs for this resource.</p>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  </td>
                                  {wave.phase_names.map((_, phaseIndex) => (
                                    <td key={phaseIndex} className="p-2">
                                      <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="0"
                                        className="w-20 text-center font-mono text-sm"
                                        value={allocation.phase_allocations[phaseIndex] || ""}
                                        onChange={(e) => handlePhaseAllocationChange(wave.id, allocation.id, phaseIndex, e.target.value)}
                                        data-testid={`phase-${phaseIndex}-${allocation.id}`}
                                      />
                                    </td>
                                  ))}
                                  <td className="p-3 text-right font-mono tabular-nums font-semibold text-sm">
                                    {totalManMonths.toFixed(1)}
                                  </td>
                                  <td className="p-3 text-right font-mono tabular-nums text-sm text-gray-600">
                                    ${baseSalaryCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </td>
                                  <td className="p-3 text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteAllocation(wave.id, allocation.id)}
                                      className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                                      data-testid={`delete-allocation-${allocation.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Logistics Breakdown */}
                    {wave.grid_allocations.length > 0 && waveSummary.travelingResourceCount > 0 && (
                      <Card className="bg-purple-50/50 border border-purple-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                            <Plane className="w-4 h-4 text-purple-600" />
                            Logistics Cost Breakdown
                            <Badge variant="outline" className="ml-2 text-purple-600 border-purple-300">
                              {waveSummary.travelingResourceCount} traveling resource(s), {waveSummary.travelingMM.toFixed(1)} MM
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2">Description</th>
                                  <th className="text-right py-2">Traveling MM/Res</th>
                                  <th className="text-right py-2">Rate (USD)</th>
                                  <th className="text-right py-2">Qty</th>
                                  <th className="text-right py-2 font-bold">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="py-1">Per-diems</td>
                                  <td className="text-right font-mono">{waveSummary.travelingMM.toFixed(2)}</td>
                                  <td className="text-right font-mono">${waveSummary.logistics.config.per_diem_daily}</td>
                                  <td className="text-right font-mono">{waveSummary.logistics.config.per_diem_days}</td>
                                  <td className="text-right font-mono font-semibold">${waveSummary.logistics.perDiemCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                                <tr>
                                  <td className="py-1">Accommodation</td>
                                  <td className="text-right font-mono">{waveSummary.travelingMM.toFixed(2)}</td>
                                  <td className="text-right font-mono">${waveSummary.logistics.config.accommodation_daily}</td>
                                  <td className="text-right font-mono">{waveSummary.logistics.config.accommodation_days}</td>
                                  <td className="text-right font-mono font-semibold">${waveSummary.logistics.accommodationCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                                <tr>
                                  <td className="py-1">Local Conveyance</td>
                                  <td className="text-right font-mono">{waveSummary.travelingMM.toFixed(2)}</td>
                                  <td className="text-right font-mono">${waveSummary.logistics.config.local_conveyance_daily}</td>
                                  <td className="text-right font-mono">{waveSummary.logistics.config.local_conveyance_days}</td>
                                  <td className="text-right font-mono font-semibold">${waveSummary.logistics.conveyanceCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                                <tr>
                                  <td className="py-1">Travel - Air Fare</td>
                                  <td className="text-right font-mono">{waveSummary.travelingResourceCount}</td>
                                  <td className="text-right font-mono">${waveSummary.logistics.config.flight_cost_per_trip}</td>
                                  <td className="text-right font-mono">{waveSummary.logistics.config.num_trips}</td>
                                  <td className="text-right font-mono font-semibold">${waveSummary.logistics.flightCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                                <tr>
                                  <td className="py-1">Visa & Medical</td>
                                  <td className="text-right font-mono">{waveSummary.travelingResourceCount}</td>
                                  <td className="text-right font-mono">${waveSummary.logistics.config.visa_medical_per_trip}</td>
                                  <td className="text-right font-mono">{waveSummary.logistics.config.num_trips}</td>
                                  <td className="text-right font-mono font-semibold">${waveSummary.logistics.visaMedicalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                                <tr>
                                  <td className="py-1">Other Contingency</td>
                                  <td className="text-right font-mono">1</td>
                                  <td className="text-right font-mono">{waveSummary.logistics.config.contingency_percentage}%</td>
                                  <td className="text-right font-mono">1</td>
                                  <td className="text-right font-mono font-semibold">${waveSummary.logistics.contingencyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                                <tr className="border-t-2 font-bold">
                                  <td className="py-2">Total</td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                  <td className="text-right font-mono text-purple-600">${waveSummary.logistics.totalLogistics.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Wave Summary */}
                    {wave.grid_allocations.length > 0 && (
                      <Card className="bg-[#F8FAFC] border border-[#E2E8F0]">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-bold text-[#0F172A]">{wave.name} Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Total Man-Months</p>
                              <p className="font-mono font-semibold text-lg">{waveSummary.totalMM.toFixed(1)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Onsite MM ({waveSummary.onsiteResourceCount} resources)</p>
                              <p className="font-mono font-semibold text-lg text-[#F59E0B]">{waveSummary.onsiteMM.toFixed(1)}</p>
                              <p className="text-xs text-gray-500">${waveSummary.onsiteSalaryCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Offshore MM</p>
                              <p className="font-mono font-semibold text-lg text-[#0EA5E9]">{waveSummary.offshoreMM.toFixed(1)}</p>
                              <p className="text-xs text-gray-500">${waveSummary.offshoreSalaryCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Traveling ({waveSummary.travelingResourceCount} resources)</p>
                              <p className="font-mono font-semibold text-lg text-purple-600">{waveSummary.travelingMM.toFixed(1)} MM</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Total Logistics</p>
                              <p className="font-mono font-semibold text-lg">${waveSummary.totalLogisticsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-600">Wave Selling Price</p>
                              <p className="font-mono font-semibold text-xl text-[#10B981]">${waveSummary.sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              )})}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Wave Logistics Editor Dialog */}
      <Dialog open={editLogisticsDialogOpen} onOpenChange={setEditLogisticsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F172A]">Wave Logistics Configuration</DialogTitle>
            <DialogDescription>Configure logistics rates for this wave. Costs calculated based on total onsite MM and resource count.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Per-Diem ($/day)</Label>
                <Input type="number" value={waveLogistics.per_diem_daily} onChange={(e) => setWaveLogistics({ ...waveLogistics, per_diem_daily: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Per-Diem Days/Month</Label>
                <Input type="number" value={waveLogistics.per_diem_days} onChange={(e) => setWaveLogistics({ ...waveLogistics, per_diem_days: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-end">
                <p className="text-xs text-gray-500 pb-2">Onsite MM × ${waveLogistics.per_diem_daily} × {waveLogistics.per_diem_days}</p>
              </div>
              
              <div>
                <Label>Accommodation ($/day)</Label>
                <Input type="number" value={waveLogistics.accommodation_daily} onChange={(e) => setWaveLogistics({ ...waveLogistics, accommodation_daily: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Accommodation Days/Month</Label>
                <Input type="number" value={waveLogistics.accommodation_days} onChange={(e) => setWaveLogistics({ ...waveLogistics, accommodation_days: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-end">
                <p className="text-xs text-gray-500 pb-2">Onsite MM × ${waveLogistics.accommodation_daily} × {waveLogistics.accommodation_days}</p>
              </div>
              
              <div>
                <Label>Conveyance ($/day)</Label>
                <Input type="number" value={waveLogistics.local_conveyance_daily} onChange={(e) => setWaveLogistics({ ...waveLogistics, local_conveyance_daily: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Conveyance Days/Month</Label>
                <Input type="number" value={waveLogistics.local_conveyance_days} onChange={(e) => setWaveLogistics({ ...waveLogistics, local_conveyance_days: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-end">
                <p className="text-xs text-gray-500 pb-2">Onsite MM × ${waveLogistics.local_conveyance_daily} × {waveLogistics.local_conveyance_days}</p>
              </div>
              
              <div>
                <Label>Air Fare ($/trip)</Label>
                <Input type="number" value={waveLogistics.flight_cost_per_trip} onChange={(e) => setWaveLogistics({ ...waveLogistics, flight_cost_per_trip: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Number of Trips</Label>
                <Input type="number" value={waveLogistics.num_trips} onChange={(e) => setWaveLogistics({ ...waveLogistics, num_trips: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-end">
                <p className="text-xs text-gray-500 pb-2">Resources × ${waveLogistics.flight_cost_per_trip} × {waveLogistics.num_trips}</p>
              </div>
              
              <div>
                <Label>Visa & Medical ($/trip)</Label>
                <Input type="number" value={waveLogistics.visa_medical_per_trip} onChange={(e) => setWaveLogistics({ ...waveLogistics, visa_medical_per_trip: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Contingency %</Label>
                <Input type="number" value={waveLogistics.contingency_percentage} onChange={(e) => setWaveLogistics({ ...waveLogistics, contingency_percentage: parseFloat(e.target.value) || 0 })} />
              </div>
              <div></div>
            </div>
            <Button onClick={handleSaveWaveLogistics} className="w-full bg-[#0F172A] hover:bg-[#0F172A]/90">
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Update Logistics Dialog */}
      <Dialog open={batchLogisticsDialogOpen} onOpenChange={setBatchLogisticsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F172A]">Batch Update Logistics</DialogTitle>
            <DialogDescription>Update logistics configuration for all onsite resources in this wave</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-amber-50 p-3 rounded border border-amber-200 text-sm">
              <p className="font-semibold">This will update the wave logistics config.</p>
              <p className="text-gray-600">Logistics are calculated at wave level based on total onsite MM and resource count.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Per-Diem ($/day)</Label>
                <Input type="number" value={waveLogistics.per_diem_daily} onChange={(e) => setWaveLogistics({ ...waveLogistics, per_diem_daily: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Per-Diem Days/Month</Label>
                <Input type="number" value={waveLogistics.per_diem_days} onChange={(e) => setWaveLogistics({ ...waveLogistics, per_diem_days: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Accommodation ($/day)</Label>
                <Input type="number" value={waveLogistics.accommodation_daily} onChange={(e) => setWaveLogistics({ ...waveLogistics, accommodation_daily: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Accommodation Days/Month</Label>
                <Input type="number" value={waveLogistics.accommodation_days} onChange={(e) => setWaveLogistics({ ...waveLogistics, accommodation_days: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Conveyance ($/day)</Label>
                <Input type="number" value={waveLogistics.local_conveyance_daily} onChange={(e) => setWaveLogistics({ ...waveLogistics, local_conveyance_daily: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Conveyance Days/Month</Label>
                <Input type="number" value={waveLogistics.local_conveyance_days} onChange={(e) => setWaveLogistics({ ...waveLogistics, local_conveyance_days: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Air Fare ($/trip)</Label>
                <Input type="number" value={waveLogistics.flight_cost_per_trip} onChange={(e) => setWaveLogistics({ ...waveLogistics, flight_cost_per_trip: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Number of Trips</Label>
                <Input type="number" value={waveLogistics.num_trips} onChange={(e) => setWaveLogistics({ ...waveLogistics, num_trips: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Visa & Medical ($/trip)</Label>
                <Input type="number" value={waveLogistics.visa_medical_per_trip} onChange={(e) => setWaveLogistics({ ...waveLogistics, visa_medical_per_trip: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Contingency %</Label>
                <Input type="number" value={waveLogistics.contingency_percentage} onChange={(e) => setWaveLogistics({ ...waveLogistics, contingency_percentage: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <Button onClick={handleBatchUpdateLogistics} className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Apply to Wave
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save as New Version Dialog */}
      <Dialog open={saveAsNewVersionDialog} onOpenChange={setSaveAsNewVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F172A]">Save as New Version</DialogTitle>
            <DialogDescription>Create a new version of {projectNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Version Notes (optional)</Label>
              <Textarea
                placeholder="Describe changes in this version..."
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded text-sm">
              <p className="font-semibold">This will:</p>
              <ul className="list-disc list-inside text-gray-700 mt-1">
                <li>Create version {projectVersion + 1} of {projectNumber}</li>
                <li>Mark current version as historical</li>
                <li>Keep all previous versions accessible</li>
              </ul>
            </div>
            <Button onClick={handleSaveAsNewVersion} className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
              <History className="w-4 h-4 mr-2" />
              Create Version {projectVersion + 1}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F172A]">
              Project Estimate Summary
              {projectNumber && <span className="ml-2 text-base font-normal text-gray-500">{projectNumber} v{projectVersion}</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* Project Details */}
            <Card className="bg-[#F8FAFC]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-[#0F172A]">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Customer</p>
                  <p className="font-semibold">{customers.find(c => c.id === customerId)?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Project</p>
                  <p className="font-semibold">{projectName || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="font-semibold">{COUNTRIES.find(c => c.code === projectLocation)?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Technology</p>
                  <p className="font-semibold">{technologies.find(t => t.id === technologyId)?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Project Type</p>
                  <p className="font-semibold">{projectTypes.find(t => t.id === projectTypeId)?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Profit Margin</p>
                  <p className="font-semibold">{profitMarginPercentage}%</p>
                </div>
              </CardContent>
            </Card>

            {/* Wave Summaries */}
            {waves.map(wave => {
              const summary = calculateWaveSummary(wave);
              return (
                <Card key={wave.id} className="border-2 border-[#0EA5E9]">
                  <CardHeader className="pb-3 bg-[#E0F2FE]">
                    <CardTitle className="text-lg font-bold text-[#0F172A]">
                      {wave.name} - {wave.duration_months} months ({wave.grid_allocations.length} resources)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">Total MM</p>
                        <p className="text-2xl font-bold font-mono">{summary.totalMM.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded">
                        <p className="text-sm text-gray-600">Onsite MM</p>
                        <p className="text-2xl font-bold font-mono text-[#F59E0B]">{summary.onsiteMM.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <p className="text-sm text-gray-600">Offshore MM</p>
                        <p className="text-2xl font-bold font-mono text-[#0EA5E9]">{summary.offshoreMM.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <p className="text-sm text-gray-600">Logistics</p>
                        <p className="text-2xl font-bold font-mono">${summary.totalLogisticsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="col-span-2 text-center p-4 bg-gray-100 rounded">
                        <p className="text-sm text-gray-600">Cost to Company</p>
                        <p className="text-3xl font-bold font-mono">${summary.totalCostToCompany.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="col-span-2 text-center p-4 bg-green-50 rounded">
                        <p className="text-sm text-gray-600">Wave Selling Price</p>
                        <p className="text-3xl font-bold font-mono text-[#10B981]">${summary.sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Overall Summary */}
            <Card className="border-4 border-[#10B981]">
              <CardHeader className="pb-3 bg-green-50">
                <CardTitle className="text-2xl font-bold text-[#0F172A]">Overall Project Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600 mb-2">Total Man-Months</p>
                    <p className="text-4xl font-bold font-mono">{overall.totalMM.toFixed(1)}</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded">
                    <p className="text-sm text-gray-600 mb-2">Total Onsite MM</p>
                    <p className="text-4xl font-bold font-mono text-[#F59E0B]">{overall.onsiteMM.toFixed(1)}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <p className="text-sm text-gray-600 mb-2">Total Offshore MM</p>
                    <p className="text-4xl font-bold font-mono text-[#0EA5E9]">{overall.offshoreMM.toFixed(1)}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded">
                    <p className="text-sm text-gray-600 mb-2">Total Logistics</p>
                    <p className="text-3xl font-bold font-mono">${overall.totalLogisticsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-100 rounded">
                    <p className="text-sm text-gray-600 mb-2">Cost to Company</p>
                    <p className="text-3xl font-bold font-mono">${overall.totalCostToCompany.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="text-center p-4 bg-green-100 rounded">
                    <p className="text-sm text-gray-600 mb-2">Profit ({profitMarginPercentage}%)</p>
                    <p className="text-3xl font-bold font-mono text-[#10B981]">
                      ${(overall.sellingPrice - overall.totalCostToCompany).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-3 text-center p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-[#10B981]">
                    <p className="text-lg text-gray-700 mb-3 font-semibold">GRAND TOTAL (Selling Price)</p>
                    <p className="text-5xl font-extrabold font-mono text-[#10B981]">
                      ${overall.sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default ProjectEstimator;
