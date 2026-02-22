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

const SkillsManagement = () => {
  const [skills, setSkills] = useState([]);
  const [locations, setLocations] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", technology: "", base_location_id: "" });

  useEffect(() => {
    fetchSkills();
    fetchLocations();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await axios.get(`${API}/skills`);
      setSkills(response.data);
    } catch (error) {
      toast.error("Failed to fetch skills");
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

  const handleAddSkill = async () => {
    if (!newSkill.name || !newSkill.technology || !newSkill.base_location_id) {
      toast.error("Please fill all fields");
      return;
    }

    const selectedLocation = locations.find(l => l.id === newSkill.base_location_id);
    if (!selectedLocation) {
      toast.error("Invalid location selected");
      return;
    }

    try {
      await axios.post(`${API}/skills`, {
        name: newSkill.name,
        technology: newSkill.technology,
        base_location_id: newSkill.base_location_id,
        base_location_name: selectedLocation.name,
      });
      toast.success("Skill added successfully");
      setNewSkill({ name: "", technology: "", base_location_id: "" });
      setDialogOpen(false);
      fetchSkills();
    } catch (error) {
      toast.error("Failed to add skill");
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
                <Input
                  id="technology"
                  placeholder="e.g., Frontend, Backend, DevOps"
                  value={newSkill.technology}
                  onChange={(e) => setNewSkill({ ...newSkill, technology: e.target.value })}
                  data-testid="technology-input"
                />
              </div>
              <div>
                <Label htmlFor="base-location">Base Location</Label>
                <Select value={newSkill.base_location_id} onValueChange={(value) => setNewSkill({ ...newSkill, base_location_id: value })}>
                  <SelectTrigger id="base-location" data-testid="base-location-select">
                    <SelectValue placeholder="Select base location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} (Overhead: {location.overhead_percentage}%)
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
                  <TableHead>Skill Name</TableHead>
                  <TableHead>Technology</TableHead>
                  <TableHead>Base Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map((skill) => (
                  <TableRow key={skill.id} data-testid={`skill-row-${skill.id}`}>
                    <TableCell className="font-medium">{skill.name}</TableCell>
                    <TableCell>{skill.technology}</TableCell>
                    <TableCell>{skill.base_location_name}</TableCell>
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