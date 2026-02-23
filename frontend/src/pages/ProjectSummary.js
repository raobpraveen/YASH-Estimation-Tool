import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, FileDown, Edit2, Plane, History } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProjectSummary = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchVersions();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}/versions`);
      setVersions(response.data);
    } catch (error) {
      console.error("Failed to fetch versions", error);
    }
  };

  // Calculate individual resource row cost and selling price
  // Selling Price per row = (Salary Cost + Overhead) / (1 - profit margin)
  const calculateAllocationCost = (allocation, profitMargin) => {
    const totalManMonths = Object.values(allocation.phase_allocations || {}).reduce((sum, val) => sum + val, 0);
    const baseSalaryCost = (allocation.avg_monthly_salary || 0) * totalManMonths;
    const overheadCost = baseSalaryCost * ((allocation.overhead_percentage || 0) / 100);
    const totalCost = baseSalaryCost + overheadCost;
    const sellingPrice = totalCost / (1 - (profitMargin / 100));
    
    return { totalManMonths, baseSalaryCost, overheadCost, totalCost, sellingPrice };
  };

  // Calculate wave-level logistics based on travel_required flag
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

    let totalTravelingMM = 0;
    let travelingResourceCount = 0;
    
    (wave.grid_allocations || []).forEach(allocation => {
      const mm = Object.values(allocation.phase_allocations || {}).reduce((sum, val) => sum + val, 0);
      if (allocation.travel_required) {
        totalTravelingMM += mm;
        travelingResourceCount++;
      }
    });

    const perDiemCost = totalTravelingMM * config.per_diem_daily * config.per_diem_days;
    const accommodationCost = totalTravelingMM * config.accommodation_daily * config.accommodation_days;
    const conveyanceCost = totalTravelingMM * config.local_conveyance_daily * config.local_conveyance_days;
    const flightCost = travelingResourceCount * config.flight_cost_per_trip * config.num_trips;
    const visaMedicalCost = travelingResourceCount * config.visa_medical_per_trip * config.num_trips;
    
    const subtotal = perDiemCost + accommodationCost + conveyanceCost + flightCost + visaMedicalCost;
    const contingencyCost = subtotal * (config.contingency_percentage / 100);
    const totalLogistics = subtotal + contingencyCost;

    return { totalTravelingMM, travelingResourceCount, totalLogistics };
  };

  const calculateWaveSummary = (wave, profitMargin) => {
    let totalMM = 0, onsiteMM = 0, offshoreMM = 0;
    let onsiteSalaryCost = 0, offshoreSalaryCost = 0;
    let onsiteSellingPrice = 0, offshoreSellingPrice = 0;
    let totalBaseSalaryCost = 0, totalOverheadCost = 0, totalRowsSellingPrice = 0;

    (wave.grid_allocations || []).forEach(allocation => {
      const { totalManMonths, baseSalaryCost, overheadCost, sellingPrice } = calculateAllocationCost(allocation, profitMargin);
      totalMM += totalManMonths;
      totalBaseSalaryCost += baseSalaryCost;
      totalOverheadCost += overheadCost;
      totalRowsSellingPrice += sellingPrice;

      if (allocation.is_onsite) {
        onsiteMM += totalManMonths;
        onsiteSalaryCost += baseSalaryCost;
        onsiteSellingPrice += sellingPrice;
      } else {
        offshoreMM += totalManMonths;
        offshoreSalaryCost += baseSalaryCost;
        offshoreSellingPrice += sellingPrice;
      }
    });

    // Get wave-level logistics
    const logistics = calculateWaveLogistics(wave);
    
    // Cost to Company = Salary + Overhead only (excludes logistics)
    const costToCompany = totalBaseSalaryCost + totalOverheadCost;
    
    // Resources Price = Sum of all row selling prices
    // Wave Selling Price = Resources Price + Logistics
    const waveSellingPrice = totalRowsSellingPrice + logistics.totalLogistics;
    
    // Nego buffer
    const negoBufferPercentage = wave.nego_buffer_percentage || 0;
    const negoBufferAmount = waveSellingPrice * (negoBufferPercentage / 100);
    const finalPrice = waveSellingPrice + negoBufferAmount;

    return { 
      totalMM, onsiteMM, offshoreMM,
      onsiteSalaryCost, offshoreSalaryCost,
      onsiteSellingPrice, offshoreSellingPrice,
      totalRowsSellingPrice,
      totalLogisticsCost: logistics.totalLogistics,
      totalCostToCompany: costToCompany,
      sellingPrice: waveSellingPrice,
      negoBufferPercentage, negoBufferAmount, finalPrice
    };
  };

  const calculateOverallSummary = () => {
    if (!project?.waves) return { 
      totalMM: 0, onsiteMM: 0, offshoreMM: 0, 
      onsiteSalaryCost: 0, offshoreSalaryCost: 0,
      onsiteSellingPrice: 0, offshoreSellingPrice: 0,
      totalRowsSellingPrice: 0,
      totalLogisticsCost: 0, totalCostToCompany: 0, 
      sellingPrice: 0, negoBuffer: 0, finalPrice: 0
    };
    
    const profitMargin = project.profit_margin_percentage || 35;
    let totalMM = 0, onsiteMM = 0, offshoreMM = 0;
    let onsiteSalaryCost = 0, offshoreSalaryCost = 0;
    let onsiteSellingPrice = 0, offshoreSellingPrice = 0;
    let totalRowsSellingPrice = 0;
    let totalLogisticsCost = 0, totalCostToCompany = 0;
    let totalSellingPrice = 0, totalNegoBuffer = 0, totalFinalPrice = 0;

    project.waves.forEach(wave => {
      const summary = calculateWaveSummary(wave, profitMargin);
      totalMM += summary.totalMM;
      onsiteMM += summary.onsiteMM;
      offshoreMM += summary.offshoreMM;
      onsiteSalaryCost += summary.onsiteSalaryCost;
      offshoreSalaryCost += summary.offshoreSalaryCost;
      onsiteSellingPrice += summary.onsiteSellingPrice;
      offshoreSellingPrice += summary.offshoreSellingPrice;
      totalRowsSellingPrice += summary.totalRowsSellingPrice;
      totalLogisticsCost += summary.totalLogisticsCost;
      totalCostToCompany += summary.totalCostToCompany;
      totalSellingPrice += summary.sellingPrice;
      totalNegoBuffer += summary.negoBufferAmount;
      totalFinalPrice += summary.finalPrice;
    });

    return { 
      totalMM, onsiteMM, offshoreMM,
      onsiteSalaryCost, offshoreSalaryCost,
      onsiteSellingPrice, offshoreSellingPrice,
      totalRowsSellingPrice,
      totalLogisticsCost, totalCostToCompany, 
      sellingPrice: totalSellingPrice,
      negoBuffer: totalNegoBuffer,
      finalPrice: totalFinalPrice
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = () => {
    if (!project || !project.waves) return;

    const wb = XLSX.utils.book_new();
    const profitMargin = project.profit_margin_percentage || 35;
    
    // Summary sheet
    const summaryData = [];
    summaryData.push(["PROJECT ESTIMATE SUMMARY"]);
    summaryData.push([]);
    summaryData.push(["Project Number", project.project_number || "N/A"]);
    summaryData.push(["Version", project.version || 1]);
    summaryData.push(["Customer Name", project.customer_name || ""]);
    summaryData.push(["Project Name", project.name]);
    summaryData.push(["Project Location", project.project_location_name || ""]);
    summaryData.push(["Technology", project.technology_name || ""]);
    summaryData.push(["Project Type", project.project_type_name || ""]);
    summaryData.push(["Description", project.description || ""]);
    summaryData.push(["Profit Margin %", `${profitMargin}%`]);
    summaryData.push([]);

    project.waves.forEach(wave => {
      const summary = calculateWaveSummary(wave, profitMargin);
      summaryData.push([`WAVE: ${wave.name}`, `Duration: ${wave.duration_months} months`]);
      summaryData.push(["Total Man-Months", summary.totalMM.toFixed(2)]);
      summaryData.push(["Onsite Man-Months", summary.onsiteMM.toFixed(2)]);
      summaryData.push(["Offshore Man-Months", summary.offshoreMM.toFixed(2)]);
      summaryData.push(["Logistics Costs", `$${summary.totalLogisticsCost.toFixed(2)}`]);
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
    summaryData.push(["GRAND TOTAL (Selling Price)", `$${overall.sellingPrice.toFixed(2)}`]);

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Detail sheets for each wave
    project.waves.forEach(wave => {
      const waveData = [];
      waveData.push([`${wave.name} - ${wave.duration_months} months`]);
      waveData.push([]);
      
      const header = ["Skill", "Level", "Location", "$/Month", "Onsite", ...(wave.phase_names || []), "Total MM", "Base Cost", "OH Cost", "Selling Price"];
      waveData.push(header);

      (wave.grid_allocations || []).forEach(alloc => {
        const { totalManMonths, baseCost, overheadCost, sellingPrice } = calculateAllocationCost(alloc, profitMargin);
        const row = [
          alloc.skill_name,
          alloc.proficiency_level,
          alloc.base_location_name,
          alloc.avg_monthly_salary,
          alloc.is_onsite ? "ON" : "OFF",
          ...(wave.phase_names || []).map((_, i) => (alloc.phase_allocations || {})[i] || 0),
          totalManMonths.toFixed(2),
          baseCost.toFixed(2),
          overheadCost.toFixed(2),
          sellingPrice.toFixed(2),
        ];
        waveData.push(row);
      });

      const waveWs = XLSX.utils.aoa_to_sheet(waveData);
      XLSX.utils.book_append_sheet(wb, waveWs, wave.name.substring(0, 30));
    });

    XLSX.writeFile(wb, `${project.project_number || project.name}_v${project.version || 1}_Summary.xlsx`);
    toast.success("Exported to Excel");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  const overall = calculateOverallSummary();
  const profitMargin = project.profit_margin_percentage || 35;

  return (
    <div data-testid="project-summary" className="space-y-6">
      {/* Header - Hide in print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/projects")} data-testid="back-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-[#0F172A]">{project.name}</h1>
              <Badge variant="outline" className="font-mono">{project.project_number || "N/A"}</Badge>
              <Badge className="bg-[#0EA5E9]">v{project.version || 1}</Badge>
            </div>
            <p className="text-gray-600">{project.customer_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} data-testid="print-button">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExportToExcel} className="border-[#10B981] text-[#10B981]" data-testid="export-button">
            <FileDown className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate(`/estimator?edit=${project.id}`)} className="bg-[#0EA5E9]" data-testid="edit-button">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Version History - Hide in print */}
      {versions.length > 1 && (
        <Card className="print:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />
              Version History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {versions.map((v) => (
                <Button
                  key={v.id}
                  variant={v.id === project.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => navigate(`/projects/${v.id}/summary`)}
                  className={v.id === project.id ? "bg-[#0F172A]" : ""}
                >
                  v{v.version}
                  {v.is_latest_version && <Badge className="ml-1 text-xs" variant="secondary">Latest</Badge>}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Header - Show only in print */}
      <div className="hidden print:block mb-8">
        <div className="text-center border-b-2 pb-4 mb-4">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-lg text-gray-600">{project.customer_name}</p>
          <p className="font-mono">{project.project_number} | Version {project.version || 1}</p>
        </div>
      </div>

      {/* Project Details */}
      <Card className="border-2 border-[#E2E8F0]">
        <CardHeader className="bg-[#F8FAFC]">
          <CardTitle className="text-xl font-bold">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-semibold text-lg">{project.customer_name || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Location</p>
              <p className="font-semibold text-lg">{project.project_location_name || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Technology</p>
              <p className="font-semibold text-lg">{project.technology_name || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Project Type</p>
              <p className="font-semibold text-lg">{project.project_type_name || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Profit Margin</p>
              <p className="font-semibold text-lg">{profitMargin}%</p>
            </div>
            <div>
              <p className="text-gray-500">Total Waves</p>
              <p className="font-semibold text-lg">{project.waves?.length || 0}</p>
            </div>
            {project.description && (
              <div className="col-span-full">
                <p className="text-gray-500">Description</p>
                <p className="font-semibold">{project.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overall Summary */}
      <Card className="border-4 border-[#10B981]">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="text-2xl font-bold text-[#0F172A]">Project Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Man-Months</p>
              <p className="text-4xl font-bold font-mono">{overall.totalMM.toFixed(1)}</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Onsite MM</p>
              <p className="text-4xl font-bold font-mono text-[#F59E0B]">{overall.onsiteMM.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">${overall.onsiteSalaryCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Offshore MM</p>
              <p className="text-4xl font-bold font-mono text-[#0EA5E9]">{overall.offshoreMM.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">${overall.offshoreSalaryCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Logistics</p>
              <p className="text-4xl font-bold font-mono text-[#8B5CF6]">${overall.totalLogisticsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            <div className="text-center p-4 bg-amber-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Onsite Selling Price</p>
              <p className="text-2xl font-bold font-mono text-[#F59E0B]">${overall.onsiteSellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="text-center p-4 bg-blue-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Offshore Selling Price</p>
              <p className="text-2xl font-bold font-mono text-[#0EA5E9]">${overall.offshoreSellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Cost to Company</p>
              <p className="text-2xl font-bold font-mono">${overall.totalCostToCompany.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="text-center p-4 bg-green-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Profit ({profitMargin}%)</p>
              <p className="text-2xl font-bold font-mono text-[#10B981]">
                ${((overall.onsiteSellingPrice + overall.offshoreSellingPrice) - overall.totalCostToCompany).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="text-center p-6 bg-slate-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Resources Price</p>
              <p className="text-3xl font-bold font-mono text-slate-600">${overall.totalRowsSellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Selling Price</p>
              <p className="text-3xl font-bold font-mono text-[#10B981]">${overall.sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-gray-500">resources + logistics</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg border-2 border-[#10B981]">
              <p className="text-lg text-gray-700 mb-2 font-semibold">FINAL PRICE</p>
              <p className="text-5xl font-extrabold font-mono text-[#10B981]">
                ${overall.finalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              {overall.negoBuffer > 0 && (
                <p className="text-xs text-gray-500 mt-1">incl. nego buffer: ${overall.negoBuffer.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wave Details */}
      {project.waves?.map((wave, waveIndex) => {
        const waveSummary = calculateWaveSummary(wave, profitMargin);
        return (
          <Card key={wave.id || waveIndex} className="border-2 border-[#0EA5E9] page-break-inside-avoid">
            <CardHeader className="bg-[#E0F2FE]">
              <CardTitle className="text-xl font-bold flex items-center justify-between">
                <span>{wave.name}</span>
                <Badge variant="outline" className="font-mono">{wave.duration_months} months</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Wave Summary Row */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-gray-500 text-xs">Total MM</p>
                  <p className="font-bold font-mono text-lg">{waveSummary.totalMM.toFixed(1)}</p>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded">
                  <p className="text-gray-500 text-xs">Onsite MM</p>
                  <p className="font-bold font-mono text-lg text-[#F59E0B]">{waveSummary.onsiteMM.toFixed(1)}</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-gray-500 text-xs">Offshore MM</p>
                  <p className="font-bold font-mono text-lg text-[#0EA5E9]">{waveSummary.offshoreMM.toFixed(1)}</p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <p className="text-gray-500 text-xs">Logistics</p>
                  <p className="font-bold font-mono text-lg">${waveSummary.totalLogisticsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="text-center p-2 bg-gray-100 rounded">
                  <p className="text-gray-500 text-xs">CTC</p>
                  <p className="font-bold font-mono text-lg">${waveSummary.totalCostToCompany.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="text-center p-2 bg-green-100 rounded">
                  <p className="text-gray-500 text-xs">Selling Price</p>
                  <p className="font-bold font-mono text-lg text-[#10B981]">${waveSummary.sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </div>

              {/* Resource Table */}
              {wave.grid_allocations && wave.grid_allocations.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#F1F5F9]">
                        <th className="border p-2 text-left">Skill</th>
                        <th className="border p-2 text-left">Level</th>
                        <th className="border p-2 text-left">Location</th>
                        <th className="border p-2 text-right">$/Month</th>
                        <th className="border p-2 text-center">Onsite</th>
                        {(wave.phase_names || []).map((phase, i) => (
                          <th key={i} className="border p-2 text-center bg-[#E0F2FE]">{phase}</th>
                        ))}
                        <th className="border p-2 text-right">MM</th>
                        <th className="border p-2 text-right">Base</th>
                        <th className="border p-2 text-right">OH</th>
                        <th className="border p-2 text-right font-bold text-[#10B981]">Selling</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wave.grid_allocations.map((alloc, allocIndex) => {
                        const { totalManMonths, baseCost, overheadCost, sellingPrice } = calculateAllocationCost(alloc, profitMargin);
                        return (
                          <tr key={alloc.id || allocIndex} className={alloc.is_onsite ? "bg-amber-50/30" : ""}>
                            <td className="border p-2 font-medium">{alloc.skill_name}</td>
                            <td className="border p-2">{alloc.proficiency_level}</td>
                            <td className="border p-2">{alloc.base_location_name}</td>
                            <td className="border p-2 text-right font-mono">${alloc.avg_monthly_salary?.toLocaleString()}</td>
                            <td className="border p-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${alloc.is_onsite ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                                {alloc.is_onsite ? "ON" : "OFF"}
                              </span>
                            </td>
                            {(wave.phase_names || []).map((_, phaseIdx) => (
                              <td key={phaseIdx} className="border p-2 text-center font-mono">
                                {(alloc.phase_allocations || {})[phaseIdx] || 0}
                              </td>
                            ))}
                            <td className="border p-2 text-right font-mono font-semibold">{totalManMonths.toFixed(1)}</td>
                            <td className="border p-2 text-right font-mono text-gray-600">${baseCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                            <td className="border p-2 text-right font-mono text-gray-600">${overheadCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                            <td className="border p-2 text-right font-mono font-bold text-[#10B981]">${sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Print Footer */}
      <div className="hidden print:block mt-8 pt-4 border-t text-center text-sm text-gray-500">
        <p>Generated on {new Date().toLocaleDateString()} | {project.project_number} v{project.version || 1}</p>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .page-break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default ProjectSummary;
