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
import { COUNTRIES, INDUSTRY_VERTICALS } from "@/utils/constants";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    location: "",
    city: "",
    industry_vertical: "",
    sub_industry_vertical: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error("Failed to fetch customers");
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.location) {
      toast.error("Please fill required fields (Name, Location)");
      return;
    }

    const selectedCountry = COUNTRIES.find(c => c.code === newCustomer.location);

    try {
      await axios.post(`${API}/customers`, {
        ...newCustomer,
        location_name: selectedCountry?.name || "",
      });
      toast.success("Customer added successfully");
      setNewCustomer({
        name: "",
        location: "",
        city: "",
        industry_vertical: "",
        sub_industry_vertical: "",
      });
      setDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to add customer");
    }
  };

  const handleDeleteCustomer = async (id) => {
    try {
      await axios.delete(`${API}/customers/${id}`);
      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to delete customer");
    }
  };

  return (
    <div data-testid="customers">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Customers</h1>
          <p className="text-base text-gray-600 mt-2">Manage customer master data</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white" data-testid="add-customer-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#0F172A]">Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-name">Customer Name *</Label>
                  <Input
                    id="customer-name"
                    placeholder="e.g., Acme Corporation"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    data-testid="customer-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-location">Location (Country) *</Label>
                  <Select value={newCustomer.location} onValueChange={(value) => setNewCustomer({ ...newCustomer, location: value })}>
                    <SelectTrigger id="customer-location" data-testid="customer-location-select">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer-city">City</Label>
                  <Input
                    id="customer-city"
                    placeholder="e.g., Dubai"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    data-testid="customer-city-input"
                  />
                </div>
                <div>
                  <Label htmlFor="industry-vertical">Industry Vertical</Label>
                  <Select value={newCustomer.industry_vertical} onValueChange={(value) => setNewCustomer({ ...newCustomer, industry_vertical: value })}>
                    <SelectTrigger id="industry-vertical" data-testid="industry-vertical-select">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_VERTICALS.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="sub-industry">Sub Industry Vertical</Label>
                  <Input
                    id="sub-industry"
                    placeholder="e.g., Investment Banking, Retail Banking"
                    value={newCustomer.sub_industry_vertical}
                    onChange={(e) => setNewCustomer({ ...newCustomer, sub_industry_vertical: e.target.value })}
                    data-testid="sub-industry-input"
                  />
                </div>
              </div>
              <Button onClick={handleAddCustomer} className="w-full bg-[#0F172A] hover:bg-[#0F172A]/90" data-testid="submit-customer-button">
                Add Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#0F172A]">Customers List</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No customers added yet. Click "Add Customer" to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Industry Vertical</TableHead>
                    <TableHead>Sub Industry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`customer-row-${customer.id}`}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.location_name}</TableCell>
                      <TableCell>{customer.city || "—"}</TableCell>
                      <TableCell>{customer.industry_vertical || "—"}</TableCell>
                      <TableCell>{customer.sub_industry_vertical || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                          data-testid={`delete-customer-${customer.id}`}
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

export default Customers;
