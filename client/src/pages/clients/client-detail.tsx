import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockDb, Client, Note, ASSET_CLASSES, AssetClass, calculateCAGR, getPortfolioSummary, calculateXIRR } from "@/lib/mock-data";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Edit, Send, Plus, Trash2, TrendingUp, Wallet, RefreshCw, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ClientDetailPage({ id }: { id: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  const { data: client, isLoading } = useQuery({ 
    queryKey: ['client', id], 
    queryFn: () => mockDb.getClient(id) 
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', id],
    queryFn: () => mockDb.getNotes(id)
  });

  const { data: folios = [] } = useQuery({
    queryKey: ['folios', id],
    queryFn: () => mockDb.getFolios(id)
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['holdings', id],
    queryFn: () => mockDb.getHoldings(id)
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      mockDb.addNote({
        clientId: id,
        content: newNote,
        createdBy: user?.name || "Unknown"
      });
      mockDb.updateClient(id, { lastContact: new Date().toISOString() });
    },
    onSuccess: () => {
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      toast({ title: "Note Added", description: "Client timeline updated." });
    }
  });

  const addFolioMutation = useMutation({
    mutationFn: async (data: any) => mockDb.addFolio({ ...data, clientId: id }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['folios', id] });
        toast({ title: "Folio Added" });
    }
  });

  const deleteFolioMutation = useMutation({
    mutationFn: async (folioId: string) => mockDb.deleteFolio(folioId),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['folios', id] });
        toast({ title: "Folio Deleted" });
    }
  });

  const addHoldingMutation = useMutation({
    mutationFn: async (data: any) => mockDb.addHolding({ ...data, clientId: id }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['holdings', id] });
        toast({ title: "Holding Added" });
    }
  });

  const updateHoldingMutation = useMutation({
      mutationFn: async ({ id, updates }: { id: string, updates: any }) => mockDb.updateHolding(id, updates),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['holdings', id] });
          toast({ title: "Holding Updated", description: "NAV/Price updated successfully." });
      }
  });

  const deleteHoldingMutation = useMutation({
    mutationFn: async (holdingId: string) => mockDb.deleteHolding(holdingId),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['holdings', id] });
        toast({ title: "Holding Deleted" });
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading client details...</div>;
  if (!client) return <div className="p-8 text-center">Client not found.</div>;

  const portfolioSummary = getPortfolioSummary(holdings);
  const earliestDate = holdings.length > 0 ? holdings.reduce((min, h) => h.purchaseDate < min ? h.purchaseDate : min, holdings[0].purchaseDate) : new Date().toISOString();
  const portfolioXIRR = calculateXIRR(portfolioSummary.totalInvested, portfolioSummary.totalCurrent, differenceInDays(new Date(), new Date(earliestDate)));
  const portfolioCAGR = calculateCAGR(portfolioSummary.totalInvested, portfolioSummary.totalCurrent, differenceInDays(new Date(), new Date(earliestDate)) / 365.25);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
            <Link href="/clients">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            </Link>
            <div>
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
                {client.company} • {client.segment}
            </p>
            </div>
        </div>
        <div className="flex gap-2">
           <Link href={`/clients/${id}/report`}>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
           </Link>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>Contact Info</CardTitle>
                <Badge variant={client.status === "Active" ? "default" : "secondary"}>
                  {client.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{client.address}</span>
              </div>
              <Separator />
               <div className="space-y-1">
                <p className="text-sm font-medium">Demat ID</p>
                <p className="text-sm font-mono bg-muted p-1 rounded inline-block">{client.dematId || "Not set"}</p>
              </div>
               <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium">Owner</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{client.owner.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground capitalize">{client.owner}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Last Contact</p>
                <p className="text-sm text-muted-foreground">{format(new Date(client.lastContact), "PPP")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Folios</CardTitle>
              <CardDescription>Mutual Fund Folios & Accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {folios.map(f => (
                     <div key={f.id} className="flex justify-between items-start p-3 border rounded-md bg-background/50">
                         <div>
                             <p className="text-sm font-semibold">{f.provider}</p>
                             <p className="text-xs font-mono text-muted-foreground mt-0.5">{f.folioNumber}</p>
                             {f.notes && <p className="text-xs text-muted-foreground mt-1 italic">{f.notes}</p>}
                         </div>
                         <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive -mr-2" onClick={() => deleteFolioMutation.mutate(f.id)}>
                             <Trash2 className="w-3 h-3" />
                         </Button>
                     </div>
                 ))}
                 <Dialog>
                     <DialogTrigger asChild>
                         <Button variant="outline" size="sm" className="w-full border-dashed"><Plus className="w-3 h-3 mr-2" /> Add Folio</Button>
                     </DialogTrigger>
                     <DialogContent>
                         <DialogHeader><DialogTitle>Add Folio</DialogTitle></DialogHeader>
                         <AddFolioForm onSubmit={(data: any) => addFolioMutation.mutate(data)} />
                     </DialogContent>
                 </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline & Notes */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="portfolio">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="portfolio">Portfolio & Holdings</TabsTrigger>
              <TabsTrigger value="activity">Activity & Notes</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio" className="space-y-6 mt-6">
                {/* Portfolio Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Invested</CardTitle></CardHeader>
                        <CardContent><div className="text-xl font-bold">₹{portfolioSummary.totalInvested.toLocaleString()}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Current Value</CardTitle></CardHeader>
                        <CardContent><div className="text-xl font-bold">₹{portfolioSummary.totalCurrent.toLocaleString()}</div></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Performance</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex flex-col">
                                <span className={`text-xl font-bold flex items-center ${portfolioCAGR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {portfolioCAGR.toFixed(2)}% <span className="text-xs ml-1 text-muted-foreground font-normal">CAGR</span>
                                </span>
                                <span className="text-xs text-muted-foreground mt-0.5">XIRR: {portfolioXIRR.toFixed(2)}%</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Abs. Return</CardTitle></CardHeader>
                        <CardContent>
                            <div className={`text-xl font-bold ${portfolioSummary.totalCurrent >= portfolioSummary.totalInvested ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{(portfolioSummary.totalCurrent - portfolioSummary.totalInvested).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Holdings List */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                             <CardTitle>Holdings</CardTitle>
                             <CardDescription>Stocks, MFs, FDs, Bonds, PMS, AIF</CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Holding</Button>
                            </DialogTrigger>
                             <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader><DialogTitle>Add Holding</DialogTitle></DialogHeader>
                                <AddHoldingForm onSubmit={(data: any) => addHoldingMutation.mutate(data)} />
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Instrument</TableHead>
                                    <TableHead className="text-right">Invested</TableHead>
                                    <TableHead className="text-right">Current Price</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                    <TableHead className="text-right">CAGR</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {holdings.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No holdings added.</TableCell></TableRow>
                                ) : (
                                    holdings.map(h => {
                                        const invested = h.units * h.averageCost;
                                        const current = h.units * h.currentPrice;
                                        const cagr = calculateCAGR(invested, current, differenceInDays(new Date(), new Date(h.purchaseDate)) / 365.25);
                                        return (
                                            <TableRow key={h.id}>
                                                <TableCell><Badge variant="outline">{h.assetClass}</Badge></TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{h.name}</div>
                                                    <div className="text-xs text-muted-foreground">{format(new Date(h.purchaseDate), 'MMM yyyy')} • {h.units} units</div>
                                                </TableCell>
                                                <TableCell className="text-right">₹{invested.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2 group">
                                                        <span>₹{h.currentPrice.toLocaleString()}</span>
                                                        <Dialog>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                         <DialogTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"><RefreshCw className="w-3 h-3 text-primary" /></Button>
                                                                        </DialogTrigger>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Update Price/NAV</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                            <DialogContent>
                                                                <DialogHeader><DialogTitle>Update Price for {h.name}</DialogTitle></DialogHeader>
                                                                <UpdatePriceForm currentPrice={h.currentPrice} onSubmit={(price) => updateHoldingMutation.mutate({ id: h.id, updates: { currentPrice: price } })} />
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">₹{current.toLocaleString()}</TableCell>
                                                <TableCell className={`text-right ${cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>{cagr.toFixed(2)}%</TableCell>
                                                 <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => deleteHoldingMutation.mutate(h.id)}>
                                                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarFallback>{user?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea 
                        placeholder="Log a call, meeting, or note..." 
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => addNoteMutation.mutate()} 
                          disabled={!newNote.trim() || addNoteMutation.isPending}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Post Note
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{note.createdBy.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm capitalize">{note.createdBy}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(note.createdAt), "MMM d, h:mm a")}</span>
                          </div>
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{note.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="relative flex py-5 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-4 text-muted-foreground text-xs">Client Created on {format(new Date(client.createdAt), "PPP")}</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Task management for this client coming soon. Use the main Tasks page for now.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function AddFolioForm({ onSubmit }: { onSubmit: (data: any) => void }) {
    const [data, setData] = useState({ provider: "", folioNumber: "", notes: "" });
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Scheme / Provider *</Label>
                <Input required value={data.provider} onChange={e => setData({...data, provider: e.target.value})} placeholder="e.g. HDFC Mutual Fund" />
            </div>
             <div className="space-y-2">
                <Label>Folio Number *</Label>
                <Input required value={data.folioNumber} onChange={e => setData({...data, folioNumber: e.target.value})} placeholder="e.g. 12345/67" />
            </div>
             <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={data.notes} onChange={e => setData({...data, notes: e.target.value})} />
            </div>
            <Button onClick={() => onSubmit(data)} disabled={!data.provider || !data.folioNumber} className="w-full">Add Folio</Button>
        </div>
    )
}

function AddHoldingForm({ onSubmit }: { onSubmit: (data: any) => void }) {
    const [data, setData] = useState({ 
        assetClass: ASSET_CLASSES[0], 
        name: "", 
        purchaseDate: format(new Date(), 'yyyy-MM-dd'),
        units: "",
        averageCost: "",
        currentPrice: "",
        notes: ""
    });
    
    const handleSubmit = () => {
        onSubmit({
            ...data,
            units: parseFloat(data.units),
            averageCost: parseFloat(data.averageCost),
            currentPrice: parseFloat(data.currentPrice)
        });
    }

    const isValid = data.name && data.purchaseDate && data.units && data.averageCost && data.currentPrice;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Asset Class *</Label>
                    <Select value={data.assetClass} onValueChange={(v: any) => setData({...data, assetClass: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{ASSET_CLASSES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Asset Name *</Label>
                    <Input required value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="e.g. Reliance" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Purchase Date *</Label>
                    <Input required type="date" value={data.purchaseDate} onChange={e => setData({...data, purchaseDate: e.target.value})} />
                </div>
                 <div className="space-y-2">
                    <Label>Units *</Label>
                    <Input required type="number" step="any" value={data.units} onChange={e => setData({...data, units: e.target.value})} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Label className="cursor-help underline decoration-dotted">Avg Cost (Per Unit) *</Label>
                            </TooltipTrigger>
                            <TooltipContent>The average buy price per unit</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Input required type="number" step="any" value={data.averageCost} onChange={e => setData({...data, averageCost: e.target.value})} />
                </div>
                 <div className="space-y-2">
                    <Label>Current Price (Per Unit) *</Label>
                    <Input required type="number" step="any" value={data.currentPrice} onChange={e => setData({...data, currentPrice: e.target.value})} />
                </div>
            </div>
             <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={data.notes} onChange={e => setData({...data, notes: e.target.value})} />
            </div>
            <Button onClick={handleSubmit} disabled={!isValid} className="w-full">Add Holding</Button>
        </div>
    )
}

function UpdatePriceForm({ currentPrice, onSubmit }: { currentPrice: number, onSubmit: (price: number) => void }) {
    const [price, setPrice] = useState(currentPrice.toString());
    
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>New Price / NAV</Label>
                <Input type="number" step="any" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <Button onClick={() => onSubmit(parseFloat(price))} disabled={!price} className="w-full">Update Price</Button>
        </div>
    )
}
