
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Person, Asset, ShoppingItem, Notification, ActivityLog, ShoppingStatus, Urgency, Comment, Material, Importance, TaskStatus, SharePermission, Organization, GoogleAccount, TaskSuggestion } from '../types';
import { MOCK_TASKS, MOCK_PEOPLE, MOCK_ASSETS, MOCK_SHOPPING, MOCK_ORGS, MOCK_GOOGLE_ACCOUNTS } from '../constants';
import { scanGoogleData } from '../services/gemini';

const generateIdHelper = () => Math.random().toString(36).substr(2, 9);

interface AppState {
  tasks: Task[];
  people: Person[];
  assets: Asset[];
  shoppingList: ShoppingItem[];
  currentUser: Person;
  notifications: Notification[];
  activityLog: ActivityLog[];
  organizations: Organization[];
  
  googleAccounts: GoogleAccount[];
  taskSuggestions: TaskSuggestion[];
  
  customFieldDefs: string[];
  addCustomFieldDef: (fieldName: string) => void;

  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (task: Task) => void; // Handles recurrence logic
  addSubtask: (parentId: string, title: string, description: string) => void;
  
  addAsset: (asset: Asset) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;
  updateAssetUsage: (assetId: string, usage: number) => void;
  
  addShoppingItem: (item: ShoppingItem) => void;
  updateShoppingItem: (item: ShoppingItem) => void;
  deleteShoppingItem: (id: string) => void;
  processReceiptItems: (items: any[]) => void;
  
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
  
  // Google Integrations
  linkGoogleAccount: (email: string) => void;
  unlinkGoogleAccount: (id: string) => void;
  generateTaskSuggestions: () => Promise<void>;
  acceptSuggestion: (suggestion: TaskSuggestion) => void;
  rejectSuggestion: (id: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

// Enhanced Inverse Logic including new types
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
    default: return type; // For custom types, default to symmetric
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [people, setPeople] = useState<Person[]>(MOCK_PEOPLE);
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(MOCK_SHOPPING);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>(MOCK_ORGS);
  
  // Google Integration State
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>(MOCK_GOOGLE_ACCOUNTS);
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([]);

  const [customFieldDefs, setCustomFieldDefs] = useState<string[]>(['Allergies', 'Dietary Restrictions', 'Favorite Color', 'Coffee Order']);

  const currentUser = people.find(p => p.isCurrentUser) || people[0];

  const logActivity = (action: string, entityName: string) => {
    const newLog: ActivityLog = {
      id: generateIdHelper(),
      action,
      entityName,
      timestamp: new Date().toISOString(),
      user: currentUser.firstName
    };
    setActivityLog(prev => [newLog, ...prev]);
  };

  useEffect(() => {
    // Initial notifications check
    const newNotifs: Notification[] = [];
    tasks.forEach(t => {
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
    });
    setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const uniqueNew = newNotifs.filter(n => !existingIds.has(n.id));
        return [...uniqueNew, ...prev];
    });
  }, [tasks.length]); // Simple dependency for demo

  const addCustomFieldDef = (fieldName: string) => {
    if (!customFieldDefs.includes(fieldName)) {
      setCustomFieldDefs([...customFieldDefs, fieldName]);
      logActivity("Added Global Field", fieldName);
    }
  };

  const addTask = (task: Task) => {
    setTasks([...tasks, task]);
    logActivity("Created Task", task.title);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    logActivity("Updated Task", updatedTask.title);
  };

  // Special handler for marking done to support Recurrence
  const completeTask = (task: Task) => {
      const updated = { ...task, status: TaskStatus.Completed };
      let newTasks = tasks.map(t => t.id === task.id ? updated : t);

      // Handle Recurrence
      if (task.recurrence) {
          const rule = task.recurrence;
          let nextDueDate = new Date();
          let shouldRecur = false;

          if (rule.type === 'Time') {
              shouldRecur = true;
              const interval = rule.interval || 1;
              const currentDue = task.dueDate ? new Date(task.dueDate) : new Date();
              
              if (rule.unit === 'day') nextDueDate.setDate(currentDue.getDate() + interval);
              if (rule.unit === 'week') nextDueDate.setDate(currentDue.getDate() + (interval * 7));
              if (rule.unit === 'month') nextDueDate.setMonth(currentDue.getMonth() + interval);
              if (rule.unit === 'year') nextDueDate.setFullYear(currentDue.getFullYear() + interval);
          }
          // Note: Usage based recurrence is handled in updateAssetUsage usually, but if it's "Every X miles" and we just finished it, 
          // we might want to reset the 'lastUsageReading' on the task rule
          
          if (rule.type === 'Usage' && task.assetId) {
             // For usage tasks, we don't necessarily create a NEW task with a date immediately, 
             // but we reset the tracking. Or we create a pending task waiting for the trigger.
             // Strategy: Reset this task to Pending and update its lastUsageReading to current asset usage
             const asset = assets.find(a => a.id === task.assetId);
             if (asset && asset.currentUsage !== undefined) {
                 shouldRecur = true;
                 updated.status = TaskStatus.Completed; // Keep old one completed
                 // Prepare logic below to create new
             }
          }

          if (shouldRecur) {
             const nextTask: Task = {
                 ...task,
                 id: generateIdHelper(),
                 status: TaskStatus.Pending,
                 dueDate: rule.type === 'Time' ? nextDueDate.toISOString() : undefined,
                 recurrence: rule.type === 'Usage' ? { ...rule, lastUsageReading: assets.find(a=>a.id === task.assetId)?.currentUsage || 0 } : rule,
                 comments: [], // Clear comments for new instance
             };
             newTasks.push(nextTask);
             logActivity("Recurrence Triggered", nextTask.title);
          }
      }
      
      setTasks(newTasks);
      logActivity("Completed Task", task.title);
  };
  
  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    logActivity("Deleted Task", "Task ID: " + taskId);
  };

  const addSubtask = (parentId: string, title: string, description: string) => {
    const parent = tasks.find(t => t.id === parentId);
    if (!parent) return;

    const newSubtask: Task = {
      id: generateIdHelper(),
      ownerId: currentUser.id,
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
      comments: []
    };

    const updatedParent = {
      ...parent,
      subtaskIds: [...parent.subtaskIds, newSubtask.id]
    };

    setTasks([...tasks.map(t => t.id === parentId ? updatedParent : t), newSubtask]);
    logActivity("Added Subtask", title);
  };

  const addAsset = (asset: Asset) => {
    setAssets([...assets, asset]);
    logActivity("Added Asset", asset.name);
  };

  const updateAsset = (asset: Asset) => {
    setAssets(assets.map(a => a.id === asset.id ? asset : a));
    logActivity("Updated Asset", asset.name);
  };

  const updateAssetUsage = (assetId: string, usage: number) => {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) return;
      
      const newAsset = { ...asset, currentUsage: usage };
      setAssets(assets.map(a => a.id === assetId ? newAsset : a));
      logActivity("Updated Usage", `${asset.name}: ${usage} ${asset.usageUnit}`);

      // Check for Usage-based Recurrence triggers
      tasks.forEach(t => {
          if (t.recurrence && t.recurrence.type === 'Usage' && t.recurrence.assetId === assetId && t.status !== TaskStatus.Completed) {
              const rule = t.recurrence;
              const lastReading = rule.lastUsageReading || 0;
              const threshold = rule.usageThreshold || 0;
              
              if (usage - lastReading >= threshold) {
                  // Trigger Alert or Status Change
                  if (t.status === TaskStatus.Pending) {
                      // It's due now!
                      // For this prototype, we'll just send a notification, as the task exists
                      setNotifications(prev => [...prev, {
                          id: generateIdHelper(),
                          type: 'Alert',
                          title: 'Maintenance Due',
                          message: `Task "${t.title}" is due based on usage.`,
                          timestamp: new Date().toISOString(),
                          isRead: false,
                          linkTo: `/tasks/${t.id}`
                      }]);
                      updateTask({ ...t, urgency: Urgency.Urgent }); // Bump urgency
                  }
              }
          }
      });
  };

  const deleteAsset = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
    logActivity("Deleted Asset", id);
  };
  
  const addShoppingItem = (item: ShoppingItem) => setShoppingList([...shoppingList, item]);
  
  const updateShoppingItem = (item: ShoppingItem) => {
    setShoppingList(shoppingList.map(i => i.id === item.id ? item : i));
  };

  const deleteShoppingItem = (id: string) => {
    setShoppingList(shoppingList.filter(i => i.id !== id));
  }

  const processReceiptItems = (scannedItems: any[]) => {
    let updatedList = [...shoppingList];
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

    setShoppingList([...updatedList, ...newItems]);
  };

  const addPerson = (person: Person) => {
    setPeople(prev => {
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
    setPeople(prevPeople => {
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
    setPeople(prev => prev.map(p => {
        if(p.id !== personId) return p;
        const existingShareIndex = p.sharedWith.findIndex(s => s.userId === shareData.userId);
        let newShares = [...p.sharedWith];
        
        if (existingShareIndex >= 0) {
            newShares[existingShareIndex] = shareData;
        } else {
            newShares.push(shareData);
        }
        return { ...p, sharedWith: newShares };
    }));
    logActivity("Shared Person Profile", "Shared profile with " + shareData.userId);
  };

  const addOrganization = (org: Organization) => {
    setOrganizations([...organizations, org]);
    logActivity("Added Organization", org.name);
  };

  const updateOrganization = (org: Organization) => {
    setOrganizations(organizations.map(o => o.id === org.id ? org : o));
    logActivity("Updated Organization", org.name);
  };

  const deleteOrganization = (id: string) => {
    setOrganizations(organizations.filter(o => o.id !== id));
    logActivity("Deleted Organization", id);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const snoozeNotification = (id: string, until: Date) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, snoozedUntil: until.toISOString() } : n));
  };

  const pinNotification = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addComment = (taskId: string, text: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newComment: Comment = {
      id: generateIdHelper(),
      authorId: currentUser.id,
      text,
      timestamp: new Date().toISOString(),
      isRead: false,
      isPinned: false
    };

    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
        const name = match[1].toLowerCase();
        const mentionedPerson = people.find(p => p.firstName.toLowerCase() === name);
        if (mentionedPerson) {
             const mentionNotif: Notification = {
                 id: generateIdHelper(),
                 type: 'Mention',
                 title: 'You were mentioned',
                 message: `${currentUser.firstName} mentioned you in "${task.title}"`,
                 timestamp: new Date().toISOString(),
                 isRead: false,
                 linkTo: `/tasks/${task.id}`,
                 actionRequired: true
             };
             setNotifications(prev => [mentionNotif, ...prev]);
        }
    }

    const updatedTask = {
      ...task,
      comments: [...task.comments, newComment]
    };
    updateTask(updatedTask);
    logActivity("Commented on", task.title);
  };

  const editComment = (taskId: string, commentId: string, newText: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedComments = task.comments.map(c => c.id === commentId ? { ...c, text: newText } : c);
    updateTask({ ...task, comments: updatedComments });
  };

  const deleteComment = (taskId: string, commentId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedComments = task.comments.filter(c => c.id !== commentId);
    updateTask({ ...task, comments: updatedComments });
  };

  const updateTaskMaterials = (taskId: string, materials: Material[]) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateTask({ ...task, materials });
  };

  // --- Google Account Logic ---
  const linkGoogleAccount = (email: string) => {
      const newAcc: GoogleAccount = {
          id: generateIdHelper(),
          email,
          services: ['Gmail', 'Calendar', 'Drive'],
          lastSync: new Date().toISOString()
      };
      setGoogleAccounts([...googleAccounts, newAcc]);
      logActivity('Linked Account', email);
  };

  const unlinkGoogleAccount = (id: string) => {
      setGoogleAccounts(googleAccounts.filter(a => a.id !== id));
  };

  const generateTaskSuggestions = async () => {
      const accounts = googleAccounts.map(a => a.email);
      const suggestions = await scanGoogleData(accounts);
      
      // Filter out duplicates that match existing tasks by title
      const uniqueSuggestions = suggestions.filter(s => 
          !tasks.some(t => t.title.toLowerCase() === s.title.toLowerCase())
      );
      
      setTaskSuggestions(uniqueSuggestions);
  };

  const acceptSuggestion = (suggestion: TaskSuggestion) => {
      const newTask: Task = {
          id: generateIdHelper(),
          ownerId: currentUser.id,
          title: suggestion.title,
          description: suggestion.description,
          status: TaskStatus.Pending,
          urgency: Urgency.Medium,
          importance: Importance.High,
          subtaskIds: [],
          prerequisiteIds: [],
          assigneeIds: [currentUser.id],
          collaboratorIds: [],
          comments: [],
          materials: [],
          context: 'Personal',
          dueDate: suggestion.dueDate
      };
      addTask(newTask);
      setTaskSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      logActivity('Accepted Suggestion', suggestion.title);
  };

  const rejectSuggestion = (id: string) => {
      setTaskSuggestions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <AppContext.Provider value={{ 
      tasks, people, assets, shoppingList, currentUser, notifications, activityLog, organizations, customFieldDefs,
      googleAccounts, taskSuggestions,
      addCustomFieldDef,
      addTask, updateTask, deleteTask, completeTask, addSubtask, addAsset, updateAsset, deleteAsset, updateAssetUsage,
      addShoppingItem, updateShoppingItem, deleteShoppingItem, processReceiptItems,
      addPerson, updatePerson, sharePerson, addOrganization, updateOrganization, deleteOrganization,
      markNotificationRead, snoozeNotification, pinNotification, clearNotifications, 
      addComment, editComment, deleteComment, updateTaskMaterials,
      linkGoogleAccount, unlinkGoogleAccount, generateTaskSuggestions, acceptSuggestion, rejectSuggestion
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};
