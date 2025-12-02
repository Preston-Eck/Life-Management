

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Task, Person, Asset, ShoppingItem, Notification, ActivityLog, ShoppingStatus, Urgency, Comment, Material, Importance, TaskStatus, SharePermission, Organization, GoogleAccount, TaskSuggestion, Vendor, AppError } from '../types';
import { MOCK_TASKS, MOCK_PEOPLE, MOCK_ASSETS, MOCK_SHOPPING, MOCK_ORGS, MOCK_GOOGLE_ACCOUNTS, MOCK_VENDORS, SHOPPING_CATEGORIES } from '../constants';
import { scanGoogleData, analyzeErrorLog } from '../services/gemini';

const generateIdHelper = () => Math.random().toString(36).substr(2, 9);

interface AppState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string) => void;
  logout: () => void;
  completeOnboarding: () => void;

  tasks: Task[];
  people: Person[];
  assets: Asset[];
  shoppingList: ShoppingItem[];
  currentUser: Person;
  notifications: Notification[];
  activityLog: ActivityLog[];
  organizations: Organization[];
  vendors: Vendor[];
  
  googleAccounts: GoogleAccount[];
  taskSuggestions: TaskSuggestion[];
  
  customFieldDefs: string[];
  addCustomFieldDef: (fieldName: string) => void;

  shoppingCategories: string[];
  addShoppingCategory: (category: string) => void;

  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (task: Task) => void; 
  addSubtask: (parentId: string, title: string, description: string) => void;
  
  addAsset: (asset: Asset) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;
  updateAssetUsage: (assetId: string, usage: number) => void;
  
  addShoppingItem: (item: ShoppingItem) => void;
  updateShoppingItem: (item: ShoppingItem) => void;
  deleteShoppingItem: (id: string) => void;
  processReceiptItems: (items: any[]) => void;
  
  addVendor: (vendor: Vendor) => void;
  updateVendor: (vendor: Vendor) => void;
  deleteVendor: (id: string) => void;
  
  addPerson: (person: Person) => void;
  updatePerson: (person: Person) => void;
  sharePerson: (personId: string, shareData: SharePermission) => void;
  
  addOrganization: (org: Organization) => void;
  updateOrganization: (org: Organization) => void;
  deleteOrganization: (id: string) => void;

  markNotificationRead: (id: string) => void;
  snoozeNotification: (id: string, until: Date) => void;
  pinNotification: (id: string) => void;
  clearNotifications: () => void;
  
  addComment: (taskId: string, text: string) => void;
  editComment: (taskId: string, commentId: string, newText: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  
  updateTaskMaterials: (taskId: string, materials: Material[]) => void;
  getTaskTotalCost: (taskId: string) => number;
  
  linkGoogleAccount: (email: string) => void;
  unlinkGoogleAccount: (id: string) => void;
  generateTaskSuggestions: () => Promise<void>;
  acceptSuggestion: (suggestion: TaskSuggestion) => void;
  rejectSuggestion: (id: string) => void;

  // Admin / Error Handling
  appErrors: AppError[];
  logError: (msg: string, stack?: string, componentStack?: string) => void;
  fetchAppErrors: () => Promise<void>;
  resolveError: (id: string) => Promise<void>;
  analyzeError: (error: AppError) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

// Helper for Reciprocal Relationships
const getInverseRelationship = (type: string): string => {
  switch (type) {
    case 'Parent': return 'Child';
    case 'Child': return 'Parent';
    case 'Spouse': return 'Spouse';
    case 'Sibling': return 'Sibling';
    case 'Colleague': return 'Colleague';
    case 'Co-Worker': return 'Co-Worker';
    case 'Friend': return 'Friend';
    case 'Aunt/Uncle': return 'Niece/Nephew';
    case 'Niece/Nephew': return 'Aunt/Uncle';
    case 'Teacher': return 'Student';
    case 'Student': return 'Teacher';
    case 'Employer': return 'Employee';
    case 'Employee': return 'Employer';
    case 'Mentor': return 'Mentee';
    case 'Mentee': return 'Mentor';
    default: return type;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('p1');
  
  // Admin Check
  const isAdmin = useMemo(() => {
     // Check authenticated user email logic. 
     // For this mock, we check if linkedUserAccount matches 'preston@udrg.us'
     // We need to access people state, but it is defined below. 
     // We will compute this in the login logic or derived state below.
     return false; 
  }, []);

  // State
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [allShoppingList, setAllShoppingList] = useState<ShoppingItem[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [allActivityLog, setAllActivityLog] = useState<ActivityLog[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [allGoogleAccounts, setAllGoogleAccounts] = useState<GoogleAccount[]>([]);
  
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<string[]>(['Allergies', 'Dietary Restrictions', 'Favorite Color', 'Coffee Order']);
  const [shoppingCategories, setShoppingCategories] = useState<string[]>(SHOPPING_CATEGORIES);

  const [isInitialized, setIsInitialized] = useState(false);

  // Error State
  const [appErrors, setAppErrors] = useState<AppError[]>([]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
        const syncData = async () => {
            try {
                await fetch('/api/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tasks: allTasks,
                        people: allPeople,
                        assets: allAssets,
                        shoppingList: allShoppingList,
                        organizations: allOrganizations,
                        vendors: allVendors,
                        googleAccounts: allGoogleAccounts,
                        activityLog: allActivityLog
                    })
                });
            } catch (e) {
                console.error("Failed to sync to backend", e);
            }
        };
        const timer = setTimeout(syncData, 1000); // Debounce 1s
        return () => clearTimeout(timer);
    }
  }, [allTasks, allPeople, allAssets, allShoppingList, allOrganizations, allVendors, allGoogleAccounts, allActivityLog, isInitialized, isAuthenticated]);


  // Derived State
  const currentUser = useMemo(() => {
    return allPeople.find(p => p.id === currentUserId) || allPeople[0] || MOCK_PEOPLE[0];
  }, [allPeople, currentUserId]);

  const tasks = useMemo(() => allTasks.filter(t => t.ownerId === currentUserId || t.assigneeIds.includes(currentUserId) || t.collaboratorIds.includes(currentUserId)), [allTasks, currentUserId]);
  const people = useMemo(() => allPeople.filter(p => p.id === currentUserId || p.isCurrentUser === false), [allPeople, currentUserId]);
  const assets = useMemo(() => allAssets, [allAssets]); 
  const shoppingList = useMemo(() => allShoppingList, [allShoppingList]);
  const notifications = useMemo(() => allNotifications, [allNotifications]); 
  const activityLog = useMemo(() => allActivityLog, [allActivityLog]);
  const organizations = useMemo(() => allOrganizations, [allOrganizations]);
  const vendors = useMemo(() => allVendors, [allVendors]);
  const googleAccounts = useMemo(() => allGoogleAccounts, [allGoogleAccounts]);

  const userIsAdmin = useMemo(() => {
      return currentUser?.linkedUserAccount === 'preston@udrg.us';
  }, [currentUser]);

  const login = async (email: string) => {
    setIsLoading(true);
    
    // 1. Fetch Data from Backend
    try {
        const response = await fetch('/api/data');
        if (response.ok) {
            const data = await response.json();
            
            // If Backend is empty (fresh server), initialize with mocks or empty
            if (data.people && data.people.length > 0) {
                setAllTasks(data.tasks);
                setAllPeople(data.people);
                setAllAssets(data.assets);
                setAllShoppingList(data.shoppingList);
                setAllOrganizations(data.organizations);
                setAllVendors(data.vendors);
                setAllGoogleAccounts(data.googleAccounts);
                setAllActivityLog(data.activityLog);
            } else {
                setAllTasks(MOCK_TASKS);
                setAllPeople(MOCK_PEOPLE);
                setAllAssets(MOCK_ASSETS);
                setAllShoppingList(MOCK_SHOPPING);
                setAllOrganizations(MOCK_ORGS);
                setAllVendors(MOCK_VENDORS);
                setAllGoogleAccounts(MOCK_GOOGLE_ACCOUNTS);
            }
        }
    } catch (e) {
        console.error("Backend offline, loading local mocks", e);
        setAllTasks(MOCK_TASKS);
        setAllPeople(MOCK_PEOPLE);
        setAllAssets(MOCK_ASSETS);
        setAllShoppingList(MOCK_SHOPPING);
        setAllOrganizations(MOCK_ORGS);
        setAllVendors(MOCK_VENDORS);
        setAllGoogleAccounts(MOCK_GOOGLE_ACCOUNTS);
    }
    
    // 2. Auth Logic
    setTimeout(() => {
        const existingUser = allPeople.find(p => p.linkedUserAccount?.toLowerCase() === email.toLowerCase()) 
                          || MOCK_PEOPLE.find(p => p.linkedUserAccount?.toLowerCase() === email.toLowerCase());

        if (existingUser) {
            setCurrentUserId(existingUser.id);
        } else {
            // Create New
            const newUserId = generateIdHelper();
            const newUser: Person = {
                id: newUserId,
                isCurrentUser: true,
                linkedUserAccount: email,
                hasCompletedOnboarding: false, // Force walkthrough for new user
                firstName: email.split('@')[0],
                lastName: '',
                emails: [{ id: generateIdHelper(), label: 'Personal', value: email }],
                phones: [],
                address: '',
                birthDate: '',
                importantDates: [],
                customFields: {},
                relationships: [],
                affiliations: [],
                groups: ['Family'],
                notes: [],
                sharedWith: []
            };
            setAllPeople(prev => [...prev, newUser]);
            setCurrentUserId(newUserId);
        }
        
        setIsInitialized(true);
        setIsAuthenticated(true);
        setIsLoading(false);
    }, 500);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUserId('');
    setIsInitialized(false);
    setAppErrors([]);
  };
  
  const completeOnboarding = () => {
      setAllPeople(prev => prev.map(p => p.id === currentUserId ? { ...p, hasCompletedOnboarding: true } : p));
  };

  const logActivity = (action: string, entityName: string) => {
    const newLog: ActivityLog = {
      id: generateIdHelper(),
      action,
      entityName,
      timestamp: new Date().toISOString(),
      user: currentUser.firstName || currentUser.linkedUserAccount || 'User'
    };
    setAllActivityLog(prev => [newLog, ...prev]);
  };

  // --- Notification Logic ---
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const newNotifs: Notification[] = [];
    tasks.forEach(t => {
      // Overdue Check
      if (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed') {
        newNotifs.push({
          id: `overdue-${t.id}`,
          type: 'Alert',
          title: 'Overdue Task',
          message: `Task "${t.title}" is overdue.`,
          timestamp: new Date().toISOString(),
          isRead: false,
          linkTo: `/tasks/${t.id}`
        });
      }
      // Usage Reminder
      if (t.recurrence?.type === 'Usage' && t.recurrence.usageCheckInterval && t.assetId && t.status !== 'Completed') {
          const rule = t.recurrence;
          const lastCheck = rule.lastUsageCheckDate ? new Date(rule.lastUsageCheckDate) : new Date(); 
          const nextCheck = new Date(lastCheck);
          const interval = rule.usageCheckInterval;

          if (rule.usageCheckUnit === 'day') nextCheck.setDate(nextCheck.getDate() + interval);
          if (rule.usageCheckUnit === 'week') nextCheck.setDate(nextCheck.getDate() + (interval * 7));
          if (rule.usageCheckUnit === 'month') nextCheck.setMonth(nextCheck.getMonth() + interval);
          if (rule.usageCheckUnit === 'year') nextCheck.setFullYear(nextCheck.getFullYear() + interval);

          if (new Date() > nextCheck) {
               const assetName = assets.find(a => a.id === t.assetId)?.name || 'Asset';
               newNotifs.push({
                  id: `usage-check-${t.id}`,
                  type: 'System',
                  title: 'Usage Check Needed',
                  message: `Time to update usage for ${assetName} (Task: ${t.title})`,
                  timestamp: new Date().toISOString(),
                  isRead: false,
                  linkTo: `/assets/${t.assetId}`,
                  actionRequired: true
               });
          }
      }
    });

    setAllNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const uniqueNew = newNotifs.filter(n => !existingIds.has(n.id));
        return [...uniqueNew, ...prev];
    });
  }, [tasks.length, assets, isAuthenticated]);

  // Error Handling
  const logError = async (msg: string, stack?: string, componentStack?: string) => {
      const errorPayload: AppError = {
          id: generateIdHelper(),
          message: msg,
          stack: stack,
          componentStack: componentStack,
          timestamp: new Date().toISOString(),
          userId: currentUserId,
          userEmail: currentUser.linkedUserAccount,
          url: window.location.href,
          isResolved: false
      };
      
      try {
          await fetch('/api/logs/error', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(errorPayload)
          });
          // Optimistically update if admin is logged in
          if (userIsAdmin) {
              setAppErrors(prev => [errorPayload, ...prev]);
          }
      } catch (e) {
          console.error("Failed to log error to server", e);
      }
  };

  const fetchAppErrors = async () => {
      if (!userIsAdmin) return;
      try {
          const res = await fetch('/api/admin/errors');
          if (res.ok) {
              const data = await res.json();
              setAppErrors(data);
          }
      } catch (e) {
          console.error("Failed to fetch admin errors", e);
      }
  };

  const resolveError = async (id: string) => {
       try {
          await fetch('/api/admin/errors/resolve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id })
          });
          setAppErrors(prev => prev.map(e => e.id === id ? { ...e, isResolved: true } : e));
      } catch (e) {
          console.error("Failed to resolve error", e);
      }
  };

  const analyzeError = async (error: AppError) => {
      const analysis = await analyzeErrorLog(error);
      setAppErrors(prev => prev.map(e => e.id === error.id ? { ...e, aiAnalysis: analysis } : e));
  };


  const addCustomFieldDef = (fieldName: string) => {
    if (!customFieldDefs.includes(fieldName)) {
      setCustomFieldDefs([...customFieldDefs, fieldName]);
    }
  };
  
  const addShoppingCategory = (category: string) => {
    if (category && !shoppingCategories.includes(category)) {
        setShoppingCategories(prev => [...prev, category].sort());
    }
  };

  const addTask = (task: Task) => {
    const taskWithOwner = { ...task, ownerId: currentUserId };
    setAllTasks(prev => [...prev, taskWithOwner]);
    logActivity("Created Task", task.title);
  };

  const updateTask = (updatedTask: Task) => {
    setAllTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    logActivity("Updated Task", updatedTask.title);
  };

  const calculateTaskCostRecursive = (taskId: string, currentTasks: Task[], currentShoppingList: ShoppingItem[]): number => {
      const task = currentTasks.find(t => t.id === taskId);
      if (!task) return 0;

      if (task.status === TaskStatus.Completed && task.costCache !== undefined) {
          return task.costCache;
      }

      let materialCost = 0;
      task.materials.forEach(mat => {
          if (mat.shoppingItemId) {
              const shopItem = currentShoppingList.find(s => s.id === mat.shoppingItemId);
              if (shopItem) materialCost += shopItem.totalCost;
          }
      });

      let subtaskCost = 0;
      task.subtaskIds.forEach(subId => {
          subtaskCost += calculateTaskCostRecursive(subId, currentTasks, currentShoppingList);
      });

      return materialCost + subtaskCost;
  };

  const getTaskTotalCost = (taskId: string): number => {
      return calculateTaskCostRecursive(taskId, allTasks, allShoppingList);
  };

  const completeTask = (task: Task) => {
      const finalCost = getTaskTotalCost(task.id);
      
      const updated = { 
          ...task, 
          status: TaskStatus.Completed,
          costCache: finalCost 
      };

      let newTasks = allTasks.map(t => t.id === task.id ? updated : t);

      // Handle Recurrence
      if (task.recurrence) {
          const rule = task.recurrence;
          let nextDueDate = new Date();
          let shouldRecur = false;
          
          const currentCount = (rule.currentCount || 0) + 1;
          let limitReached = false;
          if (rule.endCondition === 'Count' && rule.endCount) {
             if (currentCount >= rule.endCount) limitReached = true;
          }

          if (!limitReached) {
            if (rule.type === 'Time') {
                shouldRecur = true;
                const interval = rule.interval || 1;
                const currentDue = task.dueDate ? new Date(task.dueDate) : new Date();
                
                if (rule.unit === 'day') nextDueDate.setDate(currentDue.getDate() + interval);
                if (rule.unit === 'week') nextDueDate.setDate(currentDue.getDate() + (interval * 7));
                if (rule.unit === 'month') nextDueDate.setMonth(currentDue.getMonth() + interval);
                if (rule.unit === 'year') nextDueDate.setFullYear(currentDue.getFullYear() + interval);
                
                if (rule.endCondition === 'Date' && rule.endDate) {
                    if (nextDueDate > new Date(rule.endDate)) shouldRecur = false;
                }
            }
            
            if (rule.type === 'Usage' && task.assetId) {
               const asset = allAssets.find(a => a.id === task.assetId);
               if (asset && asset.currentUsage !== undefined) {
                   shouldRecur = true;
               }
            }

            if (shouldRecur) {
               const nextTask: Task = {
                   ...task,
                   id: generateIdHelper(),
                   status: TaskStatus.Pending,
                   dueDate: rule.type === 'Time' ? nextDueDate.toISOString() : undefined,
                   recurrence: { 
                       ...rule, 
                       currentCount: currentCount,
                       lastUsageReading: rule.type === 'Usage' ? allAssets.find(a=>a.id === task.assetId)?.currentUsage || 0 : rule.lastUsageReading 
                   },
                   comments: [],
                   costCache: undefined
               };
               newTasks.push(nextTask);
               logActivity("Recurrence Triggered", nextTask.title);
            }
          }
      }
      
      setAllTasks(newTasks);
      logActivity("Completed Task", task.title);
  };
  
  const deleteTask = (taskId: string) => {
    setAllTasks(prev => prev.filter(t => t.id !== taskId));
    logActivity("Deleted Task", "Task ID: " + taskId);
  };

  const addSubtask = (parentId: string, title: string, description: string) => {
    const parent = allTasks.find(t => t.id === parentId);
    if (!parent) return;

    const newSubtask: Task = {
      id: generateIdHelper(),
      ownerId: currentUserId,
      title,
      description,
      parentId: parent.id,
      subtaskIds: [],
      prerequisiteIds: [],
      urgency: parent.urgency,
      importance: parent.importance,
      status: TaskStatus.Pending,
      assigneeIds: [],
      collaboratorIds: [],
      context: parent.context,
      materials: [],
      comments: [],
      attachments: []
    };

    const updatedParent = {
      ...parent,
      subtaskIds: [...parent.subtaskIds, newSubtask.id]
    };

    setAllTasks(prev => [...prev.map(t => t.id === parentId ? updatedParent : t), newSubtask]);
    logActivity("Added Subtask", title);
  };

  const addAsset = (asset: Asset) => {
    setAllAssets(prev => [...prev, { ...asset, ownerId: currentUserId }]); 
    logActivity("Added Asset", asset.name);
  };

  const updateAsset = (asset: Asset) => {
    setAllAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
    logActivity("Updated Asset", asset.name);
  };

  const updateAssetUsage = (assetId: string, usage: number) => {
      const asset = allAssets.find(a => a.id === assetId);
      if (!asset) return;
      
      const newAsset = { ...asset, currentUsage: usage };
      setAllAssets(prev => prev.map(a => a.id === assetId ? newAsset : a));
      logActivity("Updated Usage", `${asset.name}: ${usage} ${asset.usageUnit}`);

      // Process Usage-Based Recurrence
      const updatedTasks = allTasks.map(t => {
          if (t.assetId === assetId && t.recurrence?.type === 'Usage') {
               const newRecurrence = {
                   ...t.recurrence,
                   lastUsageCheckDate: new Date().toISOString()
               };
               
               const rule = t.recurrence;
               const lastReading = rule.lastUsageReading || 0;
               const threshold = rule.usageThreshold || 0;
               
               let urgencyUpdate = t.urgency;
               let notificationToAdd: Notification | null = null;

               if (usage - lastReading >= threshold && t.status !== TaskStatus.Completed) {
                   if (t.status === TaskStatus.Pending) {
                       urgencyUpdate = Urgency.Urgent;
                       notificationToAdd = {
                           id: generateIdHelper(),
                           type: 'Alert',
                           title: 'Maintenance Due',
                           message: `Task "${t.title}" is due based on usage.`,
                           timestamp: new Date().toISOString(),
                           isRead: false,
                           linkTo: `/tasks/${t.id}`
                       };
                   }
               }
               
               if (notificationToAdd) {
                   setAllNotifications(prev => [...prev, notificationToAdd!]);
               }

               return { ...t, urgency: urgencyUpdate, recurrence: newRecurrence };
          }
          return t;
      });

      setAllTasks(updatedTasks);
  };

  const deleteAsset = (id: string) => {
    setAllAssets(prev => prev.filter(a => a.id !== id));
    logActivity("Deleted Asset", id);
  };
  
  const addShoppingItem = (item: ShoppingItem) => setAllShoppingList(prev => [...prev, item]);
  
  const updateShoppingItem = (item: ShoppingItem) => {
    setAllShoppingList(prev => prev.map(i => i.id === item.id ? item : i));
  };

  const deleteShoppingItem = (id: string) => {
    setAllShoppingList(prev => prev.filter(i => i.id !== id));
  }

  const processReceiptItems = (scannedItems: any[]) => {
    let updatedList = [...allShoppingList];
    const newItems: ShoppingItem[] = [];

    scannedItems.forEach(scanned => {
      const existingIndex = updatedList.findIndex(
        i => i.status === ShoppingStatus.Need && i.name.toLowerCase().includes(scanned.name.toLowerCase())
      );

      if (existingIndex >= 0) {
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          status: ShoppingStatus.Acquired,
          unitPrice: scanned.unitPrice,
          totalCost: scanned.totalPrice,
          statusUpdatedDate: new Date().toISOString()
        };
        logActivity("Acquired Item", updatedList[existingIndex].name);
      } else {
        const newItem: ShoppingItem = {
          id: generateIdHelper(),
          name: scanned.name,
          quantity: scanned.quantity,
          unitPrice: scanned.unitPrice,
          totalCost: scanned.totalPrice,
          status: ShoppingStatus.Acquired,
          statusUpdatedDate: new Date().toISOString(),
        };
        newItems.push(newItem);
        logActivity("scanned/Acquired Item", newItem.name);
      }
    });

    setAllShoppingList([...updatedList, ...newItems]);
  };

  const addVendor = (vendor: Vendor) => {
    setAllVendors(prev => [...prev, vendor]);
    logActivity("Added Vendor", vendor.name);
  };

  const updateVendor = (vendor: Vendor) => {
    setAllVendors(prev => prev.map(v => v.id === vendor.id ? vendor : v));
    logActivity("Updated Vendor", vendor.name);
  };

  const deleteVendor = (id: string) => {
    setAllVendors(prev => prev.filter(v => v.id !== id));
    logActivity("Deleted Vendor", id);
  };

  const addPerson = (person: Person) => {
    setAllPeople(prev => {
        const updatedPeople = [...prev, person];
        person.relationships.forEach(rel => {
            const targetIndex = updatedPeople.findIndex(p => p.id === rel.personId);
            if (targetIndex >= 0) {
                const target = updatedPeople[targetIndex];
                const inverseType = getInverseRelationship(rel.type);
                if (!target.relationships.some(r => r.personId === person.id)) {
                    updatedPeople[targetIndex] = {
                        ...target,
                        relationships: [...target.relationships, { personId: person.id, type: inverseType }]
                    };
                }
            }
        });
        return updatedPeople;
    });
    logActivity("Added Person", `${person.firstName} ${person.lastName}`);
  };

  const updatePerson = (updatedPerson: Person) => {
    setAllPeople(prevPeople => {
        const oldPerson = prevPeople.find(p => p.id === updatedPerson.id);
        let newPeople = prevPeople.map(p => p.id === updatedPerson.id ? updatedPerson : p);
        
        if (oldPerson) {
             oldPerson.relationships.forEach(oldRel => {
                 const stillExists = updatedPerson.relationships.some(newRel => newRel.personId === oldRel.personId);
                 if (!stillExists) {
                     const targetIndex = newPeople.findIndex(p => p.id === oldRel.personId);
                     if (targetIndex >= 0) {
                         const target = newPeople[targetIndex];
                         newPeople[targetIndex] = {
                             ...target,
                             relationships: target.relationships.filter(r => r.personId !== updatedPerson.id)
                         };
                     }
                 }
             });
        }

        updatedPerson.relationships.forEach(rel => {
            const targetIndex = newPeople.findIndex(p => p.id === rel.personId);
            if (targetIndex >= 0) {
                const target = newPeople[targetIndex];
                const inverseType = getInverseRelationship(rel.type);
                const existingRelIndex = target.relationships.findIndex(r => r.personId === updatedPerson.id);
                
                if (existingRelIndex >= 0) {
                   const updatedRels = [...target.relationships];
                   updatedRels[existingRelIndex] = { personId: updatedPerson.id, type: inverseType };
                   newPeople[targetIndex] = { ...target, relationships: updatedRels };
                } else {
                    newPeople[targetIndex] = {
                        ...target,
                        relationships: [...target.relationships, { personId: updatedPerson.id, type: inverseType }]
                    };
                }
            }
        });
        return newPeople;
    });
    logActivity("Updated Person", `${updatedPerson.firstName} ${updatedPerson.lastName}`);
  };

  const sharePerson = (personId: string, shareData: SharePermission) => {
     setAllPeople(prev => prev.map(p => {
        if (p.id !== personId) return p;
        const existingIndex = p.sharedWith.findIndex(s => s.userId === shareData.userId);
        let newSharedWith = [...p.sharedWith];
        if (existingIndex >= 0) {
            newSharedWith[existingIndex] = shareData;
        } else {
            newSharedWith.push(shareData);
        }
        return { ...p, sharedWith: newSharedWith };
     }));
  };
  
  const addOrganization = (org: Organization) => {
    setAllOrganizations(prev => [...prev, org]);
    logActivity("Added Organization", org.name);
  };
  
  const updateOrganization = (org: Organization) => {
    setAllOrganizations(prev => prev.map(o => o.id === org.id ? org : o));
    logActivity("Updated Organization", org.name);
  };
  
  const deleteOrganization = (id: string) => {
    setAllOrganizations(prev => prev.filter(o => o.id !== id));
    logActivity("Deleted Organization", id);
  };
  
  const markNotificationRead = (id: string) => {
      setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };
  
  const snoozeNotification = (id: string, until: Date) => {
      setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, snoozedUntil: until.toISOString() } : n));
  };
  
  const pinNotification = (id: string) => {
      setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };
  
  const clearNotifications = () => {
      setAllNotifications(prev => prev.filter(n => n.isPinned));
  };
  
  const addComment = (taskId: string, text: string) => {
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;
      
      const newComment: Comment = {
          id: generateIdHelper(),
          authorId: currentUserId,
          text,
          timestamp: new Date().toISOString(),
          isRead: true,
          isPinned: false
      };
      
      // Check for mentions
      const mentions = text.match(/@(\w+)/g);
      if (mentions) {
          mentions.forEach(m => {
              const name = m.substring(1).toLowerCase();
              const person = allPeople.find(p => p.firstName.toLowerCase() === name);
              if (person) {
                  setAllNotifications(prev => [...prev, {
                      id: generateIdHelper(),
                      type: 'Mention',
                      title: 'You were mentioned',
                      message: `${currentUser.firstName} mentioned you in task: ${task.title}`,
                      timestamp: new Date().toISOString(),
                      isRead: false,
                      linkTo: `/tasks/${taskId}`
                  }]);
              }
          });
      }
      
      const updatedTask = { ...task, comments: [newComment, ...task.comments] };
      setAllTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
  };
  
  const editComment = (taskId: string, commentId: string, newText: string) => {
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;
      const updatedComments = task.comments.map(c => c.id === commentId ? { ...c, text: newText } : c);
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...task, comments: updatedComments } : t));
  };
  
  const deleteComment = (taskId: string, commentId: string) => {
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...task, comments: task.comments.filter(c => c.id !== commentId) } : t));
  };
  
  const updateTaskMaterials = (taskId: string, materials: Material[]) => {
      // Sync materials with shopping list
      let updatedShoppingList = [...allShoppingList];
      const newShoppingItems: ShoppingItem[] = [];

      const syncedMaterials = materials.map(mat => {
          if (!mat.shoppingItemId) {
              // Create new Shopping Item
              const newItem: ShoppingItem = {
                  id: generateIdHelper(),
                  name: mat.name,
                  quantity: mat.quantity,
                  unitPrice: 0, 
                  totalCost: 0,
                  status: mat.isOnHand ? ShoppingStatus.Acquired : ShoppingStatus.Need,
                  statusUpdatedDate: new Date().toISOString(),
                  taskId: taskId
              };
              newShoppingItems.push(newItem);
              return { ...mat, shoppingItemId: newItem.id };
          } else {
              // Update existing
              const existingIdx = updatedShoppingList.findIndex(s => s.id === mat.shoppingItemId);
              if (existingIdx >= 0) {
                  updatedShoppingList[existingIdx] = {
                      ...updatedShoppingList[existingIdx],
                      status: mat.isOnHand ? ShoppingStatus.Acquired : ShoppingStatus.Need,
                      statusUpdatedDate: new Date().toISOString()
                  };
              }
              return mat;
          }
      });
      
      setAllShoppingList([...updatedShoppingList, ...newShoppingItems]);
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, materials: syncedMaterials } : t));
  };
  
  const linkGoogleAccount = (email: string) => {
      if (!allGoogleAccounts.find(g => g.email === email)) {
          setAllGoogleAccounts(prev => [...prev, {
              id: generateIdHelper(),
              email,
              services: ['Gmail', 'Calendar', 'Drive'],
              lastSync: new Date().toISOString()
          }]);
      }
  };
  
  const unlinkGoogleAccount = (id: string) => {
      setAllGoogleAccounts(prev => prev.filter(g => g.id !== id));
  };
  
  const generateTaskSuggestions = async () => {
      const accounts = allGoogleAccounts.map(g => g.email);
      if (accounts.length === 0) return;
      const suggestions = await scanGoogleData(accounts);
      setTaskSuggestions(suggestions);
  };
  
  const acceptSuggestion = (suggestion: TaskSuggestion) => {
      const newTask: Task = {
          id: generateIdHelper(),
          ownerId: currentUserId,
          title: suggestion.title,
          description: suggestion.description,
          dueDate: suggestion.dueDate,
          urgency: Urgency.Medium,
          importance: Importance.High,
          status: TaskStatus.Pending,
          assigneeIds: [currentUserId],
          collaboratorIds: [],
          context: 'Personal',
          subtaskIds: [],
          prerequisiteIds: [],
          materials: [],
          comments: [],
          attachments: []
      };
      addTask(newTask);
      setTaskSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };
  
  const rejectSuggestion = (id: string) => {
      setTaskSuggestions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      isLoading,
      isAdmin: userIsAdmin,
      login,
      logout,
      completeOnboarding,
      tasks,
      people,
      assets,
      shoppingList,
      currentUser,
      notifications,
      activityLog,
      organizations,
      vendors,
      googleAccounts,
      taskSuggestions,
      customFieldDefs,
      addCustomFieldDef,
      shoppingCategories,
      addShoppingCategory,
      addTask,
      updateTask,
      deleteTask,
      completeTask,
      addSubtask,
      addAsset,
      updateAsset,
      deleteAsset,
      updateAssetUsage,
      addShoppingItem,
      updateShoppingItem,
      deleteShoppingItem,
      processReceiptItems,
      addVendor,
      updateVendor,
      deleteVendor,
      addPerson,
      updatePerson,
      sharePerson,
      addOrganization,
      updateOrganization,
      deleteOrganization,
      markNotificationRead,
      snoozeNotification,
      pinNotification,
      clearNotifications,
      addComment,
      editComment,
      deleteComment,
      updateTaskMaterials,
      getTaskTotalCost,
      linkGoogleAccount,
      unlinkGoogleAccount,
      generateTaskSuggestions,
      acceptSuggestion,
      rejectSuggestion,
      
      appErrors,
      logError,
      fetchAppErrors,
      resolveError,
      analyzeError
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};