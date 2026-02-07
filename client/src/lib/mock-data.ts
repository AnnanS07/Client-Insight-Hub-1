import { nanoid } from "nanoid";

export type ClientStatus = "Lead" | "Active" | "Inactive" | "Churned";

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  tags: string[];
  status: ClientStatus;
  owner: string;
  notes: string;
  lastContact: string; // ISO date
  createdAt: string;
}

export interface Task {
  id: string;
  clientId: string;
  title: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed";
  assignedTo: string;
}

export interface Note {
  id: string;
  clientId: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

const STORAGE_KEYS = {
  CLIENTS: "mock_clients",
  TASKS: "mock_tasks",
  NOTES: "mock_notes",
};

// Initial Mock Data
const INITIAL_CLIENTS: Client[] = [
  {
    id: "1",
    name: "Alice Johnson",
    company: "TechNova Inc.",
    email: "alice@technova.com",
    phone: "+1 (555) 123-4567",
    address: "123 Tech Park, San Francisco, CA",
    tags: ["Enterprise", "High Value"],
    status: "Active",
    owner: "admin",
    notes: "Key decision maker for Q3 expansion.",
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
  {
    id: "2",
    name: "Bob Smith",
    company: "GreenLeaf Logistics",
    email: "bsmith@greenleaf.net",
    phone: "+1 (555) 987-6543",
    address: "456 Eco Way, Austin, TX",
    tags: ["Sustainability", "Lead"],
    status: "Lead",
    owner: "staff",
    notes: "Interested in the basic plan.",
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: "3",
    name: "Carol White",
    company: "FinCore Systems",
    email: "carol@fincore.io",
    phone: "+1 (555) 456-7890",
    address: "789 Wall St, New York, NY",
    tags: ["Finance", "Risk"],
    status: "Active",
    owner: "admin",
    notes: "Renewal coming up in December.",
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
  },
];

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    clientId: "1",
    title: "Prepare Q3 Proposal",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days from now
    priority: "High",
    status: "Pending",
    assignedTo: "admin",
  },
  {
    id: "2",
    clientId: "2",
    title: "Follow up on intro call",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(),
    priority: "Medium",
    status: "Pending",
    assignedTo: "staff",
  },
];

const INITIAL_NOTES: Note[] = [
  {
    id: "1",
    clientId: "1",
    content: "Met with Alice, she is interested in the enterprise tier.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    createdBy: "admin",
  },
];

// Helper to initialize data if empty
const initData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(INITIAL_NOTES));
  }
};

initData();

export const mockDb = {
  getClients: (): Client[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || "[]");
  },
  getClient: (id: string): Client | undefined => {
    const clients = mockDb.getClients();
    return clients.find((c) => c.id === id);
  },
  addClient: (client: Omit<Client, "id" | "createdAt" | "lastContact">) => {
    const clients = mockDb.getClients();
    const newClient: Client = {
      ...client,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      lastContact: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([newClient, ...clients]));
    return newClient;
  },
  updateClient: (id: string, updates: Partial<Client>) => {
    const clients = mockDb.getClients();
    const index = clients.findIndex((c) => c.id === id);
    if (index !== -1) {
      clients[index] = { ...clients[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
      return clients[index];
    }
    return null;
  },
  deleteClient: (id: string) => {
    const clients = mockDb.getClients();
    const newClients = clients.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(newClients));
  },
  
  getTasks: (): Task[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || "[]");
  },
  addTask: (task: Omit<Task, "id">) => {
    const tasks = mockDb.getTasks();
    const newTask = { ...task, id: nanoid() };
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([...tasks, newTask]));
    return newTask;
  },
  updateTask: (id: string, updates: Partial<Task>) => {
    const tasks = mockDb.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return tasks[index];
    }
  },
  deleteTask: (id: string) => {
    const tasks = mockDb.getTasks();
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks.filter((t) => t.id !== id)));
  },

  getNotes: (clientId: string): Note[] => {
    const notes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || "[]");
    return notes.filter((n) => n.clientId === clientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  addNote: (note: Omit<Note, "id" | "createdAt">) => {
    const notes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || "[]");
    const newNote = { ...note, id: nanoid(), createdAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([newNote, ...notes]));
    return newNote;
  }
};
