import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockDb, Client, ClientStatus, CLIENT_SEGMENTS, ClientSegment } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Download, Upload, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function ClientsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: clients = [], isLoading } = useQuery({ 
    queryKey: ['clients'], 
    queryFn: () => mockDb.getClients() 
  });

  const addClientMutation = useMutation({
    mutationFn: async (newClient: any) => {
      return mockDb.addClient(newClient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsAddOpen(false);
      toast({ title: "Success", description: "Client added successfully." });
    }
  });

  const archiveClientMutation = useMutation({
    mutationFn: async (id: string) => {
      mockDb.updateClient(id, { status: "Inactive" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: "Archived", description: "Client marked as inactive." });
    }
  });

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(search.toLowerCase()) || 
                            client.company.toLowerCase().includes(search.toLowerCase()) ||
                            client.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Company", "Email", "Phone", "Status", "Segment", "Demat ID", "Owner", "Last Contact"];
    const rows = filteredClients.map(c => [
      c.id, c.name, c.company, c.email, c.phone, c.status, `"${c.segment}"`, c.dematId || "", c.owner, c.lastContact
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ds_partners_clients.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Very basic CSV parsing for demo
      // Assuming headers: Name,Company,Email,Phone,Status,Segment,Demat ID
      const lines = text.split("\n").slice(1); // skip header
      lines.forEach(line => {
        // Simple regex to handle quoted CSV fields (like Segment which has commas)
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!matches) return;
        
        // Cleanup quotes
        const values = matches.map(val => val.replace(/^"|"$/g, '').trim());
        
        // Mapping based on assumed CSV structure for demo purposes
        // Ideally we'd map by header name
        if (values.length >= 3) {
             mockDb.addClient({
                name: values[0] || "Unknown",
                company: values[1] || "",
                email: values[2] || "",
                phone: values[3] || "",
                address: "",
                tags: [],
                status: (values[4] as ClientStatus) || "Lead",
                segment: (values[5] as ClientSegment) || "Business owner",
                dematId: values[6] || "",
                owner: user?.name || "admin",
                notes: "Imported from CSV"
            });
        }
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: "Import Complete", description: "Clients imported from CSV." });
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-2">Manage your client relationships and details.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <div className="relative">
            <input 
              type="file" 
              accept=".csv" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleImportCSV}
            />
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Enter the details of the new client.
                </DialogDescription>
              </DialogHeader>
              <AddClientForm onSubmit={(data: any) => addClientMutation.mutate(data)} onCancel={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Lead">Lead</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Churned">Churned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Segment</TableHead>
              <TableHead className="hidden lg:table-cell">Last Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No clients found.</TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link href={`/clients/${client.id}`} className="font-medium hover:underline text-foreground">
                        {client.name}
                      </Link>
                      <span className="text-xs text-muted-foreground md:hidden">{client.company}</span>
                      <span className="text-xs text-muted-foreground">{client.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{client.company}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <StatusBadge status={client.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs">{client.segment}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {format(new Date(client.lastContact), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/${client.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          /* In a real app, this would open edit dialog */
                          toast({ title: "Edit", description: "Edit functionality available in Details page." });
                        }}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => archiveClientMutation.mutate(client.id)}>
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-green-100 text-green-700 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400",
    Lead: "bg-blue-100 text-blue-700 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400",
    Inactive: "bg-gray-100 text-gray-700 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-400",
    Churned: "bg-red-100 text-red-700 hover:bg-red-100/80 dark:bg-red-900/30 dark:text-red-400",
  };
  
  return (
    <Badge variant="outline" className={`border-0 ${styles[status] || styles.Inactive}`}>
      {status}
    </Badge>
  );
}

function AddClientForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "Lead",
    segment: CLIENT_SEGMENTS[0] as string,
    dematId: "",
    owner: "admin"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      address: "Unknown",
      tags: [],
      notes: "New client",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="segment">Segment</Label>
        <Select value={formData.segment} onValueChange={v => setFormData({...formData, segment: v})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLIENT_SEGMENTS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
         <Label htmlFor="dematId">Demat ID</Label>
         <Input id="dematId" value={formData.dematId} onChange={e => setFormData({...formData, dematId: e.target.value})} placeholder="Optional single Demat ID" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Lead">Lead</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Client</Button>
      </DialogFooter>
    </form>
  );
}
