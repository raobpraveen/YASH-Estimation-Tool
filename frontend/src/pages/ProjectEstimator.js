import { useEffect, useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Plane, Save, FileDown, X } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { COUNTRIES, DEFAULT_PHASES } from "@/utils/constants";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProjectEstimator = () => {
  const [rates, setRates] = useState([]);
  const [locations, setLocations] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  
  // Project header
  const [projectName, setProjectName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [technologyId, setTechnologyId] = useState("");
  const [projectTypeId, setProjectTypeId] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [profitMarginPercentage, setProfitMarginPercentage] = useState(15);
  
  // Waves
  const [waves, setWaves] = useState([]);
  const [activeWaveId, setActiveWaveId] = useState("");
  
  // Dialog states
  const [addWaveDialogOpen, setAddWaveDialogOpen] = useState(false);
  const [addResourceDialogOpen, setAddResourceDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  
  const [newWave, setNewWave] = useState({ name: "", duration_months: "" });
  const [newAllocation, setNewAllocation] = useState({
    rate_id: "",
    is_onsite: false,
    per_diem_monthly: "",
    accommodation_monthly: "",
    flight_cost_per_trip: "",
    num_trips: "",
    visa_cost: "",
    insurance_cost: "",
    local_conveyance_monthly: "",
    misc_cost: "",
  });

  useEffect(() => {
    fetchRates();
    fetchLocations();
    fetchTechnologies();
    fetchProjectTypes();
  }, []);

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

  const handleAddWave = () => {
    if (!newWave.name || !newWave.duration_months) {
      toast.error("Please fill wave name and duration");
      return;
    }

    const wave = {
      id: Math.random().toString(36).substr(2, 9),
      name: newWave.name,
      duration_months: parseFloat(newWave.duration_months),
      phases: DEFAULT_PHASES,
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
      setActiveWaveId(waves[0].id);
    }
    toast.success("Wave deleted");
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

    const allocation = {
      id: Math.random().toString(36).substr(2, 9),
      skill_id: selectedRate.skill_id,
      skill_name: selectedRate.skill_name,
      proficiency_level: selectedRate.proficiency_level,
      avg_monthly_salary: selectedRate.avg_monthly_salary,
      base_location_id: selectedRate.base_location_id,
      base_location_name: selectedRate.base_location_name,
      overhead_percentage: location.overhead_percentage,
      is_onsite: newAllocation.is_onsite,
      phase_allocations: {},
      per_diem_monthly: parseFloat(newAllocation.per_diem_monthly || 0),
      accommodation_monthly: parseFloat(newAllocation.accommodation_monthly || 0),
      flight_cost_per_trip: parseFloat(newAllocation.flight_cost_per_trip || 0),
      num_trips: parseInt(newAllocation.num_trips || 0),
      visa_cost: parseFloat(newAllocation.visa_cost || 0),
      insurance_cost: parseFloat(newAllocation.insurance_cost || 0),
      local_conveyance_monthly: parseFloat(newAllocation.local_conveyance_monthly || 0),
      misc_cost: parseFloat(newAllocation.misc_cost || 0),
    };

    setWaves(waves.map(w => 
      w.id === activeWaveId 
        ? { ...w, grid_allocations: [...w.grid_allocations, allocation] }
        : w
    ));

    setNewAllocation({
      rate_id: "",
      is_onsite: false,
      per_diem_monthly: "",
      accommodation_monthly: "",
      flight_cost_per_trip: "",
      num_trips: "",
      visa_cost: "",
      insurance_cost: "",
      local_conveyance_monthly: "",
      misc_cost: "",
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

  const handlePhaseAllocationChange = (waveId, allocationId, phase, value) => {
    setWaves(waves.map(w => 
      w.id === waveId
        ? {
            ...w,
            grid_allocations: w.grid_allocations.map(a =>
              a.id === allocationId
                ? { ...a, phase_allocations: { ...a.phase_allocations, [phase]: parseFloat(value) || 0 } }
                : a
            )
          }
        : w
    ));
  };

  const calculateAllocationCost = (allocation) => {
    const totalManMonths = Object.values(allocation.phase_allocations).reduce((sum, val) => sum + val, 0);
    const baseSalaryCost = allocation.avg_monthly_salary * totalManMonths;
    const logisticsCost = allocation.is_onsite
      ? (allocation.per_diem_monthly + allocation.accommodation_monthly + allocation.local_conveyance_monthly) * totalManMonths +
        allocation.flight_cost_per_trip * allocation.num_trips +
        allocation.visa_cost +
        allocation.insurance_cost +
        allocation.misc_cost
      : 0;
    const subtotal = baseSalaryCost + logisticsCost;
    const withOverhead = subtotal * (1 + allocation.overhead_percentage / 100);
    return { subtotal, withOverhead, totalManMonths, baseSalaryCost, logisticsCost };
  };

  const calculateWaveSummary = (wave) => {
    let totalMM = 0;
    let onsiteMM = 0;
    let onsiteSalaryCost = 0;
    let offshoreMM = 0;
    let offshoreSalaryCost = 0;
    let totalLogisticsCost = 0;
    let costWithOverhead = 0;

    wave.grid_allocations.forEach(allocation => {
      const { totalManMonths, baseSalaryCost, logisticsCost, withOverhead } = calculateAllocationCost(allocation);
      totalMM += totalManMonths;
      costWithOverhead += withOverhead;

      if (allocation.is_onsite) {
        onsiteMM += totalManMonths;
        onsiteSalaryCost += baseSalaryCost;
        totalLogisticsCost += logisticsCost;
      } else {
        offshoreMM += totalManMonths;
        offshoreSalaryCost += baseSalaryCost;
      }
    });

    const withProfit = costWithOverhead * (1 + profitMarginPercentage / 100);

    return {
      totalMM,
      onsiteMM,
      onsiteSalaryCost,
      offshoreMM,
      offshoreSalaryCost,
      totalLogisticsCost,
      costWithOverhead,
      sellingPrice: withProfit,
    };
  };

  const calculateOverallSummary = () => {
    let totalMM = 0;
    let onsiteMM = 0;
    let onsiteSalaryCost = 0;
    let offshoreMM = 0;
    let offshoreSalaryCost = 0;
    let totalLogisticsCost = 0;
    let totalCostWithOverhead = 0;

    waves.forEach(wave => {
      const summary = calculateWaveSummary(wave);
      totalMM += summary.totalMM;
      onsiteMM += summary.onsiteMM;
      onsiteSalaryCost += summary.onsiteSalaryCost;
      offshoreMM += summary.offshoreMM;
      offshoreSalaryCost += summary.offshoreSalaryCost;
      totalLogisticsCost += summary.totalLogisticsCost;
      totalCostWithOverhead += summary.costWithOverhead;
    });

    const sellingPrice = totalCostWithOverhead * (1 + profitMarginPercentage / 100);

    return {
      totalMM,
      onsiteMM,
      onsiteSalaryCost,
      offshoreMM,
      offshoreSalaryCost,
      totalLogisticsCost,
      totalCostWithOverhead,
      sellingPrice,
    };
  };

  const handleSaveProject = async () => {
    if (!projectName || !customerName) {
      toast.error("Please enter project name and customer name");
      return;
    }

    if (waves.length === 0) {
      toast.error("Please add at least one wave");
      return;
    }

    const selectedTech = technologies.find(t => t.id === technologyId);
    const selectedType = projectTypes.find(t => t.id === projectTypeId);
    const selectedCountry = COUNTRIES.find(c => c.code === projectLocation);

    try {
      await axios.post(`${API}/projects`, {
        name: projectName,
        customer_name: customerName,
        project_location: projectLocation,
        project_location_name: selectedCountry?.name || "",
        technology_id: technologyId,
        technology_name: selectedTech?.name || "",
        project_type_id: projectTypeId,
        project_type_name: selectedType?.name || "",
        description: projectDescription,
        profit_margin_percentage: profitMarginPercentage,
      });

      const projectsRes = await axios.get(`${API}/projects`);
      const createdProject = projectsRes.data.find((p) => p.name === projectName && p.customer_name === customerName);

      if (createdProject) {
        await axios.put(`${API}/projects/${createdProject.id}`, {
          waves: waves.map(w => ({
            id: w.id,
            name: w.name,
            duration_months: w.duration_months,
            phases: w.phases,
            grid_allocations: w.grid_allocations,
          })),
        });
      }

      toast.success("Project saved successfully");
    } catch (error) {
      toast.error("Failed to save project");
      console.error(error);
    }
  };

  const handleExportToExcel = () => {
    if (waves.length === 0) {
      toast.error("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [];
    summaryData.push(["PROJECT ESTIMATE SUMMARY"]);
    summaryData.push([]);
    summaryData.push(["Customer Name", customerName]);
    summaryData.push(["Project Name", projectName]);
    summaryData.push(["Project Location", COUNTRIES.find(c => c.code === projectLocation)?.name || projectLocation]);
    summaryData.push(["Technology", technologies.find(t => t.id === technologyId)?.name || ""]);
    summaryData.push(["Project Type", projectTypes.find(t => t.id === projectTypeId)?.name || ""]);
    summaryData.push(["Description", projectDescription]);
    summaryData.push([]);

    waves.forEach(wave => {
      const summary = calculateWaveSummary(wave);
      summaryData.push([`WAVE: ${wave.name}`, `Duration: ${wave.duration_months} months`]);
      summaryData.push(["Total Man-Months", summary.totalMM.toFixed(2)]);
      summaryData.push(["Onsite Man-Months", summary.onsiteMM.toFixed(2)]);
      summaryData.push(["Onsite Salary Cost", `$${summary.onsiteSalaryCost.toFixed(2)}`]);
      summaryData.push(["Offshore Man-Months", summary.offshoreMM.toFixed(2)]);
      summaryData.push(["Offshore Salary Cost", `$${summary.offshoreSalaryCost.toFixed(2)}`]);
      summaryData.push(["Logistics Costs", `$${summary.totalLogisticsCost.toFixed(2)}`]);
      summaryData.push(["Wave Total (with overhead)", `$${summary.costWithOverhead.toFixed(2)}`]);
      summaryData.push(["Wave Selling Price", `$${summary.sellingPrice.toFixed(2)}`]);
      summaryData.push([]);
    });

    const overall = calculateOverallSummary();
    summaryData.push(["OVERALL PROJECT"]);
    summaryData.push(["Total Man-Months", overall.totalMM.toFixed(2)]);
    summaryData.push(["Total Onsite MM", overall.onsiteMM.toFixed(2)]);
    summaryData.push(["Total Offshore MM", overall.offshoreMM.toFixed(2)]);
    summaryData.push(["Total Logistics", `$${overall.totalLogisticsCost.toFixed(2)}`]);
    summaryData.push(["Profit Margin %", `${profitMarginPercentage}%`]);
    summaryData.push(["GRAND TOTAL", `$${overall.sellingPrice.toFixed(2)}`]);

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Detail sheets for each wave
    waves.forEach(wave => {
      const waveData = [];
      waveData.push([`${wave.name} - ${wave.duration_months} months`]);
      waveData.push([]);
      
      const header = ["Skill", "Level", "Location", "Salary", "Onsite", ...wave.phases, "Total MM", "Cost"];
      waveData.push(header);

      wave.grid_allocations.forEach(alloc => {
        const { totalManMonths, withOverhead } = calculateAllocationCost(alloc);
        const row = [
          alloc.skill_name,
          alloc.proficiency_level,
          alloc.base_location_name,
          alloc.avg_monthly_salary,
          alloc.is_onsite ? "Yes" : "No",
          ...wave.phases.map(p => alloc.phase_allocations[p] || 0),
          totalManMonths.toFixed(2),
          withOverhead.toFixed(2),
        ];
        waveData.push(row);
      });

      const waveWs = XLSX.utils.aoa_to_sheet(waveData);
      waveWs['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 8 }, ...wave.phases.map(() => ({ wch: 10 })), { wch: 10 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, waveWs, wave.name.substring(0, 30));
    });

    XLSX.writeFile(wb, `${projectName || "Project"}_Estimate.xlsx`);
    toast.success("Exported to Excel successfully");
  };

  const activeWave = waves.find(w => w.id === activeWaveId);
  const overall = calculateOverallSummary();

  return (
    <div data-testid="project-estimator" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Project Estimator</h1>
          <p className="text-base text-gray-600 mt-2">Wave-based project estimation with detailed cost breakdown</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSummaryDialogOpen(true)} variant="outline" className="border-[#0EA5E9] text-[#0EA5E9]" data-testid="view-summary-button">
            View Summary
          </Button>
          <Button onClick={handleExportToExcel} variant="outline" className="border-[#10B981] text-[#10B981]" data-testid="export-excel-button">
            <FileDown className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={handleSaveProject} className="bg-[#10B981] hover:bg-[#10B981]/90 text-white" data-testid="save-project-button">
            <Save className="w-4 h-4 mr-2" />
            Save Project
          </Button>
        </div>
      </div>

      {/* Project Header */}
      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#0F172A]">Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="customer-name">Customer Name *</Label>
              <Input
                id="customer-name"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                data-testid="customer-name-input"
              />
            </div>
            <div>
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                data-testid="project-name-input"
              />
            </div>
            <div>
              <Label htmlFor="project-location">Project Location</Label>
              <Select value={projectLocation} onValueChange={setProjectLocation}>
                <SelectTrigger id="project-location" data-testid="project-location-select">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="technology">Technology</Label>
              <Select value={technologyId} onValueChange={setTechnologyId}>
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
              <Select value={projectTypeId} onValueChange={setProjectTypeId}>
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
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Dialog open={addWaveDialogOpen} onOpenChange={setAddWaveDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white" data-testid="add-wave-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Wave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-[#0F172A]">Add New Wave</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="wave-name">Wave Name</Label>
                    <Input
                      id="wave-name"
                      placeholder="e.g., Wave 1, Phase 1"
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
                      step="0.1"
                      placeholder="e.g., 6"
                      value={newWave.duration_months}
                      onChange={(e) => setNewWave({ ...newWave, duration_months: e.target.value })}
                      data-testid="wave-duration-input"
                    />
                  </div>
                  <Button onClick={handleAddWave} className="w-full bg-[#0F172A] hover:bg-[#0F172A]/90" data-testid="submit-wave-button">
                    Add Wave
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
              {waves.map((wave) => (
                <TabsContent key={wave.id} value={wave.id}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-[#0F172A]">{wave.name}</h3>
                        <span className="text-sm text-gray-600">Duration: {wave.duration_months} months</span>
                        <span className="text-sm text-gray-600">Resources: {wave.grid_allocations.length}</span>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={addResourceDialogOpen && activeWaveId === wave.id} onOpenChange={setAddResourceDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white" data-testid="add-resource-button">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Resource
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold text-[#0F172A]">Add Resource to {wave.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <Label htmlFor="resource-rate">Skill & Proficiency</Label>
                                <Select value={newAllocation.rate_id} onValueChange={(value) => setNewAllocation({ ...newAllocation, rate_id: value })}>
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

                              {newAllocation.is_onsite && (
                                <div className="border-t pt-4">
                                  <h4 className="font-semibold text-[#0F172A] mb-3">Logistics Costs</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Per Diem (Monthly)</Label>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={newAllocation.per_diem_monthly}
                                        onChange={(e) => setNewAllocation({ ...newAllocation, per_diem_monthly: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Accommodation (Monthly)</Label>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={newAllocation.accommodation_monthly}
                                        onChange={(e) => setNewAllocation({ ...newAllocation, accommodation_monthly: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Flight (Per Trip)</Label>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={newAllocation.flight_cost_per_trip}
                                        onChange={(e) => setNewAllocation({ ...newAllocation, flight_cost_per_trip: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Number of Trips</Label>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={newAllocation.num_trips}
                                        onChange={(e) => setNewAllocation({ ...newAllocation, num_trips: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Visa Cost</Label>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={newAllocation.visa_cost}
                                        onChange={(e) => setNewAllocation({ ...newAllocation, visa_cost: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Insurance Cost</Label>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={newAllocation.insurance_cost}
                                        onChange={(e) => setNewAllocation({ ...newAllocation, insurance_cost: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Local Conveyance (Monthly)</Label>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={newAllocation.local_conveyance_monthly}
                                        onChange={(e) => setNewAllocation({ ...newAllocation, local_conveyance_monthly: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Miscellaneous</Label>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={newAllocation.misc_cost}
                                        onChange={(e) => setNewAllocation({ ...newAllocation, misc_cost: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                              <Button onClick={handleAddAllocation} className="w-full bg-[#0F172A] hover:bg-[#0F172A]/90" data-testid="submit-resource-button">
                                Add Resource
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
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
                              {wave.phases.map((phase) => (
                                <th key={phase} className="text-center p-3 font-semibold text-sm bg-[#E0F2FE]">
                                  {phase}
                                </th>
                              ))}
                              <th className="text-right p-3 font-semibold text-sm">Total MM</th>
                              <th className="text-right p-3 font-semibold text-sm">Cost</th>
                              <th className="text-center p-3 font-semibold text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {wave.grid_allocations.map((allocation) => {
                              const { totalManMonths, withOverhead } = calculateAllocationCost(allocation);
                              return (
                                <tr
                                  key={allocation.id}
                                  className={`border-b border-[#E2E8F0] ${allocation.is_onsite ? "bg-amber-50/30" : ""}`}
                                  data-testid={`allocation-row-${allocation.id}`}
                                >
                                  <td className="p-3 font-medium text-sm">{allocation.skill_name}</td>
                                  <td className="p-3 text-sm">{allocation.proficiency_level}</td>
                                  <td className="p-3 text-sm">{allocation.base_location_name}</td>
                                  <td className="p-3 text-right font-mono tabular-nums text-sm">
                                    ${allocation.avg_monthly_salary.toLocaleString()}
                                  </td>
                                  <td className="p-3 text-center">
                                    {allocation.is_onsite && <Plane className="w-4 h-4 inline text-[#F59E0B]" />}
                                  </td>
                                  {wave.phases.map((phase) => (
                                    <td key={phase} className="p-2">
                                      <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="0"
                                        className="w-20 text-center font-mono text-sm"
                                        value={allocation.phase_allocations[phase] || ""}
                                        onChange={(e) => handlePhaseAllocationChange(wave.id, allocation.id, phase, e.target.value)}
                                        data-testid={`phase-${phase}-${allocation.id}`}
                                      />
                                    </td>
                                  ))}
                                  <td className="p-3 text-right font-mono tabular-nums font-semibold text-sm">
                                    {totalManMonths.toFixed(1)}
                                  </td>
                                  <td className="p-3 text-right font-mono tabular-nums font-semibold text-sm">
                                    ${withOverhead.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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

                    {/* Wave Summary */}
                    {wave.grid_allocations.length > 0 && (
                      <Card className="bg-[#F8FAFC] border border-[#E2E8F0]">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-bold text-[#0F172A]">{wave.name} Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {(() => {
                              const summary = calculateWaveSummary(wave);
                              return (
                                <>
                                  <div>
                                    <p className="text-gray-600">Total Man-Months</p>
                                    <p className="font-mono font-semibold text-lg">{summary.totalMM.toFixed(1)}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Onsite MM</p>
                                    <p className="font-mono font-semibold text-lg text-[#F59E0B]">{summary.onsiteMM.toFixed(1)}</p>
                                    <p className="text-xs text-gray-500">${summary.onsiteSalaryCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Offshore MM</p>
                                    <p className="font-mono font-semibold text-lg text-[#0EA5E9]">{summary.offshoreMM.toFixed(1)}</p>
                                    <p className="text-xs text-gray-500">${summary.offshoreSalaryCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Logistics</p>
                                    <p className="font-mono font-semibold text-lg">${summary.totalLogisticsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-gray-600">Wave Total (with overhead)</p>
                                    <p className="font-mono font-semibold text-xl">${summary.costWithOverhead.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-gray-600">Wave Selling Price</p>
                                    <p className="font-mono font-semibold text-xl text-[#10B981]">${summary.sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Summary Dialog */}
      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F172A]">Project Estimate Summary</DialogTitle>
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
                  <p className="font-semibold">{customerName || "—"}</p>
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
                {projectDescription && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Description</p>
                    <p className="font-semibold">{projectDescription}</p>
                  </div>
                )}
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
                        <p className="text-xs text-gray-600 mt-1">${summary.onsiteSalaryCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <p className="text-sm text-gray-600">Offshore MM</p>
                        <p className="text-2xl font-bold font-mono text-[#0EA5E9]">{summary.offshoreMM.toFixed(1)}</p>
                        <p className="text-xs text-gray-600 mt-1">${summary.offshoreSalaryCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <p className="text-sm text-gray-600">Logistics</p>
                        <p className="text-2xl font-bold font-mono">${summary.totalLogisticsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="col-span-2 text-center p-4 bg-gray-100 rounded">
                        <p className="text-sm text-gray-600">Wave Total (with overhead)</p>
                        <p className="text-3xl font-bold font-mono">${summary.costWithOverhead.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
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
                    <p className="text-sm text-gray-600 mt-2">${overall.onsiteSalaryCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <p className="text-sm text-gray-600 mb-2">Total Offshore MM</p>
                    <p className="text-4xl font-bold font-mono text-[#0EA5E9]">{overall.offshoreMM.toFixed(1)}</p>
                    <p className="text-sm text-gray-600 mt-2">${overall.offshoreSalaryCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded">
                    <p className="text-sm text-gray-600 mb-2">Total Logistics</p>
                    <p className="text-3xl font-bold font-mono">${overall.totalLogisticsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-100 rounded">
                    <p className="text-sm text-gray-600 mb-2">Total (with overhead)</p>
                    <p className="text-3xl font-bold font-mono">${overall.totalCostWithOverhead.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="text-center p-4 bg-green-100 rounded">
                    <p className="text-sm text-gray-600 mb-2">Profit ({profitMarginPercentage}%)</p>
                    <p className="text-3xl font-bold font-mono text-[#10B981]">
                      ${(overall.sellingPrice - overall.totalCostWithOverhead).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
  );
};

export default ProjectEstimator;
