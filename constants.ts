
import { Person, Task, Asset, ShoppingItem, Urgency, Importance, TaskStatus, AssetType, ShoppingStatus } from './types';

// Mock Data Generators for Initial State

export const MOCK_PEOPLE: Person[] = [
  {
    id: 'p1',
    firstName: 'Alex',
    lastName: 'Mercer',
    email: 'alex@example.com',
    avatarUrl: 'https://picsum.photos/200/200',
    relationships: [{ personId: 'p2', type: 'Spouse' }, { personId: 'p3', type: 'Child' }],
    groups: ['Family', 'Admins'],
    notes: []
  },
  {
    id: 'p2',
    firstName: 'Sarah',
    lastName: 'Mercer',
    email: 'sarah@example.com',
    avatarUrl: 'https://picsum.photos/201/201',
    relationships: [{ personId: 'p1', type: 'Spouse' }, { personId: 'p3', type: 'Child' }],
    groups: ['Family'],
    notes: []
  },
  {
    id: 'p3',
    firstName: 'Leo',
    lastName: 'Mercer',
    relationships: [{ personId: 'p1', type: 'Parent' }, { personId: 'p2', type: 'Parent' }],
    groups: ['Family'],
    notes: []
  },
  {
    id: 'p4',
    firstName: 'John',
    lastName: 'Doe',
    email: 'j.doe@contractors.com',
    groups: ['Contractors'],
    relationships: [],
    notes: []
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
    photoUrl: 'https://picsum.photos/300/200'
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
    ]
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
