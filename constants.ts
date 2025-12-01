
import { Person, Task, Asset, ShoppingItem, Urgency, Importance, TaskStatus, AssetType, ShoppingStatus, Organization, GoogleAccount } from './types';

// Standard Relationships for Dropdowns
export const RELATIONSHIP_TYPES = [
  'Parent', 'Child', 'Spouse', 'Sibling', 
  'Aunt/Uncle', 'Niece/Nephew', 'Cousin',
  'Friend', 'Co-Worker', 'Employer', 'Employee', 
  'Teacher', 'Student', 'Mentor', 'Mentee', 'Other'
];

export const MOCK_ORGS: Organization[] = [
  { id: 'o1', name: 'Lincoln High School', type: 'School' },
  { id: 'o2', name: 'TechCorp Solutions', type: 'Business' }
];

export const MOCK_GOOGLE_ACCOUNTS: GoogleAccount[] = [
    { 
        id: 'g1', 
        email: 'alex.mercer@gmail.com', 
        services: ['Gmail', 'Calendar', 'Drive'], 
        lastSync: new Date().toISOString() 
    }
];

export const MOCK_PEOPLE: Person[] = [
  {
    id: 'p1',
    isCurrentUser: true,
    linkedUserAccount: 'alex.mercer@nexus.app',
    firstName: 'Alex',
    lastName: 'Mercer',
    emails: [{ id: 'e1', label: 'Personal', value: 'alex@example.com' }],
    phones: [{ id: 'ph1', label: 'Mobile', value: '555-0101' }],
    address: '123 Maple Dr, Springfield',
    birthDate: '1985-04-12',
    importantDates: [],
    customFields: { 'Coffee Order': 'Black', 'Allergies': 'Peanuts' },
    avatarUrl: 'https://picsum.photos/200/200',
    relationships: [{ personId: 'p2', type: 'Spouse' }, { personId: 'p3', type: 'Child' }],
    affiliations: [{ organizationId: 'o2', role: 'Senior Developer' }],
    groups: ['Family', 'Admins'],
    notes: [],
    sharedWith: []
  },
  {
    id: 'p2',
    firstName: 'Sarah',
    lastName: 'Mercer',
    emails: [{ id: 'e2', label: 'Personal', value: 'sarah@example.com' }],
    phones: [],
    importantDates: [{ id: 'd1', label: 'Anniversary', date: '2010-06-15', type: 'Anniversary', repeats: true }],
    customFields: {},
    avatarUrl: 'https://picsum.photos/201/201',
    relationships: [{ personId: 'p1', type: 'Spouse' }, { personId: 'p3', type: 'Child' }],
    affiliations: [],
    groups: ['Family'],
    notes: [],
    sharedWith: [{ userId: 'grandma@nexus.app', fields: ['Emails', 'Phones', 'Relationships'] }]
  },
  {
    id: 'p3',
    firstName: 'Leo',
    lastName: 'Mercer',
    emails: [],
    phones: [],
    importantDates: [],
    customFields: { 'Allergies': 'None' },
    relationships: [{ personId: 'p1', type: 'Parent' }, { personId: 'p2', type: 'Parent' }, { personId: 'p5', type: 'Student' }],
    affiliations: [{ organizationId: 'o1', role: 'Student' }],
    groups: ['Family'],
    notes: [],
    sharedWith: []
  },
  {
    id: 'p4',
    firstName: 'John',
    lastName: 'Doe',
    emails: [{ id: 'e3', label: 'Work', value: 'j.doe@contractors.com' }],
    phones: [{ id: 'ph2', label: 'Work', value: '555-0199' }],
    importantDates: [],
    customFields: {},
    groups: ['Contractors'],
    relationships: [],
    affiliations: [],
    notes: [],
    sharedWith: []
  },
  {
    id: 'p5',
    firstName: 'Mrs. Krabappel',
    lastName: '',
    emails: [],
    phones: [],
    importantDates: [],
    customFields: {},
    groups: ['Work'],
    relationships: [{ personId: 'p3', type: 'Teacher' }],
    affiliations: [{ organizationId: 'o1', role: 'Teacher' }],
    notes: [],
    sharedWith: []
  }
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'a1',
    name: 'Family SUV',
    type: AssetType.Vehicle,
    make: 'Toyota',
    model: 'Highlander',
    year: 2021,
    specs: { 'VIN': 'XYZ123456', 'Oil Type': '0W-20', 'Tire Pressure': '35 PSI' },
    serviceHistoryTaskIds: [],
    photoUrl: 'https://picsum.photos/300/200',
    currentUsage: 42500,
    usageUnit: 'Miles'
  },
  {
    id: 'a2',
    name: 'Garage Fridge',
    type: AssetType.Appliance,
    make: 'Whirlpool',
    specs: { 'Filter Type': 'EveryDrop 4' },
    serviceHistoryTaskIds: [],
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    ownerId: 'p1',
    title: 'Prepare for Winter',
    description: 'General maintenance for house and cars',
    subtaskIds: ['t2', 't3'],
    prerequisiteIds: [],
    urgency: Urgency.Medium,
    importance: Importance.High,
    status: TaskStatus.InProgress,
    assigneeIds: ['p1'],
    collaboratorIds: ['p2'],
    context: 'Family',
    materials: [],
    comments: [],
    location: 'Home'
  },
  {
    id: 't2',
    ownerId: 'p1',
    title: 'Change SUV Oil',
    description: 'Regular maintenance',
    parentId: 't1',
    subtaskIds: [],
    prerequisiteIds: [],
    urgency: Urgency.Medium,
    importance: Importance.High,
    status: TaskStatus.Pending,
    assigneeIds: ['p1'],
    collaboratorIds: [],
    context: 'Family',
    assetId: 'a1',
    location: 'Garage',
    comments: [],
    materials: [
      { id: 'm1', name: '0W-20 Synthetic Oil', quantity: 6, unit: 'Quarts', isOnHand: false, shoppingItemId: 's1' },
      { id: 'm2', name: 'Oil Filter', quantity: 1, unit: 'Pc', isOnHand: true }
    ],
    recurrence: {
        type: 'Usage',
        assetId: 'a1',
        usageThreshold: 5000,
        lastUsageReading: 40000
    }
  },
  {
    id: 't3',
    ownerId: 'p1',
    title: 'Clean Gutters',
    description: 'Remove leaves',
    parentId: 't1',
    subtaskIds: [],
    prerequisiteIds: [],
    urgency: Urgency.Urgent,
    importance: Importance.High,
    status: TaskStatus.Pending,
    assigneeIds: ['p4'], // Contractor
    collaboratorIds: ['p1'],
    context: 'Family',
    materials: [],
    comments: [],
  }
];

export const MOCK_SHOPPING: ShoppingItem[] = [
  {
    id: 's1',
    name: '0W-20 Synthetic Oil',
    quantity: 6,
    unitPrice: 9.99,
    totalCost: 59.94,
    status: ShoppingStatus.Need,
    statusUpdatedDate: new Date().toISOString(),
    taskId: 't2',
    url: 'https://amazon.com'
  }
];
