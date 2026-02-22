import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, GitCompare } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CompareVersions = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [leftVersion, setLeftVersion] = useState(null);
  const [rightVersion, setRightVersion] = useState(null);
  const [leftVersionId, setLeftVersionId] = useState("");
  const [rightVersionId, setRightVersionId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchVersions();
    }
  }, [projectId]);

  const fetchVersions = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}/versions`);
      const vers = response.data;
      setVersions(vers);
      
      // Auto-select latest two versions for comparison
      if (vers.length >= 2) {
        setLeftVersionId(vers[1].id); // Previous version
        setRightVersionId(vers[0].id); // Latest version
        setLeftVersion(vers[1]);
        setRightVersion(vers[0]);
      } else if (vers.length === 1) {
        setLeftVersionId(vers[0].id);
        setRightVersionId(vers[0].id);
        setLeftVersion(vers[0]);
        setRightVersion(vers[0]);
      }
    } catch (error) {
      toast.error("Failed to load project versions");
    } finally {
      setLoading(false);
    }
  };

  const handleVersionChange = async (side, versionId) => {
    try {
      const response = await axios.get(`${API}/projects/${versionId}`);
      if (side === "left") {
        setLeftVersionId(versionId);
        setLeftVersion(response.data);
      } else {
        setRightVersionId(versionId);
        setRightVersion(response.data);
      }
    } catch (error) {
      toast.error("Failed to load version");
    }
  };

  // Calculate summary for a project version
  const calculateSummary = (project) => {
    if (!project || !project.waves) {
      return { 
        totalMM: 0, onsiteMM: 0, offshoreMM: 0, travelingMM: 0, totalLogistics: 0, sellingPrice: 0, 
        resourceCount: 0, travelingResourceCount: 0, onsiteSalaryCost: 0, offshoreSalaryCost: 0,
        onsiteSellingPrice: 0, offshoreSellingPrice: 0
      };
    }

    const profitMargin = project.profit_margin_percentage || 35;
    let totalMM = 0, onsiteMM = 0, offshoreMM = 0, travelingMM = 0, totalLogistics = 0;
    let totalBaseCost = 0, resourceCount = 0, travelingResourceCount = 0;
    let onsiteSalaryCost = 0, offshoreSalaryCost = 0;

    project.waves.forEach(wave => {
      const config = wave.logistics_config || {
        per_diem_daily: 50, per_diem_days: 30,
        accommodation_daily: 80, accommodation_days: 30,
        local_conveyance_daily: 15, local_conveyance_days: 21,
        flight_cost_per_trip: 450, visa_medical_per_trip: 400,
        num_trips: 6, contingency_percentage: 5,
      };

      let waveTravelingMM = 0, waveTravelingResources = 0;

      (wave.grid_allocations || []).forEach(alloc => {
        const mm = Object.values(alloc.phase_allocations || {}).reduce((s, v) => s + v, 0);
        const salaryCost = alloc.avg_monthly_salary * mm;
        totalMM += mm;
        resourceCount++;

        if (alloc.is_onsite) {
          onsiteMM += mm;
          onsiteSalaryCost += salaryCost;
        } else {
          offshoreMM += mm;
          offshoreSalaryCost += salaryCost;
        }

        // Count traveling resources for logistics
        if (alloc.travel_required) {
          travelingMM += mm;
          waveTravelingMM += mm;
          waveTravelingResources++;
          travelingResourceCount++;
        }

        totalBaseCost += salaryCost;
      });

      // Wave logistics - only for traveling resources
      const perDiem = waveTravelingMM * config.per_diem_daily * config.per_diem_days;
      const accommodation = waveTravelingMM * config.accommodation_daily * config.accommodation_days;
      const conveyance = waveTravelingMM * config.local_conveyance_daily * config.local_conveyance_days;
      const flights = waveTravelingResources * config.flight_cost_per_trip * config.num_trips;
      const visa = waveTravelingResources * config.visa_medical_per_trip * config.num_trips;
      const subtotal = perDiem + accommodation + conveyance + flights + visa;
      const contingency = subtotal * (config.contingency_percentage / 100);
      totalLogistics += subtotal + contingency;
    });

    const baseCostWithLogistics = totalBaseCost + totalLogistics;
    // Assume avg 30% overhead
    const costToCompany = baseCostWithLogistics * 1.3;
    const sellingPrice = costToCompany / (1 - profitMargin / 100);
    
    // Calculate onsite and offshore selling prices
    const onsiteOverheadCost = onsiteSalaryCost * 0.3;
    const offshoreOverheadCost = offshoreSalaryCost * 0.3;
    const onsiteSellingPrice = (onsiteSalaryCost + onsiteOverheadCost + totalLogistics) / (1 - profitMargin / 100);
    const offshoreSellingPrice = (offshoreSalaryCost + offshoreOverheadCost) / (1 - profitMargin / 100);

    return { 
      totalMM, onsiteMM, offshoreMM, travelingMM, totalLogistics, sellingPrice, 
      resourceCount, travelingResourceCount, onsiteSalaryCost, offshoreSalaryCost,
      onsiteSellingPrice, offshoreSellingPrice
    };
  };

  const leftSummary = calculateSummary(leftVersion);
  const rightSummary = calculateSummary(rightVersion);

  // Calculate differences
  const getDiff = (left, right) => {
    const diff = right - left;
    const pct = left !== 0 ? ((diff / left) * 100).toFixed(1) : (right !== 0 ? "100" : "0");
    return { diff, pct, increased: diff > 0, decreased: diff < 0 };
  };

  const mmDiff = getDiff(leftSummary.totalMM, rightSummary.totalMM);
  const onsiteDiff = getDiff(leftSummary.onsiteMM, rightSummary.onsiteMM);
  const offshoreDiff = getDiff(leftSummary.offshoreMM, rightSummary.offshoreMM);
  const travelingDiff = getDiff(leftSummary.travelingMM, rightSummary.travelingMM);
  const logisticsDiff = getDiff(leftSummary.totalLogistics, rightSummary.totalLogistics);
  const priceDiff = getDiff(leftSummary.sellingPrice, rightSummary.sellingPrice);
  const resourceDiff = getDiff(leftSummary.resourceCount, rightSummary.resourceCount);
  const travelingResourceDiff = getDiff(leftSummary.travelingResourceCount, rightSummary.travelingResourceCount);
  const onsiteSellingPriceDiff = getDiff(leftSummary.onsiteSellingPrice, rightSummary.onsiteSellingPrice);
  const offshoreSellingPriceDiff = getDiff(leftSummary.offshoreSellingPrice, rightSummary.offshoreSellingPrice);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading versions...</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/projects")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
        <div className="text-center py-12">
          <p className="text-gray-500">No versions found for this project</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="compare-versions" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/projects")} data-testid="back-button">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A] flex items-center gap-2">
              <GitCompare className="w-8 h-8 text-[#8B5CF6]" />
              Compare Versions
            </h1>
            <p className="text-gray-600">{leftVersion?.project_number || "Project"}</p>
          </div>
        </div>
      </div>

      {/* Version Selectors */}
      <div className="grid grid-cols-2 gap-8">
        <Card className="border-2 border-[#0EA5E9]">
          <CardHeader className="bg-[#E0F2FE] pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Version A (Baseline)</span>
              <Select value={leftVersionId} onValueChange={(v) => handleVersionChange("left", v)}>
                <SelectTrigger className="w-32" data-testid="left-version-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(v => (
                    <SelectItem key={v.id} value={v.id}>v{v.version}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {leftVersion && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Project Name</span>
                  <span className="font-semibold">{leftVersion.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-semibold">{leftVersion.customer_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profit Margin</span>
                  <span className="font-semibold">{leftVersion.profit_margin_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Waves</span>
                  <span className="font-semibold">{leftVersion.waves?.length || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-[#10B981]">
          <CardHeader className="bg-green-50 pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Version B (Compare)</span>
              <Select value={rightVersionId} onValueChange={(v) => handleVersionChange("right", v)}>
                <SelectTrigger className="w-32" data-testid="right-version-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(v => (
                    <SelectItem key={v.id} value={v.id}>v{v.version}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {rightVersion && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Project Name</span>
                  <span className="font-semibold">{rightVersion.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-semibold">{rightVersion.customer_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profit Margin</span>
                  <span className="font-semibold">{rightVersion.profit_margin_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Waves</span>
                  <span className="font-semibold">{rightVersion.waves?.length || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Side-by-Side Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b-2">
                <th className="text-left py-3 px-4">Metric</th>
                <th className="text-right py-3 px-4 bg-[#E0F2FE]">v{leftVersion?.version || "?"}</th>
                <th className="text-right py-3 px-4 bg-green-50">v{rightVersion?.version || "?"}</th>
                <th className="text-right py-3 px-4">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">Total Man-Months</td>
                <td className="py-3 px-4 text-right font-mono">{leftSummary.totalMM.toFixed(1)}</td>
                <td className="py-3 px-4 text-right font-mono">{rightSummary.totalMM.toFixed(1)}</td>
                <td className="py-3 px-4 text-right">
                  <DiffBadge diff={mmDiff} suffix=" MM" />
                </td>
              </tr>
              <tr className="border-b bg-amber-50/30">
                <td className="py-3 px-4 font-medium text-[#F59E0B]">Onsite MM</td>
                <td className="py-3 px-4 text-right font-mono">{leftSummary.onsiteMM.toFixed(1)}</td>
                <td className="py-3 px-4 text-right font-mono">{rightSummary.onsiteMM.toFixed(1)}</td>
                <td className="py-3 px-4 text-right">
                  <DiffBadge diff={onsiteDiff} suffix=" MM" />
                </td>
              </tr>
              <tr className="border-b bg-blue-50/30">
                <td className="py-3 px-4 font-medium text-[#0EA5E9]">Offshore MM</td>
                <td className="py-3 px-4 text-right font-mono">{leftSummary.offshoreMM.toFixed(1)}</td>
                <td className="py-3 px-4 text-right font-mono">{rightSummary.offshoreMM.toFixed(1)}</td>
                <td className="py-3 px-4 text-right">
                  <DiffBadge diff={offshoreDiff} suffix=" MM" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">Total Resources</td>
                <td className="py-3 px-4 text-right font-mono">{leftSummary.resourceCount}</td>
                <td className="py-3 px-4 text-right font-mono">{rightSummary.resourceCount}</td>
                <td className="py-3 px-4 text-right">
                  <DiffBadge diff={resourceDiff} suffix="" />
                </td>
              </tr>
              <tr className="border-b bg-purple-50/30">
                <td className="py-3 px-4 font-medium text-purple-600">Traveling Resources</td>
                <td className="py-3 px-4 text-right font-mono">{leftSummary.travelingResourceCount} ({leftSummary.travelingMM.toFixed(1)} MM)</td>
                <td className="py-3 px-4 text-right font-mono">{rightSummary.travelingResourceCount} ({rightSummary.travelingMM.toFixed(1)} MM)</td>
                <td className="py-3 px-4 text-right">
                  <DiffBadge diff={travelingResourceDiff} suffix=" res" />
                </td>
              </tr>
              <tr className="border-b bg-purple-50/30">
                <td className="py-3 px-4 font-medium">Total Logistics</td>
                <td className="py-3 px-4 text-right font-mono">${leftSummary.totalLogistics.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="py-3 px-4 text-right font-mono">${rightSummary.totalLogistics.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="py-3 px-4 text-right">
                  <DiffBadge diff={logisticsDiff} prefix="$" isCurrency />
                </td>
              </tr>
              <tr className="border-b-2 bg-green-50">
                <td className="py-4 px-4 font-bold text-lg">Selling Price</td>
                <td className="py-4 px-4 text-right font-mono font-bold text-xl">${leftSummary.sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="py-4 px-4 text-right font-mono font-bold text-xl text-[#10B981]">${rightSummary.sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="py-4 px-4 text-right">
                  <DiffBadge diff={priceDiff} prefix="$" isCurrency large />
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Wave Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Wave Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 text-[#0EA5E9]">v{leftVersion?.version} Waves</h3>
              {leftVersion?.waves?.length > 0 ? (
                <div className="space-y-2">
                  {leftVersion.waves.map((wave, i) => (
                    <div key={i} className="p-2 bg-[#E0F2FE] rounded text-sm">
                      <span className="font-medium">{wave.name}</span>
                      <span className="text-gray-600 ml-2">{wave.duration_months}m, {wave.grid_allocations?.length || 0} resources</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No waves</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-[#10B981]">v{rightVersion?.version} Waves</h3>
              {rightVersion?.waves?.length > 0 ? (
                <div className="space-y-2">
                  {rightVersion.waves.map((wave, i) => (
                    <div key={i} className="p-2 bg-green-50 rounded text-sm">
                      <span className="font-medium">{wave.name}</span>
                      <span className="text-gray-600 ml-2">{wave.duration_months}m, {wave.grid_allocations?.length || 0} resources</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No waves</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Component for showing difference with color coding
const DiffBadge = ({ diff, prefix = "", suffix = "", isCurrency = false, large = false }) => {
  const { diff: diffValue, pct, increased, decreased } = diff;
  
  if (diffValue === 0) {
    return <span className="text-gray-400 text-sm">No change</span>;
  }

  const formattedDiff = isCurrency 
    ? Math.abs(diffValue).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : Math.abs(diffValue).toFixed(1);

  const color = increased ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50";
  const arrow = increased ? "↑" : "↓";
  const sign = increased ? "+" : "-";

  return (
    <Badge className={`${color} ${large ? "text-base px-3 py-1" : "text-xs"}`}>
      {arrow} {sign}{prefix}{formattedDiff}{suffix} ({pct}%)
    </Badge>
  );
};

export default CompareVersions;
