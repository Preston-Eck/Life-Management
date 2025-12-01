
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Person, Asset, ShoppingItem, Notification, ActivityLog, ShoppingStatus, Urgency, Comment, Material, Importance, TaskStatus } from '../types';
import { MOCK_TASKS, MOCK_PEOPLE, MOCK_ASSETS, MOCK_SHOPPING } from '../constants';

const generateIdHelper = () => Math.random().toString(36).substr(2, 9);

interface AppState {
  tasks: Task[];
  people: Person[];
  assets: Asset[];
  shoppingList: ShoppingItem[];
  currentUser: Person;
  notifications: Notification[];
  activityLog: ActivityLog[];
  
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  addSubtask: (parentId: string, title: string, description: string) => void;
  
  addAsset: (asset: Asset) => void;
  
  addShoppingItem: (item: ShoppingItem) => void;
  updateShoppingItem: (item: ShoppingItem) => void;
  processReceiptItems: (items: any[]) => void;
  
  addPerson: (person: Person) => void;
  updatePerson: (person: Person) => void;
  
  markNotificationRead: (id: string) => void;
  snoozeNotification: (id: string, until: Date) => void;
  pinNotification: (id: string) => void;
  clearNotifications: () => void;
  
  addComment: (taskId: string, text: string) => void;
  editComment: (taskId: string, commentId: string, newText: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  
  updateTaskMaterials: (taskId: string, materials: Material[]) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [people, setPeople] = useState<Person[]>(MOCK_PEOPLE);
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(MOCK_SHOPPING);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  // Simple current user mock
  const currentUser = people[0];

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

  // Check for notifications on load and when tasks change
  useEffect(() => {
    const newNotifs: Notification[] = [];
    
    // Check Overdue
    const today = new Date();
    tasks.forEach(t => {
      if (t.dueDate && new Date(t.dueDate) < today && t.status !== 'Completed') {
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

    // Mock Calendar Integration
    newNotifs.push({
      id: 'cal-1',
      type: 'System',
      title: 'Calendar Event',
      message: 'Family Dinner at 6:00 PM (from Google Calendar)',
      timestamp: new Date().toISOString(),
      isRead: false
    });

    // Mock Gmail Integration
    newNotifs.push({
      id: 'gmail-1',
      type: 'Alert',
      title: 'Important Email',
      message: 'Subject: Car Insurance Renewal - Action Required',
      timestamp: new Date().toISOString(),
      isRead: false
    });

    setNotifications(prev => {
      // Merge unique by ID
      const existingIds = new Set(prev.map(n => n.id));
      const uniqueNew = newNotifs.filter(n => !existingIds.has(n.id));
      return [...uniqueNew, ...prev];
    });
  }, [tasks]);

  const addTask = (task: Task) => {
    setTasks([...tasks, task]);
    logActivity("Created Task", task.title);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    logActivity("Updated Task", updatedTask.title);
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
      urgency: parent.urgency, // Inherit
      importance: parent.importance, // Inherit
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
  
  const addShoppingItem = (item: ShoppingItem) => setShoppingList([...shoppingList, item]);
  
  const updateShoppingItem = (item: ShoppingItem) => {
    setShoppingList(shoppingList.map(i => i.id === item.id ? item : i));
  };

  const processReceiptItems = (scannedItems: any[]) => {
    let updatedList = [...shoppingList];
    const newItems: ShoppingItem[] = [];

    scannedItems.forEach(scanned => {
      // Simple fuzzy match by name
      const existingIndex = updatedList.findIndex(
        i => i.status === ShoppingStatus.Need && i.name.toLowerCase().includes(scanned.name.toLowerCase())
      );

      if (existingIndex >= 0) {
        // Mark existing as acquired
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          status: ShoppingStatus.Acquired,
          unitPrice: scanned.unitPrice,
          totalCost: scanned.totalPrice,
          statusUpdatedDate: new Date().toISOString()
        };
        logActivity("Acquired Item", updatedList[existingIndex].name);
      } else {
        // Create new acquired item
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
    setPeople([...people, person]);
    logActivity("Added Person", `${person.firstName} ${person.lastName}`);
  };

  const updatePerson = (person: Person) => {
    setPeople(people.map(p => p.id === person.id ? person : p));
    logActivity("Updated Person", `${person.firstName} ${person.lastName}`);
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

    // Mention detection
    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
        const name = match[1].toLowerCase();
        // Try to find person by first name
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

  return (
    <AppContext.Provider value={{ 
      tasks, people, assets, shoppingList, currentUser, notifications, activityLog,
      addTask, updateTask, deleteTask, addSubtask, addAsset, addShoppingItem, updateShoppingItem, processReceiptItems,
      addPerson, updatePerson, markNotificationRead, snoozeNotification, pinNotification, clearNotifications, 
      addComment, editComment, deleteComment, updateTaskMaterials
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
