import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PROFICIENCY_LEVELS = ["Junior", "Mid", "Senior", "Lead", "Architect", "Project Management", "Delivery"];

const ProficiencyRates = () => {
  const [rates, setRates] = useState([]);
  const [skills, setSkills] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState({
    skill_id: "",
    proficiency_level: "",
    avg_monthly_salary: "",
  });

  useEffect(() => {
    fetchSkills();
    fetchRates();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await axios.get(`${API}/skills`);
      setSkills(response.data);
    } catch (error) {
      toast.error("Failed to fetch skills");
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

  const handleAddRate = async () => {
    if (!newRate.skill_id || !newRate.proficiency_level || !newRate.avg_monthly_salary) {
      toast.error("Please fill all fields");
      return;
    }

    const selectedSkill = skills.find((s) => s.id === newRate.skill_id);
    if (!selectedSkill) {
      toast.error("Invalid skill selected");
      return;
    }

    try {
      await axios.post(`${API}/proficiency-rates`, {
        skill_id: newRate.skill_id,
        skill_name: selectedSkill.name,
        technology_id: selectedSkill.technology_id,
        technology_name: selectedSkill.technology_name,
        base_location_id: selectedSkill.base_location_id,
        base_location_name: selectedSkill.base_location_name,
        proficiency_level: newRate.proficiency_level,
        avg_monthly_salary: parseFloat(newRate.avg_monthly_salary),
      });
      toast.success("Proficiency rate added successfully");
      setNewRate({ skill_id: "", proficiency_level: "", avg_monthly_salary: "" });
      setDialogOpen(false);
      fetchRates();
    } catch (error) {
      toast.error("Failed to add proficiency rate");
    }
  };

  const handleDeleteRate = async (id) => {
    try {
      await axios.delete(`${API}/proficiency-rates/${id}`);
      toast.success("Proficiency rate deleted successfully");
      fetchRates();
    } catch (error) {
      toast.error("Failed to delete proficiency rate");
    }
  };

  return (
    <div data-testid="proficiency-rates">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Proficiency Rates</h1>
          <p className="text-base text-gray-600 mt-2">Configure average monthly salaries for skills</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white" data-testid="add-rate-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Rate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#0F172A]">Add Proficiency Rate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="skill-select">Skill</Label>
                <Select value={newRate.skill_id} onValueChange={(value) => setNewRate({ ...newRate, skill_id: value })}>
                  <SelectTrigger id="skill-select" data-testid="skill-select">
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name} ({skill.technology_name}) - {skill.base_location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="proficiency-select">Proficiency Level</Label>
                <Select
                  value={newRate.proficiency_level}
                  onValueChange={(value) => setNewRate({ ...newRate, proficiency_level: value })}
                >
                  <SelectTrigger id="proficiency-select" data-testid="proficiency-select">
                    <SelectValue placeholder="Select proficiency" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFICIENCY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salary-input">Avg. Monthly Salary (USD)</Label>
                <Input
                  id="salary-input"
                  type="number"
                  placeholder="e.g., 5000"
                  value={newRate.avg_monthly_salary}
                  onChange={(e) => setNewRate({ ...newRate, avg_monthly_salary: e.target.value })}
                  data-testid="salary-input"
                />
              </div>
              <Button onClick={handleAddRate} className="w-full bg-[#0F172A] hover:bg-[#0F172A]/90" data-testid="submit-rate-button">
                Add Rate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#0F172A]">Configured Rates</CardTitle>
        </CardHeader>
        <CardContent>
          {rates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No proficiency rates configured yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skill Name</TableHead>
                    <TableHead>Technology</TableHead>
                    <TableHead>Base Location</TableHead>
                    <TableHead>Proficiency Level</TableHead>
                    <TableHead className="text-right">Avg. Monthly Salary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.id} data-testid={`rate-row-${rate.id}`}>
                      <TableCell className="font-medium">{rate.skill_name}</TableCell>
                      <TableCell>{rate.technology}</TableCell>
                      <TableCell>{rate.base_location_name}</TableCell>
                      <TableCell>{rate.proficiency_level}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        ${rate.avg_monthly_salary.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRate(rate.id)}
                          className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                          data-testid={`delete-rate-${rate.id}`}
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

export default ProficiencyRates;