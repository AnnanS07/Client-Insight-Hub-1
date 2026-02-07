import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockDb, Task } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: tasks = [] } = useQuery({ 
    queryKey: ['tasks'], 
    queryFn: () => mockDb.getTasks() 
  });
  
  const { data: clients = [] } = useQuery({ 
    queryKey: ['clients'], 
    queryFn: () => mockDb.getClients() 
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: Task['status'] }) => {
      mockDb.updateTask(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const addTaskMutation = useMutation({
    mutationFn: async (newTask: any) => {
      mockDb.addTask(newTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsAddOpen(false);
      toast({ title: "Task Created", description: "New task has been added." });
    }
  });

  const groupedTasks = {
    Pending: tasks.filter(t => t.status === "Pending"),
    InProgress: tasks.filter(t => t.status === "In Progress"),
    Completed: tasks.filter(t => t.status === "Completed"),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-2">Manage your to-dos and follow-ups.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
            </DialogHeader>
            <AddTaskForm 
              clients={clients} 
              onSubmit={(data: any) => addTaskMutation.mutate(data)} 
              user={user}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TaskColumn 
          title="To Do" 
          tasks={groupedTasks.Pending} 
          status="Pending" 
          onStatusChange={updateTaskStatus.mutate}
          clients={clients}
        />
        <TaskColumn 
          title="In Progress" 
          tasks={groupedTasks.InProgress} 
          status="In Progress" 
          onStatusChange={updateTaskStatus.mutate}
          clients={clients}
        />
        <TaskColumn 
          title="Completed" 
          tasks={groupedTasks.Completed} 
          status="Completed" 
          onStatusChange={updateTaskStatus.mutate}
          clients={clients}
        />
      </div>
    </div>
  );
}

function TaskColumn({ title, tasks, status, onStatusChange, clients }: any) {
  return (
    <Card className="h-full bg-secondary/30 border-none shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <Badge variant="secondary" className="bg-background">{tasks.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task: Task) => {
          const client = clients.find((c: any) => c.id === task.clientId);
          return (
            <Card key={task.id} className="bg-background shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-medium text-sm leading-tight">{task.title}</p>
                  <PriorityBadge priority={task.priority} />
                </div>
                
                {client && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                    {client.name}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(new Date(task.dueDate), "MMM d")}
                  </div>
                  
                  {status !== "Completed" ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => onStatusChange({ id: task.id, status: status === "Pending" ? "In Progress" : "Completed" })}
                    >
                      <Circle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    </Button>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            No tasks
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    High: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    Medium: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
    Low: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${colors[priority]}`}>
      {priority}
    </span>
  );
}

function AddTaskForm({ clients, onSubmit, user }: any) {
  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    priority: "Medium",
    dueDate: format(new Date(), "yyyy-MM-dd")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      status: "Pending",
      assignedTo: user?.name || "admin"
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title</Label>
        <Input id="title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Follow up call" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="client">Related Client</Label>
        <Select value={formData.clientId} onValueChange={v => setFormData({...formData, clientId: v})}>
          <SelectTrigger>
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input id="dueDate" type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit">Create Task</Button>
      </div>
    </form>
  );
}
