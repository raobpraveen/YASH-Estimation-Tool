import { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Upload, Download } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SkillsManagement = () => {
  const [skills, setSkills] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", technology_id: "" });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSkills();
    fetchTechnologies();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await axios.get(`${API}/skills`);
      setSkills(response.data);
    } catch (error) {
      toast.error("Failed to fetch skills");
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

  const handleAddSkill = async () => {
    if (!newSkill.name || !newSkill.technology_id) {
      toast.error("Please fill all fields");
      return;
    }

    const selectedTechnology = technologies.find(t => t.id === newSkill.technology_id);
    
    if (!selectedTechnology) {
      toast.error("Invalid technology selected");
      return;
    }

    try {
      await axios.post(`${API}/skills`, {
        name: newSkill.name,
        technology_id: newSkill.technology_id,
        technology_name: selectedTechnology.name,
      });
      toast.success("Skill added successfully");
      setNewSkill({ name: "", technology_id: "" });
      setDialogOpen(false);
      fetchSkills();
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || "Skill already exists");
      } else {
        toast.error("Failed to add skill");
      }
    }
  };

  const handleDeleteSkill = async (id) => {
    try {
      await axios.delete(`${API}/skills/${id}`);
      toast.success("Skill deleted successfully");
      fetchSkills();
    } catch (error) {
      toast.error("Failed to delete skill");
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      ["Technology", "Skill Name"],
      ["SAP S/4HANA", "Finance Consultant"],
      ["SAP S/4HANA", "Technical Architect"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Skills Template");
    XLSX.writeFile(wb, "skills_upload_template.xlsx");
    toast.success("Template downloaded");
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row
      const dataRows = rows.slice(1).filter(row => row.length >= 2 && row[0] && row[1]);
      
      let added = 0;
      let skipped = 0;

      for (const row of dataRows) {
        const technologyName = String(row[0]).trim();
        const skillName = String(row[1]).trim();

        // Find technology by name
        const technology = technologies.find(t => t.name.toLowerCase() === technologyName.toLowerCase());
        if (!technology) {
          skipped++;
          continue;
        }

        // Check if skill already exists
        const exists = skills.some(s => 
          s.name.toLowerCase() === skillName.toLowerCase() && 
          s.technology_id === technology.id
        );
        if (exists) {
          skipped++;
          continue;
        }

        try {
          await axios.post(`${API}/skills`, {
            name: skillName,
            technology_id: technology.id,
            technology_name: technology.name,
          });
          added++;
        } catch {
          skipped++;
        }
      }

      toast.success(`Upload complete: ${added} added, ${skipped} skipped`);
      fetchSkills();
    } catch (error) {
      toast.error("Failed to process Excel file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div data-testid="skills-management">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Skills Management</h1>
          <p className="text-base text-gray-600 mt-2">Manage your technology skills catalog</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white" data-testid="add-skill-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#0F172A]">Add New Skill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="skill-name">Skill Name</Label>
                <Input
                  id="skill-name"
                  placeholder="e.g., React Developer"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  data-testid="skill-name-input"
                />
              </div>
              <div>
                <Label htmlFor="technology">Technology</Label>
                <Select value={newSkill.technology_id} onValueChange={(value) => setNewSkill({ ...newSkill, technology_id: value })}>
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
              <Button onClick={handleAddSkill} className="w-full bg-[#0F172A] hover:bg-[#0F172A]/90" data-testid="submit-skill-button">
                Add Skill
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#0F172A]">Skills List</CardTitle>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No skills added yet. Click "Add Skill" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technology</TableHead>
                  <TableHead>Skill Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map((skill) => (
                  <TableRow key={skill.id} data-testid={`skill-row-${skill.id}`}>
                    <TableCell>{skill.technology_name}</TableCell>
                    <TableCell className="font-medium">{skill.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                        data-testid={`delete-skill-${skill.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillsManagement;