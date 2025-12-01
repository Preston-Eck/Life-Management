

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

export type ShoppingCategory = string;

export interface GoogleAccount {
  id: string;
  email: string;
  avatarUrl?: string;
  services: ('Gmail' | 'Calendar' | 'Drive')[];
  lastSync?: string;
}

export interface TaskSuggestion {
  id: string;
  source: 'Gmail' | 'Calendar';
  sourceAccount: string; // email
  title: string;
  description: string;
  dueDate?: string;
  confidence: number; // 0-1
}

export interface RecurrenceRule {
  type: 'Time' | 'Usage';
  // Time based
  interval?: number; // e.g., every 3
  unit?: 'day' | 'week' | 'month' | 'year';
  // Usage based
  assetId?: string;
  usageThreshold?: number; // e.g., every 5000 miles
  lastUsageReading?: number; // usage at last completion
  
  // Usage Check Reminder (New)
  usageCheckInterval?: number; // e.g. every 1
  usageCheckUnit?: 'day' | 'week' | 'month' | 'year';
  lastUsageCheckDate?: string; 

  // End Conditions
  endCondition?: 'Never' | 'Date' | 'Count';
  endDate?: string; // ISO Date string
  endCount?: number; // Total number of occurrences
  currentCount?: number; // How many times it has recurred so far
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

export interface Attachment {
  id: string;
  type: 'Image' | 'File';
  name: string;
  url: string; // Base64 or URL
  uploadedAt: string;
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
  timeEstimate?: number; // In Hours
  urgency: Urgency;
  importance: Importance;
  status: TaskStatus;
  assigneeIds: string[]; // Person IDs
  collaboratorIds: string[]; // Person IDs
  location?: string;
  subLocation?: string;
  assetId?: string; // Link to asset being serviced
  materials: Material[];
  attachments: Attachment[];
  comments: Comment[];
  context: 'Work' | 'Personal' | 'Family' | 'School' | 'Other';
  costCache?: number; // Calculated total cost
  recurrence?: RecurrenceRule;
  googleEventId?: string;
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
  currentUsage?: number; // Odometer / Hours
  usageUnit?: string; // "Miles", "Hours", "Cycles"
}

export interface VendorLocation {
  id: string;
  label: string; // e.g. "Downtown Store", "Warehouse"
  address: string;
  salesRep?: string;
  phone?: string;
  email?: string;
}

export interface Vendor {
  id: string;
  name: string;
  url?: string;
  categories: ShoppingCategory[];
  addresses: VendorLocation[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  vendorId?: string;
  vendorLocationId?: string; // Link to specific vendor address
  category?: ShoppingCategory;
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

export type DataShareField = 
  | 'Emails' 
  | 'Phones' 
  | 'Address' 
  | 'PersonalDates' 
  | 'CustomFields' 
  | 'Notes' 
  | 'Relationships';

export interface SharePermission {
  userId: string; // The app user account ID/Email being shared with
  fields: DataShareField[];
}

export interface Organization {
  id: string;
  name: string;
  type: string; // Changed from union to string to support Custom Types
  address?: string;
  website?: string;
}

export interface Affiliation {
  organizationId: string;
  role: string; // e.g. "Student", "Teacher", "Manager"
}

export interface ContactMethod {
  id: string;
  label: string; // "Mobile", "Work", "Home"
  value: string;
}

export interface ImportantDate {
  id: string;
  label: string; // "Wedding Anniversary", "Graduation"
  date: string; // YYYY-MM-DD
  type: 'Birthday' | 'Anniversary' | 'Other';
  repeats: boolean;
}

export interface Person {
  id: string;
  isCurrentUser?: boolean; // Flag for "My Profile"
  linkedUserAccount?: string; // Username/Email of the associated App Account
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  
  // Robust Contact Info
  emails: ContactMethod[];
  phones: ContactMethod[];
  address?: string;
  
  // Personal Data
  birthDate?: string;
  importantDates: ImportantDate[];
  customFields: Record<string, string>; // key (field definition) -> value
  
  relationships: {
    personId: string;
    type: string;
  }[];
  affiliations: Affiliation[];
  groups: string[];
  notes: Comment[];
  sharedWith: SharePermission[]; // List of users this profile is shared with
}