import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Plane, Save, FileDown } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as ChartTooltip } from "recharts";
import * as XLSX from "xlsx";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DEFAULT_PHASES = ["Discovery", "Prepare", "Explore", "Realize", "Deploy", "Run"];

const ProjectEstimator = () => {
  const [rates, setRates] = useState([]);
  const [locations, setLocations] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  const [profitMarginPercentage, setProfitMarginPercentage] = useState(15);
  const [gridAllocations, setGridAllocations] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newAllocation, setNewAllocation] = useState({
    rate_id: "",
    is_onsite: false,
    phase_allocations: {},
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

  const handleAddAllocation = () => {
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
      phase_allocations: newAllocation.phase_allocations,
      per_diem_monthly: parseFloat(newAllocation.per_diem_monthly || 0),
      accommodation_monthly: parseFloat(newAllocation.accommodation_monthly || 0),
      flight_cost_per_trip: parseFloat(newAllocation.flight_cost_per_trip || 0),
      num_trips: parseInt(newAllocation.num_trips || 0),
      visa_cost: parseFloat(newAllocation.visa_cost || 0),
      insurance_cost: parseFloat(newAllocation.insurance_cost || 0),
      local_conveyance_monthly: parseFloat(newAllocation.local_conveyance_monthly || 0),
      misc_cost: parseFloat(newAllocation.misc_cost || 0),
    };

    setGridAllocations([...gridAllocations, allocation]);
    setNewAllocation({
      rate_id: "",
      is_onsite: false,
      phase_allocations: {},
      per_diem_monthly: "",
      accommodation_monthly: "",
      flight_cost_per_trip: "",
      num_trips: "",
      visa_cost: "",
      insurance_cost: "",
      local_conveyance_monthly: "",
      misc_cost: "",
    });
    setAddDialogOpen(false);
    toast.success("Resource added to estimate");
  };

  const handleDeleteAllocation = (id) => {
    setGridAllocations(gridAllocations.filter((a) => a.id !== id));
  };

  const handlePhaseAllocationChange = (allocationId, phase, value) => {
    setGridAllocations(
      gridAllocations.map((a) =>
        a.id === allocationId
          ? { ...a, phase_allocations: { ...a.phase_allocations, [phase]: parseFloat(value) || 0 } }
          : a
      )
    );
  };

  const calculateAllocationCost = (allocation) => {
    const totalManMonths = Object.values(allocation.phase_allocations).reduce((sum, val) => sum + val, 0);
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
    return { subtotal, withOverhead, totalManMonths };
  };

  const baseCost = gridAllocations.reduce((sum, a) => sum + calculateAllocationCost(a).subtotal, 0);
  const costWithOverhead = gridAllocations.reduce((sum, a) => sum + calculateAllocationCost(a).withOverhead, 0);
  const profitAmount = costWithOverhead * (profitMarginPercentage / 100);
  const sellingPrice = costWithOverhead + profitAmount;

  const handleSaveProject = async () => {
    if (!projectName) {
      toast.error("Please enter a project name");
      return;
    }

    if (gridAllocations.length === 0) {
      toast.error("Please add at least one resource");
      return;
    }

    try {
      await axios.post(`${API}/projects`, {
        name: projectName,
        description: projectDescription,
        phases: phases,
        profit_margin_percentage: profitMarginPercentage,
      });

      const projectsRes = await axios.get(`${API}/projects`);
      const createdProject = projectsRes.data.find((p) => p.name === projectName);

      if (createdProject) {
        await axios.put(`${API}/projects/${createdProject.id}`, {
          grid_allocations: gridAllocations.map((a) => ({
            skill_id: a.skill_id,
            skill_name: a.skill_name,
            proficiency_level: a.proficiency_level,
            avg_monthly_salary: a.avg_monthly_salary,
            base_location_id: a.base_location_id,
            base_location_name: a.base_location_name,
            overhead_percentage: a.overhead_percentage,
            is_onsite: a.is_onsite,
            phase_allocations: a.phase_allocations,
            per_diem_monthly: a.per_diem_monthly,
            accommodation_monthly: a.accommodation_monthly,
            flight_cost_per_trip: a.flight_cost_per_trip,
            num_trips: a.num_trips,
            visa_cost: a.visa_cost,
            insurance_cost: a.insurance_cost,
            local_conveyance_monthly: a.local_conveyance_monthly,
            misc_cost: a.misc_cost,
          })),
        });
      }

      toast.success("Project saved successfully");
      setProjectName("");
      setProjectDescription("");
      setGridAllocations([]);
      setPhases(DEFAULT_PHASES);
      setProfitMarginPercentage(15);
    } catch (error) {
      toast.error("Failed to save project");
    }
  };

  const handleExportToExcel = () => {
    if (gridAllocations.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = [];
    
    exportData.push(["Project Estimate: " + (projectName || "Untitled Project")]);
    exportData.push([]);
    
    const phasesHeader = ["Skill", "Proficiency", "Location", "Salary/Month", "Onsite", ...phases, "Total MM", "Total Cost"];
    exportData.push(phasesHeader);
    
    gridAllocations.forEach((allocation) => {
      const { totalManMonths, withOverhead } = calculateAllocationCost(allocation);
      const row = [
        allocation.skill_name,
        allocation.proficiency_level,
        allocation.base_location_name,
        allocation.avg_monthly_salary,
        allocation.is_onsite ? "Yes" : "No",
        ...phases.map(phase => allocation.phase_allocations[phase] || 0),
        totalManMonths,
        withOverhead.toFixed(2),
      ];
      exportData.push(row);
    });
    
    exportData.push([]);
    exportData.push(["Summary"]);
    exportData.push(["Base Cost", baseCost.toFixed(2)]);
    exportData.push(["Cost with Overhead", costWithOverhead.toFixed(2)]);
    exportData.push(["Profit Margin (%)", profitMarginPercentage]);
    exportData.push(["Profit Amount", profitAmount.toFixed(2)]);
    exportData.push(["Selling Price", sellingPrice.toFixed(2)]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    
    ws['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 8 },
      ...phases.map(() => ({ wch: 10 })),
      { wch: 10 }, { wch: 12 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, "Estimate");
    XLSX.writeFile(wb, `${projectName || "Project"}_Estimate.xlsx`);
    toast.success("Exported to Excel successfully");
  };

  const chartData = [
    { name: "Base Cost", value: baseCost, color: "#0EA5E9" },
    { name: "Overhead", value: costWithOverhead - baseCost, color: "#F59E0B" },
    { name: "Profit", value: profitAmount, color: "#10B981" },
  ];

  return (
    <div data-testid="project-estimator">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Project Estimator</h1>
        <p className="text-base text-gray-600 mt-2">Calculate project costs with phase-based allocation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Base Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-mono tabular-nums text-[#0EA5E9]" data-testid="base-cost">
              ${baseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Cost + Overhead</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-mono tabular-nums text-[#F59E0B]" data-testid="cost-with-overhead">
              ${costWithOverhead.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Selling Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-mono tabular-nums text-[#10B981]" data-testid="selling-price">
              ${sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#0F172A]">Project Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                data-testid="project-name-input"
              />
            </div>
            <div>
              <Label htmlFor="project-description">Description</Label>
              <Input
                id="project-description"
                placeholder="Optional description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                data-testid="project-description-input"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label>Profit Margin Percentage</Label>
                <span className="font-mono font-semibold text-[#0F172A]" data-testid="profit-margin-percentage">
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
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#0F172A]">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {baseCost > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    formatter={(value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px]">
                <p className="text-gray-400">Add resources to see breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-[#0F172A]">Resource Allocation Grid</CardTitle>
            <div className="flex gap-2">
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white" data-testid="add-resource-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Resource
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-[#0F172A]">Add Resource</DialogTitle>
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
                              data-testid="per-diem-input"
                            />
                          </div>
                          <div>
                            <Label>Accommodation (Monthly)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={newAllocation.accommodation_monthly}
                              onChange={(e) => setNewAllocation({ ...newAllocation, accommodation_monthly: e.target.value })}
                              data-testid="accommodation-input"
                            />
                          </div>
                          <div>
                            <Label>Flight (Per Trip)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={newAllocation.flight_cost_per_trip}
                              onChange={(e) => setNewAllocation({ ...newAllocation, flight_cost_per_trip: e.target.value })}
                              data-testid="flight-cost-input"
                            />
                          </div>
                          <div>
                            <Label>Number of Trips</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={newAllocation.num_trips}
                              onChange={(e) => setNewAllocation({ ...newAllocation, num_trips: e.target.value })}
                              data-testid="num-trips-input"
                            />
                          </div>
                          <div>
                            <Label>Visa Cost</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={newAllocation.visa_cost}
                              onChange={(e) => setNewAllocation({ ...newAllocation, visa_cost: e.target.value })}
                              data-testid="visa-cost-input"
                            />
                          </div>
                          <div>
                            <Label>Insurance Cost</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={newAllocation.insurance_cost}
                              onChange={(e) => setNewAllocation({ ...newAllocation, insurance_cost: e.target.value })}
                              data-testid="insurance-cost-input"
                            />
                          </div>
                          <div>
                            <Label>Local Conveyance (Monthly)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={newAllocation.local_conveyance_monthly}
                              onChange={(e) => setNewAllocation({ ...newAllocation, local_conveyance_monthly: e.target.value })}
                              data-testid="local-conveyance-input"
                            />
                          </div>
                          <div>
                            <Label>Miscellaneous</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={newAllocation.misc_cost}
                              onChange={(e) => setNewAllocation({ ...newAllocation, misc_cost: e.target.value })}
                              data-testid="misc-cost-input"
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
              <Button onClick={handleExportToExcel} variant="outline" className="border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10" data-testid="export-excel-button">
                <FileDown className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={handleSaveProject} className="bg-[#10B981] hover:bg-[#10B981]/90 text-white" data-testid="save-project-button">
                <Save className="w-4 h-4 mr-2" />
                Save Project
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {gridAllocations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No resources added yet. Click "Add Resource" to start.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#E2E8F0]">
                    <th className="text-left p-3 font-semibold text-sm">Skill</th>
                    <th className="text-left p-3 font-semibold text-sm">Level</th>
                    <th className="text-left p-3 font-semibold text-sm">Location</th>
                    <th className="text-right p-3 font-semibold text-sm">$/Month</th>
                    <th className="text-center p-3 font-semibold text-sm">Onsite</th>
                    {phases.map((phase) => (
                      <th key={phase} className="text-center p-3 font-semibold text-sm bg-[#F1F5F9]">
                        {phase}
                      </th>
                    ))}
                    <th className="text-right p-3 font-semibold text-sm">Total MM</th>
                    <th className="text-right p-3 font-semibold text-sm">Cost</th>
                    <th className="text-center p-3 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gridAllocations.map((allocation) => {
                    const { totalManMonths, withOverhead } = calculateAllocationCost(allocation);
                    return (
                      <tr
                        key={allocation.id}
                        className={`border-b border-[#E2E8F0] ${allocation.is_onsite ? "bg-blue-50/30" : ""}`}
                        data-testid={`allocation-row-${allocation.id}`}
                      >
                        <td className="p-3 font-medium text-sm">{allocation.skill_name}</td>
                        <td className="p-3 text-sm">{allocation.proficiency_level}</td>
                        <td className="p-3 text-sm">{allocation.base_location_name}</td>
                        <td className="p-3 text-right font-mono tabular-nums text-sm">
                          ${allocation.avg_monthly_salary.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          {allocation.is_onsite && <Plane className="w-4 h-4 inline text-[#0EA5E9]" />}
                        </td>
                        {phases.map((phase) => (
                          <td key={phase} className="p-2 bg-[#F8FAFC]">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              className="w-20 text-center font-mono text-sm"
                              value={allocation.phase_allocations[phase] || ""}
                              onChange={(e) => handlePhaseAllocationChange(allocation.id, phase, e.target.value)}
                              data-testid={`phase-${phase}-${allocation.id}`}
                            />
                          </td>
                        ))}
                        <td className="p-3 text-right font-mono tabular-nums font-semibold text-sm">
                          {totalManMonths.toFixed(1)}
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums font-semibold text-sm">
                          ${withOverhead.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAllocation(allocation.id)}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectEstimator;
