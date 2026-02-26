import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Plus, Pencil, Trash2, UserCircle } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const SalesManagers = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    is_active: true,
  });

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const response = await axios.get(`${API}/api/sales-managers`);
      setManagers(response.data);
    } catch (error) {
      toast.error("Failed to fetch sales managers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      if (editingManager) {
        await axios.put(`${API}/api/sales-managers/${editingManager.id}`, formData);
        toast.success("Sales Manager updated");
      } else {
        await axios.post(`${API}/api/sales-managers`, formData);
        toast.success("Sales Manager created");
      }
      setDialogOpen(false);
      resetForm();
      fetchManagers();
    } catch (error) {
      toast.error("Failed to save Sales Manager");
    }
  };

  const handleEdit = (manager) => {
    setEditingManager(manager);
    setFormData({
      name: manager.name,
      email: manager.email || "",
      phone: manager.phone || "",
      department: manager.department || "",
      is_active: manager.is_active !== false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Sales Manager?")) return;
    try {
      await axios.delete(`${API}/api/sales-managers/${id}`);
      toast.success("Sales Manager deleted");
      fetchManagers();
    } catch (error) {
      toast.error("Failed to delete Sales Manager");
    }
  };

  const resetForm = () => {
    setEditingManager(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      department: "",
      is_active: true,
    });
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Sales Managers</h1>
          <p className="text-gray-500">Manage sales managers for project assignments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90" data-testid="add-sales-manager-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Sales Manager
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingManager ? "Edit Sales Manager" : "Add Sales Manager"}</DialogTitle>
              <DialogDescription>
                {editingManager ? "Update the sales manager details" : "Add a new sales manager to the system"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                  data-testid="sm-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                  data-testid="sm-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone"
                  data-testid="sm-phone-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Enter department"
                  data-testid="sm-department-input"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#0EA5E9]" data-testid="save-sm-btn">
                  {editingManager ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-[#0EA5E9]" />
            Sales Managers List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0EA5E9]"></div>
            </div>
          ) : managers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sales managers found. Add your first sales manager.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((manager) => (
                  <TableRow key={manager.id}>
                    <TableCell className="font-medium">{manager.name}</TableCell>
                    <TableCell>{manager.email || "-"}</TableCell>
                    <TableCell>{manager.phone || "-"}</TableCell>
                    <TableCell>{manager.department || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        manager.is_active !== false
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {manager.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(manager)}
                        data-testid={`edit-sm-${manager.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(manager.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`delete-sm-${manager.id}`}
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

export default SalesManagers;
