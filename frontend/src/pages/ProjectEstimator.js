import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Plane, Save } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as ChartTooltip } from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PROFICIENCY_LEVELS = ["Junior", "Mid", "Senior", "Expert"];

const ProjectEstimator = () => {
  const [rates, setRates] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [overheadPercentage, setOverheadPercentage] = useState(20);
  const [profitMarginPercentage, setProfitMarginPercentage] = useState(15);
  const [resources, setResources] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    rate_id: "",
    man_months: "",
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
  }, []);

  const fetchRates = async () => {
    try {
      const response = await axios.get(`${API}/proficiency-rates`);
      setRates(response.data);
    } catch (error) {
      toast.error("Failed to fetch proficiency rates");
    }
  };

  const handleAddResource = () => {
    if (!newResource.rate_id || !newResource.man_months) {
      toast.error("Please select a skill and enter man-months");
      return;
    }

    const selectedRate = rates.find((r) => r.id === newResource.rate_id);
    if (!selectedRate) return;

    const resource = {
      id: Math.random().toString(36).substr(2, 9),
      skill_name: selectedRate.skill_name,
      technology: selectedRate.technology,
      proficiency_level: selectedRate.proficiency_level,
      avg_monthly_salary: selectedRate.avg_monthly_salary,
      man_months: parseFloat(newResource.man_months),
      is_onsite: newResource.is_onsite,
      per_diem_monthly: parseFloat(newResource.per_diem_monthly || 0),
      accommodation_monthly: parseFloat(newResource.accommodation_monthly || 0),
      flight_cost_per_trip: parseFloat(newResource.flight_cost_per_trip || 0),
      num_trips: parseInt(newResource.num_trips || 0),
      visa_cost: parseFloat(newResource.visa_cost || 0),
      insurance_cost: parseFloat(newResource.insurance_cost || 0),
      local_conveyance_monthly: parseFloat(newResource.local_conveyance_monthly || 0),
      misc_cost: parseFloat(newResource.misc_cost || 0),
    };

    setResources([...resources, resource]);
    setNewResource({
      rate_id: "",
      man_months: "",
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
    setAddDialogOpen(false);
    toast.success("Resource added to estimate");
  };

  const handleDeleteResource = (id) => {
    setResources(resources.filter((r) => r.id !== id));
  };

  const calculateResourceCost = (resource) => {
    const baseSalaryCost = resource.avg_monthly_salary * resource.man_months;
    const logisticsCost = resource.is_onsite
      ? (resource.per_diem_monthly + resource.accommodation_monthly + resource.local_conveyance_monthly) *
          resource.man_months +
        resource.flight_cost_per_trip * resource.num_trips +
        resource.visa_cost +
        resource.insurance_cost +
        resource.misc_cost
      : 0;
    return baseSalaryCost + logisticsCost;
  };

  const baseCost = resources.reduce((sum, r) => sum + calculateResourceCost(r), 0);
  const overheadCost = baseCost * (overheadPercentage / 100);
  const costWithOverhead = baseCost + overheadCost;
  const profitAmount = costWithOverhead * (profitMarginPercentage / 100);
  const sellingPrice = costWithOverhead + profitAmount;

  const handleSaveProject = async () => {
    if (!projectName) {
      toast.error("Please enter a project name");
      return;
    }

    if (resources.length === 0) {
      toast.error("Please add at least one resource");
      return;
    }

    try {
      await axios.post(`${API}/projects`, {
        name: projectName,
        description: projectDescription,
        overhead_percentage: overheadPercentage,
        profit_margin_percentage: profitMarginPercentage,
      });

      const projectsRes = await axios.get(`${API}/projects`);
      const createdProject = projectsRes.data.find((p) => p.name === projectName);

      if (createdProject) {
        await axios.put(`${API}/projects/${createdProject.id}`, {
          resources: resources.map((r) => ({
            skill_name: r.skill_name,
            technology: r.technology,
            proficiency_level: r.proficiency_level,
            avg_monthly_salary: r.avg_monthly_salary,
            man_months: r.man_months,
            is_onsite: r.is_onsite,
            per_diem_monthly: r.per_diem_monthly,
            accommodation_monthly: r.accommodation_monthly,
            flight_cost_per_trip: r.flight_cost_per_trip,
            num_trips: r.num_trips,
            visa_cost: r.visa_cost,
            insurance_cost: r.insurance_cost,
            local_conveyance_monthly: r.local_conveyance_monthly,
            misc_cost: r.misc_cost,
          })),
        });
      }

      toast.success("Project saved successfully");
      setProjectName("");
      setProjectDescription("");
      setResources([]);
      setOverheadPercentage(20);
      setProfitMarginPercentage(15);
    } catch (error) {
      toast.error("Failed to save project");
    }
  };

  const chartData = [
    { name: "Base Cost", value: baseCost, color: "#0EA5E9" },
    { name: "Overhead", value: overheadCost, color: "#F59E0B" },
    { name: "Profit", value: profitAmount, color: "#10B981" },
  ];

  return (
    <div data-testid="project-estimator">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Project Estimator</h1>
        <p className="text-base text-gray-600 mt-2">Calculate project costs with overhead and profit margins</p>
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
                <Label>Overhead Percentage</Label>
                <span className="font-mono font-semibold text-[#0F172A]" data-testid="overhead-percentage">
                  {overheadPercentage}%
                </span>
              </div>
              <Slider
                value={[overheadPercentage]}
                onValueChange={([value]) => setOverheadPercentage(value)}
                min={0}
                max={50}
                step={1}
                data-testid="overhead-slider"
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
            <CardTitle className="text-xl font-bold text-[#0F172A]">Project Resources</CardTitle>
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
                    <DialogTitle className="text-2xl font-bold text-[#0F172A]">Add Project Resource</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="resource-rate">Skill & Proficiency</Label>
                        <Select value={newResource.rate_id} onValueChange={(value) => setNewResource({ ...newResource, rate_id: value })}>
                          <SelectTrigger id="resource-rate" data-testid="resource-rate-select">
                            <SelectValue placeholder="Select skill" />
                          </SelectTrigger>
                          <SelectContent>
                            {rates.map((rate) => (
                              <SelectItem key={rate.id} value={rate.id}>
                                {rate.skill_name} ({rate.proficiency_level}) - ${rate.avg_monthly_salary}/month
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="man-months">Man-Months</Label>
                        <Input
                          id="man-months"
                          type="number"
                          step="0.1"
                          placeholder="e.g., 3.5"
                          value={newResource.man_months}
                          onChange={(e) => setNewResource({ ...newResource, man_months: e.target.value })}
                          data-testid="man-months-input"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newResource.is_onsite}
                          onCheckedChange={(checked) => setNewResource({ ...newResource, is_onsite: checked })}
                          data-testid="onsite-switch"
                        />
                        <Label className="flex items-center gap-2">
                          <Plane className="w-4 h-4" />
                          Onsite Resource
                        </Label>
                      </div>
                    </div>

                    {newResource.is_onsite && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-[#0F172A] mb-3">Logistics Costs</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="per-diem">Per Diem (Monthly)</Label>
                            <Input
                              id="per-diem"
                              type="number"
                              placeholder="0"
                              value={newResource.per_diem_monthly}
                              onChange={(e) => setNewResource({ ...newResource, per_diem_monthly: e.target.value })}
                              data-testid="per-diem-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="accommodation">Accommodation (Monthly)</Label>
                            <Input
                              id="accommodation"
                              type="number"
                              placeholder="0"
                              value={newResource.accommodation_monthly}
                              onChange={(e) => setNewResource({ ...newResource, accommodation_monthly: e.target.value })}
                              data-testid="accommodation-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="flight-cost">Flight Cost (Per Trip)</Label>
                            <Input
                              id="flight-cost"
                              type="number"
                              placeholder="0"
                              value={newResource.flight_cost_per_trip}
                              onChange={(e) => setNewResource({ ...newResource, flight_cost_per_trip: e.target.value })}
                              data-testid="flight-cost-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="num-trips">Number of Trips</Label>
                            <Input
                              id="num-trips"
                              type="number"
                              placeholder="0"
                              value={newResource.num_trips}
                              onChange={(e) => setNewResource({ ...newResource, num_trips: e.target.value })}
                              data-testid="num-trips-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="visa-cost">Visa Cost</Label>
                            <Input
                              id="visa-cost"
                              type="number"
                              placeholder="0"
                              value={newResource.visa_cost}
                              onChange={(e) => setNewResource({ ...newResource, visa_cost: e.target.value })}
                              data-testid="visa-cost-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="insurance-cost">Insurance Cost</Label>
                            <Input
                              id="insurance-cost"
                              type="number"
                              placeholder="0"
                              value={newResource.insurance_cost}
                              onChange={(e) => setNewResource({ ...newResource, insurance_cost: e.target.value })}
                              data-testid="insurance-cost-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="local-conveyance">Local Conveyance (Monthly)</Label>
                            <Input
                              id="local-conveyance"
                              type="number"
                              placeholder="0"
                              value={newResource.local_conveyance_monthly}
                              onChange={(e) => setNewResource({ ...newResource, local_conveyance_monthly: e.target.value })}
                              data-testid="local-conveyance-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="misc-cost">Miscellaneous</Label>
                            <Input
                              id="misc-cost"
                              type="number"
                              placeholder="0"
                              value={newResource.misc_cost}
                              onChange={(e) => setNewResource({ ...newResource, misc_cost: e.target.value })}
                              data-testid="misc-cost-input"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <Button onClick={handleAddResource} className="w-full bg-[#0F172A] hover:bg-[#0F172A]/90" data-testid="submit-resource-button">
                      Add Resource
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={handleSaveProject} className="bg-[#10B981] hover:bg-[#10B981]/90 text-white" data-testid="save-project-button">
                <Save className="w-4 h-4 mr-2" />
                Save Project
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No resources added yet. Click "Add Resource" to start.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skill</TableHead>
                    <TableHead>Technology</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Salary/Month</TableHead>
                    <TableHead className="text-right">Man-Months</TableHead>
                    <TableHead className="text-center">Onsite</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((resource) => (
                    <TableRow
                      key={resource.id}
                      className={resource.is_onsite ? "bg-blue-50/50" : ""}
                      data-testid={`resource-row-${resource.id}`}
                    >
                      <TableCell className="font-medium">{resource.skill_name}</TableCell>
                      <TableCell>{resource.technology}</TableCell>
                      <TableCell>{resource.proficiency_level}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        ${resource.avg_monthly_salary.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{resource.man_months}</TableCell>
                      <TableCell className="text-center">
                        {resource.is_onsite && <Plane className="w-4 h-4 inline text-[#0EA5E9]" />}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold">
                        ${calculateResourceCost(resource).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResource(resource.id)}
                          className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                          data-testid={`delete-resource-${resource.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectEstimator;