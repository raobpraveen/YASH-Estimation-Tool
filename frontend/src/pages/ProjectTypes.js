import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProjectTypes = () => {
  const [projectTypes, setProjectTypes] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState({ name: "" });

  useEffect(() => {
    fetchProjectTypes();
  }, []);

  const fetchProjectTypes = async () => {
    try {
      const response = await axios.get(`${API}/project-types`);
      setProjectTypes(response.data);
    } catch (error) {
      toast.error("Failed to fetch project types");
    }
  };

  const handleAddType = async () => {
    if (!newType.name) {
      toast.error("Please enter project type name");
      return;
    }

    try {
      await axios.post(`${API}/project-types`, newType);
      toast.success("Project type added successfully");
      setNewType({ name: "" });
      setDialogOpen(false);
      fetchProjectTypes();
    } catch (error) {
      toast.error("Failed to add project type");
    }
  };

  const handleDeleteType = async (id) => {
    try {
      await axios.delete(`${API}/project-types/${id}`);
      toast.success("Project type deleted successfully");
      fetchProjectTypes();
    } catch (error) {
      toast.error("Failed to delete project type");
    }
  };

  return (
    <div data-testid="project-types">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Project Types</h1>
          <p className="text-base text-gray-600 mt-2">Manage project type categories</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white" data-testid="add-type-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#0F172A]">Add Project Type</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="type-name">Project Type Name</Label>
                <Input
                  id="type-name"
                  placeholder="e.g., Staffing, AMS, Implementation"
                  value={newType.name}
                  onChange={(e) => setNewType({ name: e.target.value })}
                  data-testid="type-name-input"
                />
              </div>
              <Button onClick={handleAddType} className="w-full bg-[#0F172A] hover:bg-[#0F172A]/90" data-testid="submit-type-button">
                Add Project Type
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#0F172A]">Project Types List</CardTitle>
        </CardHeader>
        <CardContent>
          {projectTypes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No project types added yet. Click "Add Type" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectTypes.map((type) => (
                  <TableRow key={type.id} data-testid={`type-row-${type.id}`}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteType(type.id)}
                        className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                        data-testid={`delete-type-${type.id}`}
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

export default ProjectTypes;