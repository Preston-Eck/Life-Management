
export enum Urgency {
  NotUrgent = 1,
  Low = 2,
  Medium = 3,
  Urgent = 4,
}

export enum Importance {
  NotImportant = 1,
  Low = 2,
  High = 3,
  VeryImportant = 4,
}

export enum TaskStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Blocked = 'Blocked',
  Completed = 'Completed',
}

export enum AssetType {
  Vehicle = 'Vehicle',
  Appliance = 'Appliance',
  OfficeEquipment = 'Office Equipment',
  PowerEquipment = 'Power Equipment',
  RealEstate = 'Real Estate',
  Other = 'Other',
}

export enum ShoppingStatus {
  Need = 'Need',
  Ordered = 'Ordered',
  Acquired = 'Acquired',
}

export interface Comment {
  id: string;
  authorId: string; // Person ID
  text: string;
  timestamp: string;
  isRead: boolean;
  isPinned: boolean;
}

export interface Notification {
  id: string;
  type: 'Alert' | 'Message' | 'Assignment' | 'System' | 'Mention';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isPinned?: boolean;
  snoozedUntil?: string; // ISO Date string
  linkTo?: string;
  actionRequired?: boolean;
}

export interface ActivityLog {
  id: string;
  action: string; // "Completed Task", "Added Person", etc.
  entityName: string;
  timestamp: string;
  user: string;
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  shoppingItemId?: string; // Link to shopping list
  isOnHand: boolean;
}

export interface Task {
  id: string;
  ownerId: string; // Person ID of the creator
  title: string;
  description: string;
  parentId?: string; // For subtasks
  subtaskIds: string[];
  prerequisiteIds: string[];
  dueDate?: string;
  urgency: Urgency;
  importance: Importance;
  status: TaskStatus;
  assigneeIds: string[]; // Person IDs
  collaboratorIds: string[]; // Person IDs
  location?: string;
  subLocation?: string;
  assetId?: string; // Link to asset being serviced
  materials: Material[];
  comments: Comment[];
  context: 'Work' | 'Personal' | 'Family' | 'School' | 'Other';
  costCache?: number; // Calculated total cost
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  make?: string;
  model?: string;
  year?: number;
  serialNumber?: string;
  specs: Record<string, string>; // Dynamic fields (e.g., Oil Type, Voltage)
  purchaseDate?: string;
  serviceHistoryTaskIds: string[];
  photoUrl?: string;
}

export interface Vendor {
  id: string;
  name: string;
  url?: string;
  addresses: {
    label: string;
    address: string;
    phone?: string;
    salesRep?: string;
    email?: string;
  }[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  vendorId?: string;
  url?: string;
  status: ShoppingStatus;
  statusUpdatedDate: string;
  photoUrl?: string;
  taskId?: string; // Origin task
}

export interface ReceiptParsedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  birthdate?: string;
  relationships: {
    personId: string;
    type: 'Parent' | 'Child' | 'Spouse' | 'Sibling' | 'Colleague' | 'Friend';
  }[];
  groups: string[];
  notes: Comment[];
}
