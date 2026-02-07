import { useQuery } from "@tanstack/react-query";
import { mockDb, getPortfolioSummary, calculateCAGR, calculateXIRR } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Badge } from "@/components/ui/badge";

export default function ClientReportPage({ id }: { id: string }) {
  const { data: client, isLoading } = useQuery({ 
    queryKey: ['client', id], 
    queryFn: () => mockDb.getClient(id) 
  });

  const { data: folios = [] } = useQuery({
    queryKey: ['folios', id],
    queryFn: () => mockDb.getFolios(id)
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['holdings', id],
    queryFn: () => mockDb.getHoldings(id)
  });

  const { data: tasks = [] } = useQuery({ 
    queryKey: ['tasks'], 
    queryFn: () => mockDb.getTasks() 
  });

  const clientTasks = tasks.filter(t => t.clientId === id && t.status !== "Completed");

  if (isLoading) return <div className="p-8 text-center">Loading report...</div>;
  if (!client) return <div className="p-8 text-center">Client not found.</div>;

  const summary = getPortfolioSummary(holdings);
  const earliestDate = holdings.length > 0 ? holdings.reduce((min, h) => h.purchaseDate < min ? h.purchaseDate : min, holdings[0].purchaseDate) : new Date().toISOString();
  const portfolioXIRR = calculateXIRR(summary.totalInvested, summary.totalCurrent, differenceInDays(new Date(), new Date(earliestDate)));
  const portfolioCAGR = calculateCAGR(summary.totalInvested, summary.totalCurrent, differenceInDays(new Date(), new Date(earliestDate)) / 365.25);


  const handleDownloadPDF = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;
    
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`DS_Partners_Report_${client.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[210mm] mx-auto space-y-6">
        {/* Actions Bar (No Print) */}
        <div className="flex justify-between items-center print:hidden">
           <Button variant="outline" onClick={() => window.print()}>
             <Printer className="w-4 h-4 mr-2" />
             Print
           </Button>
           <Button onClick={handleDownloadPDF}>
             <Download className="w-4 h-4 mr-2" />
             Download PDF
           </Button>
        </div>

        {/* Report Content */}
        <div id="report-content" className="bg-white p-8 shadow-sm border min-h-[297mm]">
           {/* Header */}
           <div className="flex justify-between items-start border-b pb-6 mb-6">
             <div>
               <h1 className="text-3xl font-bold text-gray-900">Portfolio Report</h1>
               <p className="text-gray-500 mt-1">Generated on {format(new Date(), "PPP")}</p>
             </div>
             <div className="text-right">
               <h2 className="text-xl font-bold text-primary">DS Partners</h2>
               <p className="text-sm text-gray-500">Wealth Management</p>
             </div>
           </div>

           {/* Client Details */}
           <div className="grid grid-cols-2 gap-8 mb-8">
             <div>
               <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Client Details</h3>
               <p className="text-lg font-bold">{client.name}</p>
               <p className="text-gray-600">{client.email}</p>
               <p className="text-gray-600">{client.phone}</p>
               <p className="text-gray-600 mt-1"><span className="font-medium">Segment:</span> {client.segment}</p>
             </div>
             <div className="text-right">
               <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Account Info</h3>
                <p><span className="font-medium">Demat ID:</span> {client.dematId || "N/A"}</p>
                <p><span className="font-medium">Status:</span> {client.status}</p>
                <p><span className="font-medium">Folios:</span> {folios.length}</p>
             </div>
           </div>

           {/* Portfolio Summary */}
           <div className="bg-gray-50 rounded-lg p-6 mb-8 border">
             <h3 className="text-lg font-bold mb-4 border-b pb-2">Portfolio Performance</h3>
             <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                   <p className="text-xs text-gray-500 uppercase">Invested Value</p>
                   <p className="text-xl font-bold">₹{summary.totalInvested.toLocaleString()}</p>
                </div>
                <div>
                   <p className="text-xs text-gray-500 uppercase">Current Value</p>
                   <p className="text-xl font-bold">₹{summary.totalCurrent.toLocaleString()}</p>
                </div>
                 <div>
                   <p className="text-xs text-gray-500 uppercase">Abs. Return</p>
                   <p className={`text-xl font-bold ${summary.totalCurrent >= summary.totalInvested ? 'text-green-600' : 'text-red-600'}`}>
                      {((summary.totalCurrent - summary.totalInvested) / summary.totalInvested * 100).toFixed(2)}%
                   </p>
                </div>
                 <div>
                   <p className="text-xs text-gray-500 uppercase">CAGR / XIRR</p>
                   <p className="text-xl font-bold text-primary">
                       {portfolioCAGR.toFixed(2)}% / <span className="text-sm text-gray-600">{portfolioXIRR.toFixed(2)}%</span>
                   </p>
                </div>
             </div>
           </div>

           {/* Asset Allocation */}
           <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 border-b pb-2">Asset Allocation</h3>
              <Table>
                <TableHeader>
                   <TableRow>
                     <TableHead>Asset Class</TableHead>
                     <TableHead className="text-right">Invested</TableHead>
                     <TableHead className="text-right">Current Value</TableHead>
                     <TableHead className="text-right">Weight</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {Object.entries(summary.byAssetClass).map(([cls, val]) => (
                     <TableRow key={cls}>
                        <TableCell className="font-medium">{cls}</TableCell>
                        <TableCell className="text-right">₹{val.invested.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₹{val.current.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{((val.current / summary.totalCurrent) * 100).toFixed(1)}%</TableCell>
                     </TableRow>
                   ))}
                </TableBody>
              </Table>
           </div>

           {/* Holdings Detail */}
           <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 border-b pb-2">Holdings Detail</h3>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Asset</TableHead>
                          <TableHead>Instrument</TableHead>
                          <TableHead className="text-right">Units</TableHead>
                          <TableHead className="text-right">Avg Cost</TableHead>
                          <TableHead className="text-right">Current Price</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                          <TableHead className="text-right">CAGR</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {holdings.map((h) => {
                          const value = h.units * h.currentPrice;
                          const invested = h.units * h.averageCost;
                          const cagr = calculateCAGR(invested, value, differenceInDays(new Date(), new Date(h.purchaseDate)) / 365.25);
                          return (
                              <TableRow key={h.id}>
                                  <TableCell className="text-xs">{h.assetClass}</TableCell>
                                  <TableCell className="font-medium">
                                      {h.name}
                                      <div className="text-xs text-gray-500">{format(new Date(h.purchaseDate), "MMM d, yyyy")}</div>
                                  </TableCell>
                                  <TableCell className="text-right">{h.units}</TableCell>
                                  <TableCell className="text-right">₹{h.averageCost.toLocaleString()}</TableCell>
                                  <TableCell className="text-right">₹{h.currentPrice.toLocaleString()}</TableCell>
                                  <TableCell className="text-right font-medium">₹{value.toLocaleString()}</TableCell>
                                  <TableCell className={`text-right ${cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>{cagr.toFixed(2)}%</TableCell>
                              </TableRow>
                          );
                      })}
                  </TableBody>
              </Table>
           </div>

           {/* Folios */}
           <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 border-b pb-2">Registered Folios</h3>
              <div className="grid grid-cols-2 gap-4">
                 {folios.map(f => (
                     <div key={f.id} className="border p-3 rounded bg-gray-50">
                         <p className="font-bold text-sm">{f.provider}</p>
                         <p className="font-mono text-xs text-gray-600">{f.folioNumber}</p>
                         {f.notes && <p className="text-xs text-gray-500 mt-1 italic">{f.notes}</p>}
                     </div>
                 ))}
                 {folios.length === 0 && <p className="text-gray-500 italic">No folios registered.</p>}
              </div>
           </div>

            {/* Pending Actions */}
            {clientTasks.length > 0 && (
                <div className="mb-8 print:hidden">
                    <h3 className="text-lg font-bold mb-4 border-b pb-2 text-orange-600">Pending Actions</h3>
                    <ul className="list-disc list-inside space-y-1">
                        {clientTasks.map(t => (
                            <li key={t.id} className="text-sm">
                                <span className="font-medium">{t.title}</span> - Due {format(new Date(t.dueDate), "MMM d")}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

           {/* Footer */}
           <div className="mt-12 pt-6 border-t text-center text-xs text-gray-400">
               <p>DS Partners Wealth Management • Confidential Client Report</p>
           </div>
        </div>
      </div>
    </div>
  );
}
