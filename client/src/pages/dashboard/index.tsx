import { mockDb } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserPlus, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { data: clients = [] } = useQuery({ 
    queryKey: ['clients'], 
    queryFn: () => mockDb.getClients() 
  });
  
  const { data: tasks = [] } = useQuery({ 
    queryKey: ['tasks'], 
    queryFn: () => mockDb.getTasks() 
  });

  const activeClients = clients.filter(c => c.status === "Active").length;
  const newLeads = clients.filter(c => c.status === "Lead").length;
  const pendingTasks = tasks.filter(t => t.status === "Pending").length;

  const statusData = [
    { name: 'Active', value: activeClients, color: 'var(--chart-1)' },
    { name: 'Leads', value: newLeads, color: 'var(--chart-4)' },
    { name: 'Inactive', value: clients.filter(c => c.status === "Inactive").length, color: 'var(--chart-3)' },
    { name: 'Churned', value: clients.filter(c => c.status === "Churned").length, color: 'var(--chart-5)' },
  ];

  // Mock growth data
  const growthData = [
    { name: 'Jan', value: 10 },
    { name: 'Feb', value: 15 },
    { name: 'Mar', value: 12 },
    { name: 'Apr', value: 20 },
    { name: 'May', value: 28 },
    { name: 'Jun', value: 35 },
  ];

  const recentClients = [...clients].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const upcomingTasks = tasks.filter(t => t.status !== "Completed").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your business performance and recent activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Clients" 
          value={clients.length} 
          icon={Users} 
          trend="+12% from last month"
          trendUp={true}
        />
        <StatCard 
          title="Active Clients" 
          value={activeClients} 
          icon={CheckCircle2} 
          trend="+4% from last month"
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
            <CardTitle>Client Growth</CardTitle>
            <CardDescription>New client acquisition over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'var(--muted)'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Client Distribution</CardTitle>
            <CardDescription>Breakdown by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground mt-4">
              {statusData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
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
            <CardTitle>Recent Clients</CardTitle>
            <CardDescription>Latest additions to your database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClients.map(client => (
                <div key={client.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{client.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{client.company}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                      ${client.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                        client.status === 'Lead' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {client.status}
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
