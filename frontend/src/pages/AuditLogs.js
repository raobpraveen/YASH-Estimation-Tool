import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { 
  History, 
  Filter, 
  RefreshCw, 
  User, 
  Calendar,
  FileText,
  ArrowRight,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  // Filters
  const [filters, setFilters] = useState({
    action: "",
    entity_type: "",
    user_email: "",
    date_from: "",
    date_to: "",
    project_id: ""
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      
      if (filters.action) params.append("action", filters.action);
      if (filters.entity_type) params.append("entity_type", filters.entity_type);
      if (filters.user_email) params.append("user_email", filters.user_email);
      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);
      if (filters.project_id) params.append("project_id", filters.project_id);
      
      const response = await fetch(`${API_URL}/api/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        toast.error("Failed to fetch audit logs");
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Error loading audit logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/audit-logs/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchSummary();
  }, []);

  const handleApplyFilters = () => {
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      action: "",
      entity_type: "",
      user_email: "",
      date_from: "",
      date_to: "",
      project_id: ""
    });
    setTimeout(fetchLogs, 100);
  };

  const toggleRowExpand = (logId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getActionBadge = (action) => {
    const config = {
      created: { color: "bg-green-500/20 text-green-400", label: "Created" },
      updated: { color: "bg-blue-500/20 text-blue-400", label: "Updated" },
      deleted: { color: "bg-red-500/20 text-red-400", label: "Deleted" },
      cloned: { color: "bg-purple-500/20 text-purple-400", label: "Cloned" },
      archived: { color: "bg-gray-500/20 text-gray-400", label: "Archived" },
      unarchived: { color: "bg-teal-500/20 text-teal-400", label: "Unarchived" },
      status_change: { color: "bg-amber-500/20 text-amber-400", label: "Status Change" },
      version_created: { color: "bg-indigo-500/20 text-indigo-400", label: "New Version" },
    };
    return config[action] || { color: "bg-gray-500/20 text-gray-400", label: action };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Audit Logs</h1>
          <p className="text-gray-500">Track all system activity and changes</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="toggle-filters-btn"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button onClick={fetchLogs} data-testid="refresh-logs-btn">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.total_logs.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#0EA5E9]">{summary.recent_activity_count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Top Action</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold capitalize">
                {Object.entries(summary.action_counts || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Most Active User</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold truncate" title={summary.top_users?.[0]?.email}>
                {summary.top_users?.[0]?.email || "-"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label>Action</Label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="updated">Updated</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                    <SelectItem value="cloned">Cloned</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="unarchived">Unarchived</SelectItem>
                    <SelectItem value="status_change">Status Change</SelectItem>
                    <SelectItem value="version_created">Version Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Entity Type</Label>
                <Select
                  value={filters.entity_type}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, entity_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="wave">Wave</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>User Email</Label>
                <Input
                  placeholder="Filter by email"
                  value={filters.user_email}
                  onChange={(e) => setFilters(prev => ({ ...prev, user_email: e.target.value }))}
                />
              </div>
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleApplyFilters} className="flex-1">Apply</Button>
                <Button variant="outline" onClick={handleClearFilters}>Clear</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <History className="w-12 h-12 mb-4 text-gray-300" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <>
                    <TableRow key={log.id} className="cursor-pointer hover:bg-gray-50" onClick={() => toggleRowExpand(log.id)}>
                      <TableCell>
                        {(log.changes?.length > 0 || log.metadata) && (
                          expandedRows.has(log.id) ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(log.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center">
                            <User className="w-3 h-3 text-cyan-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{log.user_name}</p>
                            <p className="text-xs text-gray-500">{log.user_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadge(log.action).color}>
                          {getActionBadge(log.action).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="capitalize">{log.entity_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.project_number && (
                          <div>
                            <p className="font-mono text-sm">{log.project_number}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]" title={log.project_name}>
                              {log.project_name}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                        {log.entity_name}
                      </TableCell>
                    </TableRow>
                    {/* Expanded row for changes */}
                    {expandedRows.has(log.id) && (log.changes?.length > 0 || log.metadata) && (
                      <TableRow key={`${log.id}-details`} className="bg-gray-50">
                        <TableCell colSpan={7}>
                          <div className="p-4 space-y-3">
                            {log.changes?.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Changes:</p>
                                <div className="space-y-1">
                                  {log.changes.map((change, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm">
                                      <span className="font-medium text-gray-600 capitalize">{change.field}:</span>
                                      <span className="text-red-500 line-through">{change.old_value || "(empty)"}</span>
                                      <ArrowRight className="w-4 h-4 text-gray-400" />
                                      <span className="text-green-600">{change.new_value || "(empty)"}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Additional Info:</p>
                                <div className="bg-white rounded p-2 border">
                                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;
