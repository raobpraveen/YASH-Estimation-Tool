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

const Technologies = () => {
  const [technologies, setTechnologies] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTechnology, setNewTechnology] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchTechnologies();
  }, []);

  const fetchTechnologies = async () => {
    try {
      const response = await axios.get(`${API}/technologies`);
      setTechnologies(response.data);
    } catch (error) {
      toast.error("Failed to fetch technologies");
    }
  };

  const handleAddTechnology = async () => {
    if (!newTechnology.name) {
      toast.error("Please enter technology name");
      return;
    }

    try {
      await axios.post(`${API}/technologies`, newTechnology);
      toast.success("Technology added successfully");
      setNewTechnology({ name: "", description: "" });
      setDialogOpen(false);
      fetchTechnologies();
    } catch (error) {
      toast.error("Failed to add technology");
    }
  };

  const handleDeleteTechnology = async (id) => {
    try {
      await axios.delete(`${API}/technologies/${id}`);
      toast.success("Technology deleted successfully");
      fetchTechnologies();
    } catch (error) {
      toast.error("Failed to delete technology");
    }
  };

  return (
    <div data-testid="technologies">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Technologies</h1>
          <p className="text-base text-gray-600 mt-2">Manage technology master list</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white" data-testid="add-technology-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Technology
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#0F172A]">Add Technology</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="tech-name">Technology Name</Label>
                <Input
                  id="tech-name"
                  placeholder="e.g., Java, React, SAP"
                  value={newTechnology.name}
                  onChange={(e) => setNewTechnology({ ...newTechnology, name: e.target.value })}
                  data-testid="tech-name-input"
                />
              </div>
              <div>
                <Label htmlFor="tech-description">Description (Optional)</Label>
                <Input
                  id="tech-description"
                  placeholder="Brief description"
                  value={newTechnology.description}
                  onChange={(e) => setNewTechnology({ ...newTechnology, description: e.target.value })}
                  data-testid="tech-description-input"
                />
              </div>
              <Button onClick={handleAddTechnology} className="w-full bg-[#0F172A] hover:bg-[#0F172A]/90" data-testid="submit-technology-button">
                Add Technology
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#0F172A]">Technologies List</CardTitle>
        </CardHeader>
        <CardContent>
          {technologies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No technologies added yet. Click "Add Technology" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technology Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technologies.map((tech) => (
                  <TableRow key={tech.id} data-testid={`tech-row-${tech.id}`}>
                    <TableCell className="font-medium">{tech.name}</TableCell>
                    <TableCell>{tech.description || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTechnology(tech.id)}
                        className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                        data-testid={`delete-tech-${tech.id}`}
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

export default Technologies;