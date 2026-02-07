import { mockDb, getPortfolioSummary, calculateCAGR } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserPlus, TrendingUp, AlertCircle, CheckCircle2, Wallet, PieChart as PieIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatDistanceToNow, differenceInDays } from "date-fns";

export default function DashboardPage() {
  const { data: clients = [] } = useQuery({ 
    queryKey: ['clients'], 
    queryFn: () => mockDb.getClients() 
  });
  
  const { data: tasks = [] } = useQuery({ 
    queryKey: ['tasks'], 
    queryFn: () => mockDb.getTasks() 
  });

  // Calculate Aggregates
  const holdings = mockDb.getAllHoldings();
  const summary = getPortfolioSummary(holdings);
  
  // Calculate AUM by Asset Class for Pie Chart
  const assetData = Object.entries(summary.byAssetClass).map(([name, data]) => ({
      name,
      value: data.current,
      color: name.includes('Stock') ? 'var(--chart-1)' : 
             name.includes('Mutual') ? 'var(--chart-2)' : 
             name.includes('FD') ? 'var(--chart-3)' : 
             'var(--chart-4)'
  }));

  // Top Clients by AUM
  const clientsWithAUM = clients.map(c => {
      const clientHoldings = mockDb.getHoldings(c.id);
      const cSummary = getPortfolioSummary(clientHoldings);
      return { ...c, aum: cSummary.totalCurrent, invested: cSummary.totalInvested };
  }).sort((a, b) => b.aum - a.aum).slice(0, 5);

   // Top Clients by Performance (Abs Return for now as simplified performance metric)
   // Using absolute return %: (Current - Invested) / Invested
  const clientsByPerf = clients.map(c => {
      const clientHoldings = mockDb.getHoldings(c.id);
      const cSummary = getPortfolioSummary(clientHoldings);
      const profit = cSummary.totalCurrent - cSummary.totalInvested;
      const perf = cSummary.totalInvested > 0 ? (profit / cSummary.totalInvested) * 100 : 0;
      return { ...c, perf: perf, aum: cSummary.totalCurrent };
  }).sort((a, b) => b.perf - a.perf).slice(0, 5);

  const activeClients = clients.filter(c => c.status === "Active").length;
  const newLeads = clients.filter(c => c.status === "Lead").length;
  const pendingTasks = tasks.filter(t => t.status === "Pending").length;

  const upcomingTasks = tasks.filter(t => t.status !== "Completed").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your business performance and recent activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total AUM" 
          value={`₹${(summary.totalCurrent / 10000000).toFixed(2)} Cr`}
          icon={Wallet} 
          trend="Across all clients"
          trendUp={true}
        />
        <StatCard 
          title="Total Clients" 
          value={clients.length} 
          icon={Users} 
          trend="+12% from last month"
          trendUp={true}
        />
        <StatCard 
          title="New Leads" 
          value={newLeads} 
          icon={UserPlus} 
          trend="+2 new today"
          trendUp={true}
        />
        <StatCard 
          title="Pending Tasks" 
          value={pendingTasks} 
          icon={AlertCircle} 
          trend="3 due today"
          trendUp={false} // warning color maybe?
          warning={pendingTasks > 5}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Top Clients by AUM</CardTitle>
            <CardDescription>Highest value relationships</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <div className="space-y-4 px-4">
                {clientsWithAUM.map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono text-sm">#{i+1}</span>
                            <div>
                                <p className="font-medium text-sm">{c.name}</p>
                                <p className="text-xs text-muted-foreground">{c.company}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-sm">₹{c.aum.toLocaleString()}</p>
                            <p className="text-xs text-green-600">Invested: ₹{c.invested.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
             </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>AUM Distribution</CardTitle>
            <CardDescription>By Asset Class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || 'var(--primary)'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground mt-4">
              {assetData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || 'var(--primary)' }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
         <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Clients with highest absolute return %</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientsByPerf.map(client => (
                <div key={client.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{client.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">AUM: ₹{client.aum.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-bold 
                      ${client.perf >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {client.perf > 0 ? '+' : ''}{client.perf.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Tasks due in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 border-b last:border-0 pb-4 last:pb-0">
                    <div className={`mt-0.5 h-2 w-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-none">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}</p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{task.status}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">No upcoming tasks.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, warning }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${warning ? 'text-orange-500' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs mt-1 flex items-center ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
          {trendUp && <TrendingUp className="h-3 w-3 mr-1" />}
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}
