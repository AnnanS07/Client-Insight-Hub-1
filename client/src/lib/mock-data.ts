import { nanoid } from "nanoid";

export type ClientStatus = "Lead" | "Active" | "Inactive" | "Churned";

export const CLIENT_SEGMENTS = [
  "Salaried millennials in metro, Tier-1 cities",
  "Salaried millennials in Tier-2+ cities",
  "Salaried Gen Z",
  "Salaried Gen X in Tier-1, Tier-2+ cities",
  "Self-employed professionals",
  "Gen Z student",
  "Business owner",
] as const;

export type ClientSegment = typeof CLIENT_SEGMENTS[number];

export const ASSET_CLASSES = [
  "Stocks",
  "Mutual Funds",
  "Fixed Deposits (FD)",
  "Bonds",
  "PMS",
  "AIF",
] as const;

export type AssetClass = typeof ASSET_CLASSES[number];

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  tags: string[];
  status: ClientStatus;
  segment: ClientSegment;
  owner: string;
  notes: string;
  lastContact: string; // ISO date
  createdAt: string;
  dematId?: string;
}

export interface Folio {
  id: string;
  clientId: string;
  folioNumber: string;
  provider: string; // Scheme/Provider
  notes: string;
}

export interface PriceHistory {
    date: string;
    value: number; // Price per unit or NAV
}

export interface Holding {
  id: string;
  clientId: string;
  assetClass: AssetClass;
  name: string; // Stock name, Fund name, etc.
  purchaseDate: string;
  units: number;
  averageCost: number; // Cost per unit
  currentPrice: number; // NAV or Price
  notes: string;
  priceHistory: PriceHistory[]; // History of price updates
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
  FOLIOS: "mock_folios",
  HOLDINGS: "mock_holdings",
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
    segment: "Salaried millennials in metro, Tier-1 cities",
    owner: "admin",
    notes: "Key decision maker for Q3 expansion.",
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    dematId: "1203040000012345"
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
    segment: "Business owner",
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
    segment: "Salaried Gen X in Tier-1, Tier-2+ cities",
    owner: "admin",
    notes: "Renewal coming up in December.",
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    dematId: "IN30012345678900"
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

// Seed some holdings for demo
const INITIAL_HOLDINGS: Holding[] = [
  {
    id: "1",
    clientId: "1",
    assetClass: "Stocks",
    name: "Reliance Industries",
    purchaseDate: "2023-01-15",
    units: 100,
    averageCost: 2400,
    currentPrice: 2800,
    notes: "Long term hold",
    priceHistory: [{ date: "2023-01-15", value: 2400 }, { date: new Date().toISOString().split('T')[0], value: 2800 }]
  },
  {
    id: "2",
    clientId: "1",
    assetClass: "Mutual Funds",
    name: "HDFC Top 100",
    purchaseDate: "2022-06-10",
    units: 500,
    averageCost: 450,
    currentPrice: 580,
    notes: "SIP",
    priceHistory: [{ date: "2022-06-10", value: 450 }, { date: new Date().toISOString().split('T')[0], value: 580 }]
  },
  {
    id: "3",
    clientId: "3",
    assetClass: "Fixed Deposits (FD)",
    name: "SBI FD",
    purchaseDate: "2023-05-20",
    units: 1,
    averageCost: 100000,
    currentPrice: 106000, // Accrued value
    notes: "Emergency fund",
    priceHistory: [{ date: "2023-05-20", value: 100000 }, { date: new Date().toISOString().split('T')[0], value: 106000 }]
  }
];

const INITIAL_FOLIOS: Folio[] = [
    {
        id: "1",
        clientId: "1",
        folioNumber: "12345/67",
        provider: "HDFC Mutual Fund",
        notes: "Primary MF"
    }
]

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
  if (!localStorage.getItem(STORAGE_KEYS.HOLDINGS)) {
    localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(INITIAL_HOLDINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FOLIOS)) {
    localStorage.setItem(STORAGE_KEYS.FOLIOS, JSON.stringify(INITIAL_FOLIOS));
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
  },

  getFolios: (clientId: string): Folio[] => {
    const folios: Folio[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLIOS) || "[]");
    return folios.filter((f) => f.clientId === clientId);
  },
  addFolio: (folio: Omit<Folio, "id">) => {
    const folios: Folio[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLIOS) || "[]");
    const newFolio = { ...folio, id: nanoid() };
    localStorage.setItem(STORAGE_KEYS.FOLIOS, JSON.stringify([...folios, newFolio]));
    return newFolio;
  },
  deleteFolio: (id: string) => {
    const folios: Folio[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLIOS) || "[]");
    localStorage.setItem(STORAGE_KEYS.FOLIOS, JSON.stringify(folios.filter((f) => f.id !== id)));
  },

  getHoldings: (clientId: string): Holding[] => {
    const holdings: Holding[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.HOLDINGS) || "[]");
    return holdings.filter((h) => h.clientId === clientId);
  },
  getAllHoldings: (): Holding[] => {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.HOLDINGS) || "[]");
  },
  addHolding: (holding: Omit<Holding, "id" | "priceHistory">) => {
    const holdings: Holding[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.HOLDINGS) || "[]");
    // Initial price history entry
    const initialPriceHistory: PriceHistory = { date: holding.purchaseDate, value: holding.averageCost }; // Or current price if different
    
    const newHolding = { 
        ...holding, 
        id: nanoid(),
        priceHistory: [initialPriceHistory, { date: new Date().toISOString().split('T')[0], value: holding.currentPrice }]
    };
    localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify([...holdings, newHolding]));
    return newHolding;
  },
  updateHolding: (id: string, updates: Partial<Holding>) => {
    const holdings: Holding[] = mockDb.getAllHoldings();
    const index = holdings.findIndex((h) => h.id === id);
    if (index !== -1) {
      // If price is updated, record history
      if (updates.currentPrice !== undefined && updates.currentPrice !== holdings[index].currentPrice) {
          const newHistory = { date: new Date().toISOString().split('T')[0], value: updates.currentPrice };
          // Append or update today's price? Append for history trail.
          // Check if today already exists? Simple demo: just push
          holdings[index] = { 
              ...holdings[index], 
              ...updates,
              priceHistory: [...(holdings[index].priceHistory || []), newHistory]
          };
      } else {
           holdings[index] = { ...holdings[index], ...updates };
      }
      
      localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));
      return holdings[index];
    }
  },
  deleteHolding: (id: string) => {
    const holdings: Holding[] = mockDb.getAllHoldings();
    localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings.filter((h) => h.id !== id)));
  }
};

// --- Financial Calculation Helpers ---

// CAGR = (Current Value / Initial Value)^(1/n) - 1
export function calculateCAGR(initialValue: number, currentValue: number, years: number): number {
    if (initialValue <= 0 || years <= 0) return 0;
    return (Math.pow(currentValue / initialValue, 1 / years) - 1) * 100;
}

// Simple XIRR approximation or placeholder. 
// True XIRR requires iterative solving with cash flows. 
// For this prototype, we'll assume a single cash flow at start (purchase) for simplicity in demo,
// effectively making XIRR = CAGR for single lump sum.
// Real XIRR would need a series of transactions which we aren't storing in detail yet (just holdings).
export function calculateXIRR(initialValue: number, currentValue: number, days: number): number {
     if (initialValue <= 0 || days <= 0) return 0;
     const years = days / 365.25;
     return (Math.pow(currentValue / initialValue, 1 / years) - 1) * 100;
}

export function getPortfolioSummary(holdings: Holding[]) {
    let totalInvested = 0;
    let totalCurrent = 0;
    
    // Group by Asset Class
    const byAssetClass: Record<string, { invested: number, current: number }> = {};

    holdings.forEach(h => {
        const invested = h.units * h.averageCost;
        const current = h.units * h.currentPrice;
        
        totalInvested += invested;
        totalCurrent += current;

        if (!byAssetClass[h.assetClass]) {
            byAssetClass[h.assetClass] = { invested: 0, current: 0 };
        }
        byAssetClass[h.assetClass].invested += invested;
        byAssetClass[h.assetClass].current += current;
    });
    
    return {
        totalInvested,
        totalCurrent,
        byAssetClass,
        holdingsCount: holdings.length
    };
}
