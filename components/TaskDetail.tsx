

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/AppContext';
import { TaskStatus, Urgency, Importance, Comment, Material, RecurrenceRule, ShoppingStatus, ShoppingItem, Attachment } from '../types';
import { 
  ArrowLeft, Calendar, MapPin, Users, Truck, CheckSquare, 
  MessageSquare, Send, Save, Trash2, ShoppingBag, AlertCircle, Edit2, Plus, X, Check, Repeat, Wand2, PackageCheck, Paperclip, Camera, FileText, Clock as ClockIcon, DollarSign
} from 'lucide-react';
import { generateSubtasks, estimateMaterials } from '../services/gemini';

// --- Subtask Modal ---
const AddSubtaskModal = ({ onClose, onSave }: { onClose: () => void, onSave: (t: string, d: string) => void }) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) onSave(title, desc);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-96 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Add Subtask</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Subtask Title" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={title} onChange={e => setTitle(e.target.value)} autoFocus required />
                    <textarea placeholder="Description (Optional)" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white h-24" value={desc} onChange={e => setDesc(e.target.value)} />
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold">Add Subtask</button>
                </form>
            </div>
        </div>
    );
};

// --- Material Modal ---
const MaterialModal = ({ onClose, onSave, initialMaterial }: { onClose: () => void, onSave: (m: Material) => void, initialMaterial?: Material }) => {
    const [name, setName] = useState(initialMaterial?.name || '');
    const [quantity, setQuantity] = useState(initialMaterial?.quantity || 1);
    const [unit, setUnit] = useState(initialMaterial?.unit || 'pc');
    const [isOnHand, setIsOnHand] = useState(initialMaterial?.isOnHand || false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave({
                id: initialMaterial?.id || Math.random().toString(36).substr(2, 9),
                name, quantity, unit, isOnHand,
                shoppingItemId: initialMaterial?.shoppingItemId
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-96 shadow-2xl">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">{initialMaterial ? 'Edit Material' : 'Add Material'}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Material Name" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={name} onChange={e => setName(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Qty" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                        <input type="text" placeholder="Unit" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={unit} onChange={e => setUnit(e.target.value)} />
                    </div>
                    <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={isOnHand} onChange={e => setIsOnHand(e.target.checked)} className="rounded border-slate-700 bg-slate-800 text-indigo-600" />
                        <span>Is On Hand?</span>
                    </label>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold">Save Material</button>
                </form>
            </div>
        </div>
    );
};

// --- Materials Review Modal ---
const MaterialsReviewModal = ({ 
    suggestions, 
    onClose, 
    onConfirm 
}: { 
    suggestions: any[], 
    onClose: () => void, 
    onConfirm: (items: any[]) => void
}) => {
    const [items, setItems] = useState(suggestions);

    const toggleSelect = (index: number) => {
        const newItems = [...items];
        newItems[index].selected = !newItems[index].selected;
        setItems(newItems);
    }
    
    const toggleHand = (index: number) => {
        const newItems = [...items];
        newItems[index].isOnHand = !newItems[index].isOnHand;
        setItems(newItems);
    }

    const handleConfirm = () => {
        onConfirm(items);
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                 <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                    <div>
                        <h3 className="font-bold text-white text-lg flex items-center">
                            <Wand2 size={20} className="mr-2 text-purple-400"/> AI Material Suggestions
                        </h3>
                        <p className="text-sm text-slate-400">Review materials to add to your task and shopping list.</p>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-white"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-4">
                    {items.map((item, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${item.selected ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900 border-slate-800 opacity-60'}`}>
                            <div className="flex items-center space-x-4">
                                <input type="checkbox" checked={item.selected} onChange={() => toggleSelect(idx)} className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-indigo-600" />
                                <div>
                                    <p className="font-bold text-white">{item.name}</p>
                                    <p className="text-xs text-slate-400">
                                        {item.quantity} {item.unit} • Est. ${item.estimatedPrice} ea
                                    </p>
                                    {item.existingItem && (
                                        <div className="mt-1 flex items-center text-xs text-blue-400">
                                            <PackageCheck size={12} className="mr-1"/> Found in Shopping List ({item.existingItem.status})
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2 text-xs font-bold uppercase cursor-pointer">
                                    <span className={item.isOnHand ? 'text-emerald-400' : 'text-slate-500'}>{item.isOnHand ? 'Have It' : 'Need It'}</span>
                                    <div 
                                        onClick={() => toggleHand(idx)}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${item.isOnHand ? 'bg-emerald-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${item.isOnHand ? 'left-6' : 'left-1'}`}></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                    <button onClick={handleConfirm} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold flex items-center">
                        <Plus size={18} className="mr-2" /> Add Selected
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Recurrence Modal ---
const RecurrenceModal = ({ task, onClose, onSave }: { task: any, onClose: () => void, onSave: (r: RecurrenceRule | undefined) => void }) => {
    const [isEnabled, setIsEnabled] = useState(!!task.recurrence);
    const [type, setType] = useState<'Time' | 'Usage'>(task.recurrence?.type || 'Time');
    const [interval, setInterval] = useState(task.recurrence?.interval || 1);
    const [unit, setUnit] = useState(task.recurrence?.unit || 'week');
    const [usageThreshold, setUsageThreshold] = useState(task.recurrence?.usageThreshold || 5000);
    
    // Usage Check Reminder fields
    const [usageCheckInterval, setUsageCheckInterval] = useState(task.recurrence?.usageCheckInterval || 1);
    const [usageCheckUnit, setUsageCheckUnit] = useState(task.recurrence?.usageCheckUnit || 'month');

    // End Conditions
    const [endCondition, setEndCondition] = useState<'Never' | 'Date' | 'Count'>(task.recurrence?.endCondition || 'Never');
    const [endDate, setEndDate] = useState(task.recurrence?.endDate || '');
    const [endCount, setEndCount] = useState(task.recurrence?.endCount || 5);

    const handleSubmit = () => {
        if (!isEnabled) {
            onSave(undefined);
            onClose();
            return;
        }

        const rule: RecurrenceRule = { 
            type,
            endCondition,
            endDate: endCondition === 'Date' ? endDate : undefined,
            endCount: endCondition === 'Count' ? endCount : undefined,
            currentCount: task.recurrence?.currentCount || 0
        };

        if (type === 'Time') {
            rule.interval = interval;
            rule.unit = unit;
        } else {
            rule.assetId = task.assetId;
            rule.usageThreshold = usageThreshold;
            rule.lastUsageReading = 0; 
            // Save Reminder Settings
            rule.usageCheckInterval = usageCheckInterval;
            rule.usageCheckUnit = usageCheckUnit;
        }
        onSave(rule);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-96 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Repeat Task</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                
                <div className="space-y-6">
                     <label className="flex items-center space-x-2 text-white font-bold p-2 bg-slate-800 rounded">
                        <input type="checkbox" checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} className="rounded bg-slate-700 border-slate-600 w-4 h-4 text-indigo-600" />
                        <span>Enable Recurrence</span>
                    </label>

                    {isEnabled && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Recurrence Type</label>
                                <div className="flex space-x-2 bg-slate-800 p-1 rounded">
                                    <button onClick={() => setType('Time')} className={`flex-1 py-1 rounded text-sm font-bold transition-colors ${type === 'Time' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Time Based</button>
                                    <button onClick={() => setType('Usage')} className={`flex-1 py-1 rounded text-sm font-bold transition-colors ${type === 'Usage' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} disabled={!task.assetId}>Asset Usage</button>
                                </div>
                            </div>

                            {type === 'Time' ? (
                                <div className="flex space-x-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-slate-400">Every</span>
                                        <input type="number" min="1" className="w-16 bg-slate-800 border border-slate-700 rounded p-1 text-white" value={interval} onChange={e => setInterval(Number(e.target.value))} />
                                    </div>
                                    <select className="flex-1 bg-slate-800 border border-slate-700 rounded p-1 text-white" value={unit} onChange={e => setUnit(e.target.value as any)}>
                                        <option value="day">Day(s)</option>
                                        <option value="week">Week(s)</option>
                                        <option value="month">Month(s)</option>
                                        <option value="year">Year(s)</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-2">Repeat every time asset is used:</p>
                                        <div className="flex items-center space-x-2">
                                            <input type="number" className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white" value={usageThreshold} onChange={e => setUsageThreshold(Number(e.target.value))} />
                                            <span className="text-sm text-slate-400">Units (Miles/Hrs)</span>
                                        </div>
                                    </div>
                                    
                                    {/* Usage Check Reminder Config */}
                                    <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Usage Check Reminder</label>
                                        <p className="text-[10px] text-slate-500 mb-2">Remind me to check the odometer/usage every:</p>
                                        <div className="flex space-x-2">
                                            <input 
                                                type="number" 
                                                min="1" 
                                                className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-white text-center" 
                                                value={usageCheckInterval} 
                                                onChange={e => setUsageCheckInterval(Number(e.target.value))} 
                                            />
                                            <select 
                                                className="flex-1 bg-slate-900 border border-slate-700 rounded p-1 text-white" 
                                                value={usageCheckUnit} 
                                                onChange={e => setUsageCheckUnit(e.target.value as any)}
                                            >
                                                <option value="day">Day(s)</option>
                                                <option value="week">Week(s)</option>
                                                <option value="month">Month(s)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-slate-800 pt-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">End Condition</label>
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="endCondition" 
                                            checked={endCondition === 'Never'} 
                                            onChange={() => setEndCondition('Never')} 
                                            className="text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-600"
                                        />
                                        <span className="text-slate-300 text-sm">Never</span>
                                    </label>
                                    
                                    <div className="flex items-center space-x-2">
                                         <label className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="endCondition" 
                                                checked={endCondition === 'Date'} 
                                                onChange={() => setEndCondition('Date')} 
                                                className="text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-600"
                                            />
                                            <span className="text-slate-300 text-sm">On Date</span>
                                        </label>
                                        {endCondition === 'Date' && (
                                            <input 
                                                type="date" 
                                                value={endDate} 
                                                onChange={e => setEndDate(e.target.value)} 
                                                className="bg-slate-800 border border-slate-700 rounded p-1 text-xs text-white"
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                         <label className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="endCondition" 
                                                checked={endCondition === 'Count'} 
                                                onChange={() => setEndCondition('Count')} 
                                                className="text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-600"
                                            />
                                            <span className="text-slate-300 text-sm">After</span>
                                        </label>
                                        {endCondition === 'Count' && (
                                            <div className="flex items-center space-x-1">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={endCount} 
                                                    onChange={e => setEndCount(Number(e.target.value))} 
                                                    className="w-16 bg-slate-800 border border-slate-700 rounded p-1 text-xs text-white"
                                                />
                                                <span className="text-xs text-slate-500">occurrences</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <button onClick={handleSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold transition-colors">Save Configuration</button>
                </div>
            </div>
        </div>
    );
};

// --- Comment Component ---

interface CommentItemProps {
    comment: Comment;
    taskOwnerId: string;
    onDelete: (id: string) => void;
    onEdit: (id: string, text: string) => void;
    getPersonName: (id: string) => string;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
    comment, 
    taskOwnerId, 
    onDelete, 
    onEdit, 
    getPersonName 
}) => {
    const { currentUser } = useAppStore();
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(comment.text);

    const isAuthor = currentUser.id === comment.authorId;
    const isOwner = currentUser.id === taskOwnerId;

    const handleSave = () => {
        if(text.trim()) {
            onEdit(comment.id, text);
            setIsEditing(false);
        }
    };

    const renderText = (txt: string) => {
        const parts = txt.split(/(@\w+)/g);
        return parts.map((part, i) => 
            part.startsWith('@') 
            ? <span key={i} className="text-indigo-400 font-semibold">{part}</span> 
            : <span key={i}>{part}</span>
        );
    };

    return (
        <div className="bg-slate-800/30 p-3 rounded-lg group">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-indigo-400">{getPersonName(comment.authorId)}</span>
                <div className="flex items-center space-x-2">
                     <span className="text-xs text-slate-500">{new Date(comment.timestamp).toLocaleString()}</span>
                     {!isEditing && (
                         <>
                            {isAuthor && (
                                <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit2 size={12} />
                                </button>
                            )}
                            {(isAuthor || isOwner) && (
                                <button onClick={() => onDelete(comment.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                </button>
                            )}
                         </>
                     )}
                </div>
            </div>
            {isEditing ? (
                <div className="mt-2">
                    <input 
                        type="text" 
                        value={text} 
                        onChange={e => setText(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        autoFocus
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={() => setIsEditing(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
                        <button onClick={handleSave} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">Save</button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-slate-300">{renderText(comment.text)}</p>
            )}
        </div>
    );
};


export const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { 
      tasks, updateTask, deleteTask, completeTask, people, assets, currentUser, shoppingList, addShoppingItem,
      addComment, editComment, deleteComment, addSubtask, updateTaskMaterials, getTaskTotalCost
  } = useAppStore();
  
  const task = tasks.find(t => t.id === taskId);
  
  // UI States
  const [commentText, setCommentText] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState('');
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  const [showAssigneeSelect, setShowAssigneeSelect] = useState(false);

  // AI States
  const [isSuggestingSubtasks, setIsSuggestingSubtasks] = useState(false);
  const [isSuggestingMaterials, setIsSuggestingMaterials] = useState(false);
  const [suggestedMaterials, setSuggestedMaterials] = useState<any[]>([]);
  const [showMaterialsReview, setShowMaterialsReview] = useState(false);

  if (!task) return <div className="p-8 text-white">Task not found</div>;

  const subtasks = tasks.filter(t => task.subtaskIds.includes(t.id));
  const linkedAsset = assets.find(a => a.id === task.assetId);
  const totalCost = getTaskTotalCost(task.id);

  // Handlers
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    if (newStatus === TaskStatus.Completed) {
        completeTask(task);
    } else {
        updateTask({ ...task, status: newStatus });
    }
  };

  const handleUrgencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTask({ ...task, urgency: Number(e.target.value) as Urgency });
  };

  const handleImportanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTask({ ...task, importance: Number(e.target.value) as Importance });
  };
  
  const handleContextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTask({ ...task, context: e.target.value as any });
  };
  
  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTask({ ...task, assetId: e.target.value || undefined });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      navigate('/tasks');
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(task.id, commentText);
    setCommentText('');
  };

  const saveDescription = () => {
      updateTask({ ...task, description: descText });
      setIsEditingDesc(false);
  };

  const startEditDesc = () => {
      setDescText(task.description);
      setIsEditingDesc(true);
  };

  const handleAddSubtask = (title: string, desc: string) => {
      addSubtask(task.id, title, desc);
      setShowSubtaskModal(false);
  };

  const handleAISubtasks = async () => {
      setIsSuggestingSubtasks(true);
      try {
        const results = await generateSubtasks(task.title, task.description);
        results.forEach(r => addSubtask(task.id, r.title, r.description));
      } catch (error) {
          console.error(error);
          alert("Failed to generate subtasks");
      } finally {
        setIsSuggestingSubtasks(false);
      }
  };

  const handleAIMaterials = async () => {
      setIsSuggestingMaterials(true);
      try {
        const results = await estimateMaterials(task.title);
        const processed = results.map(r => {
            // Check for match in global shopping list
            const existing = shoppingList.find(s => s.name.toLowerCase() === r.name.toLowerCase());
            
            let isOnHand = false;
            // If we already have it in shopping list and it's Acquired, assume on hand.
            if (existing && existing.status === ShoppingStatus.Acquired) {
                isOnHand = true;
            }

            return {
                ...r,
                selected: true,
                isOnHand,
                existingItem: existing
            };
        });
        setSuggestedMaterials(processed);
        setShowMaterialsReview(true);
      } catch (error) {
          console.error(error);
          alert("Failed to suggest materials");
      } finally {
        setIsSuggestingMaterials(false);
      }
  };

  const confirmMaterials = (reviewedItems: any[]) => {
      const newMaterials: Material[] = [];

      reviewedItems.filter(i => i.selected).forEach(i => {
          const matId = Math.random().toString(36).substr(2, 9);
          // Don't create shopping item here directly, let Store handle sync
          newMaterials.push({
              id: matId,
              name: i.name,
              quantity: i.quantity,
              unit: i.unit,
              isOnHand: i.isOnHand,
              shoppingItemId: i.existingItem?.id // Pass link if exists
          });
      });
      
      // Update Store which triggers sync
      updateTaskMaterials(task.id, [...task.materials, ...newMaterials]);
      setShowMaterialsReview(false);
  };

  const handleSaveMaterial = (mat: Material) => {
      let newMaterials = [...task.materials];
      if (editingMaterial) {
          newMaterials = newMaterials.map(m => m.id === mat.id ? mat : m);
      } else {
          newMaterials.push(mat);
      }
      updateTaskMaterials(task.id, newMaterials);
      setShowMaterialModal(false);
      setEditingMaterial(null);
  };

  const handleDeleteMaterial = (id: string) => {
      if(confirm('Remove this material?')) {
        updateTaskMaterials(task.id, task.materials.filter(m => m.id !== id));
      }
  };
  
  const handleSaveRecurrence = (rule: RecurrenceRule | undefined) => {
      updateTask({ ...task, recurrence: rule });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                const newAtt: Attachment = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: file.type.startsWith('image') ? 'Image' : 'File',
                    name: file.name,
                    url: base64,
                    uploadedAt: new Date().toISOString()
                };
                updateTask({ ...task, attachments: [...(task.attachments || []), newAtt] });
            };
            reader.readAsDataURL(file);
      }
  };
  
  const removeAttachment = (id: string) => {
      if(confirm('Delete this attachment?')) {
        updateTask({ ...task, attachments: (task.attachments || []).filter(a => a.id !== id) });
      }
  };

  const getPersonName = (id: string) => {
    const p = people.find(person => person.id === id);
    return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
  };
  
  const addAssignee = (id: string) => {
      if (id && !task.assigneeIds.includes(id)) {
          updateTask({ ...task, assigneeIds: [...task.assigneeIds, id] });
      }
  };

  const removeAssignee = (id: string) => {
      updateTask({ ...task, assigneeIds: task.assigneeIds.filter(pid => pid !== id) });
  };

  const getEnumKeys = (e: any) => Object.keys(e).filter(k => !isNaN(Number(k)));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate('/tasks')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
             <h1 className="text-3xl font-bold text-white">{task.title}</h1>
             <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                 task.status === TaskStatus.Completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
             }`}>
                {task.status}
             </span>
          </div>
          <p className="text-slate-400 mt-1">{task.context} Project</p>
        </div>
        <div className="flex space-x-2">
            <button onClick={handleDelete} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
               <Trash2 size={20} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Description Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative group">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-white">Description</h3>
                 {!isEditingDesc && (
                     <button onClick={startEditDesc} className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
                         <Edit2 size={16} />
                     </button>
                 )}
            </div>
            {isEditingDesc ? (
                <div className="space-y-3">
                    <textarea 
                        className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white h-32 focus:outline-none focus:border-indigo-500"
                        value={descText}
                        onChange={e => setDescText(e.target.value)}
                    />
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setIsEditingDesc(false)} className="px-3 py-1 text-slate-400 hover:text-white">Cancel</button>
                        <button onClick={saveDescription} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded">Save</button>
                    </div>
                </div>
            ) : (
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{task.description || "No description provided."}</p>
            )}
          </div>
          
          {/* Attachments Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Paperclip size={20} className="mr-2 text-slate-400"/> Attachments
                  </h3>
                  <div className="flex space-x-2">
                        <label className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer">
                            <Camera size={20} />
                            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                        </label>
                         <label className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer">
                            <Plus size={20} />
                            <input type="file" onChange={handleFileChange} className="hidden" />
                        </label>
                  </div>
              </div>
              
              {task.attachments && task.attachments.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                      {task.attachments.map(att => (
                          <div key={att.id} className="bg-slate-800 border border-slate-700 rounded p-2 flex items-center justify-between">
                              <div className="flex items-center space-x-2 overflow-hidden">
                                  {att.type === 'Image' ? <Edit2 size={16} className="text-indigo-400 flex-shrink-0" /> : <FileText size={16} className="text-slate-400 flex-shrink-0"/>}
                                  <a href={att.url} download={att.name} className="text-sm text-white truncate hover:underline">{att.name}</a>
                              </div>
                              <button onClick={() => removeAttachment(att.id)} className="text-slate-500 hover:text-red-400"><X size={14}/></button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-slate-500 italic text-sm">No attachments.</p>
              )}
          </div>

          {/* Subtasks Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                    <CheckSquare size={20} className="mr-2 text-indigo-400"/> Subtasks
                </h3>
                <div className="flex space-x-2">
                    <button 
                        onClick={handleAISubtasks} 
                        className="text-purple-400 hover:text-purple-300 p-1 rounded hover:bg-purple-500/10 transition-colors"
                        title="AI Suggest Subtasks"
                        disabled={isSuggestingSubtasks}
                    >
                        {isSuggestingSubtasks ? <div className="animate-spin w-4 h-4 border-2 border-purple-500 rounded-full border-t-transparent"></div> : <Wand2 size={20} />}
                    </button>
                    <button onClick={() => setShowSubtaskModal(true)} className="text-indigo-400 hover:text-indigo-300 p-1 rounded hover:bg-indigo-500/10 transition-colors">
                        <Plus size={20} />
                    </button>
                </div>
            </div>
            {subtasks.length > 0 ? (
                <div className="space-y-2">
                    {subtasks.map(st => (
                        <div key={st.id} className="flex items-center space-x-2 group">
                             <Link to={`/tasks/${st.id}`} className="flex-1 block p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-center">
                                    <span className={st.status === TaskStatus.Completed ? "line-through text-slate-500" : "text-slate-200"}>{st.title}</span>
                                    <span className="text-xs text-slate-500">{st.status}</span>
                                </div>
                                <div className="mt-1 flex justify-end">
                                    <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">Subtask Cost: ${getTaskTotalCost(st.id).toFixed(2)}</span>
                                </div>
                             </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-500 italic">No subtasks found.</p>
            )}
          </div>

          {/* Materials Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-white flex items-center">
                        <ShoppingBag size={20} className="mr-2 text-emerald-400"/> Materials & Costs
                    </h3>
                    <div className="bg-slate-800 px-3 py-1.5 rounded border border-slate-700 shadow-sm flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Task Cost</span>
                        <span className="text-lg text-emerald-400 font-bold leading-none">${totalCost.toFixed(2)}</span>
                    </div>
                </div>
                <div className="flex space-x-2">
                     <button 
                        onClick={handleAIMaterials} 
                        className="text-purple-400 hover:text-purple-300 p-1 rounded hover:bg-purple-500/10 transition-colors"
                        title="AI Suggest Materials"
                        disabled={isSuggestingMaterials}
                    >
                        {isSuggestingMaterials ? <div className="animate-spin w-4 h-4 border-2 border-purple-500 rounded-full border-t-transparent"></div> : <Wand2 size={20} />}
                    </button>
                    <button 
                        onClick={() => { setEditingMaterial(null); setShowMaterialModal(true); }} 
                        className="text-emerald-400 hover:text-emerald-300 p-1 rounded hover:bg-emerald-500/10 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
            {task.materials.length > 0 ? (
                <div className="space-y-3">
                    {task.materials.map(mat => (
                        <div key={mat.id} className="flex justify-between items-center p-2 border-b border-slate-800 last:border-0 group hover:bg-slate-800/30 rounded transition-colors">
                            <div>
                                <p className="text-slate-200 font-medium">{mat.name}</p>
                                <p className="text-xs text-slate-500">{mat.quantity} {mat.unit}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className={`px-2 py-1 rounded text-xs ${mat.isOnHand ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                    {mat.isOnHand ? 'On Hand' : 'Need'}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                                    <button onClick={() => { setEditingMaterial(mat); setShowMaterialModal(true); }} className="p-1 text-slate-400 hover:text-white"><Edit2 size={14}/></button>
                                    <button onClick={() => handleDeleteMaterial(mat.id)} className="p-1 text-slate-400 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-500 italic">No materials listed.</p>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
             <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <MessageSquare size={20} className="mr-2 text-blue-400"/> Comments
             </h3>
             <div className="space-y-4 mb-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                 {task.comments.map(comment => (
                     <CommentItem 
                        key={comment.id} 
                        comment={comment} 
                        taskOwnerId={task.ownerId}
                        getPersonName={getPersonName}
                        onDelete={(id) => deleteComment(task.id, id)}
                        onEdit={(id, txt) => editComment(task.id, id, txt)}
                     />
                 ))}
                 {task.comments.length === 0 && <p className="text-sm text-slate-500">No comments yet. Mention someone with @Name.</p>}
             </div>
             <form onSubmit={handlePostComment} className="flex gap-2">
                 <input 
                    type="text" 
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment... (@Name to mention)"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                 />
                 <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg">
                     <Send size={20} />
                 </button>
             </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                    <select 
                        value={task.status} 
                        onChange={handleStatusChange}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
                    >
                        {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Context</label>
                    <select 
                        value={task.context} 
                        onChange={handleContextChange}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
                    >
                        <option value="Personal">Personal</option>
                        <option value="Work">Work</option>
                        <option value="Family">Family</option>
                        <option value="School">School</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time Estimate (Hours)</label>
                    <div className="flex items-center text-slate-300 bg-slate-800 p-2 rounded border border-slate-700">
                        <ClockIcon size={16} className="mr-2 text-slate-400" />
                        <input 
                            type="number" 
                            step="0.5"
                            value={task.timeEstimate || 1}
                            onChange={(e) => updateTask({...task, timeEstimate: Number(e.target.value)})}
                            className="bg-transparent w-full outline-none text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Urgency</label>
                        <select 
                            value={task.urgency} 
                            onChange={handleUrgencyChange}
                            className={`w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm font-bold focus:outline-none ${
                                task.urgency >= Urgency.Medium ? 'text-red-400' : 'text-slate-300'
                            }`}
                        >
                            {getEnumKeys(Urgency).map(key => (
                                <option key={key} value={key}>{Urgency[Number(key)]}</option>
                            ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Importance</label>
                        <select 
                            value={task.importance} 
                            onChange={handleImportanceChange}
                            className={`w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm font-bold focus:outline-none ${
                                task.importance >= Importance.High ? 'text-amber-400' : 'text-slate-300'
                            }`}
                        >
                            {getEnumKeys(Importance).map(key => (
                                <option key={key} value={key}>{Importance[Number(key)]}</option>
                            ))}
                        </select>
                     </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                    <div className="flex items-center text-slate-300 bg-slate-800 p-2 rounded border border-slate-700">
                        <Calendar size={16} className="mr-2 text-slate-400" />
                        <input 
                            type="date"
                            value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                            onChange={(e) => updateTask({...task, dueDate: e.target.value})}
                            className="bg-transparent w-full outline-none text-white uppercase"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Repeat</label>
                    <button 
                        onClick={() => setShowRecurrenceModal(true)}
                        className="w-full flex items-center justify-between bg-slate-800 p-2 rounded text-slate-300 hover:bg-slate-700"
                    >
                        <span className="text-sm flex items-center">
                            <Repeat size={16} className="mr-2" />
                            {task.recurrence ? (
                                task.recurrence.type === 'Time' 
                                ? `Every ${task.recurrence.interval} ${task.recurrence.unit}` 
                                : `Every ${task.recurrence.usageThreshold} (Usage)`
                            ) : 'Does not repeat'}
                        </span>
                        <Edit2 size={12} />
                    </button>
                </div>

                <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                     <div className="flex items-center text-slate-300 bg-slate-800 p-2 rounded border border-slate-700">
                        <MapPin size={16} className="mr-2 text-slate-400" />
                        <input 
                            type="text"
                            value={task.location || ''}
                            onChange={(e) => updateTask({...task, location: e.target.value})}
                            className="bg-transparent flex-1 outline-none text-white placeholder-slate-500 min-w-0"
                            placeholder="Location"
                        />
                        <span className="text-slate-600 mx-2">/</span>
                         <input 
                            type="text"
                            value={task.subLocation || ''}
                            onChange={(e) => updateTask({...task, subLocation: e.target.value})}
                            className="bg-transparent flex-1 outline-none text-white placeholder-slate-500 min-w-0 text-sm"
                            placeholder="Sub-loc"
                        />
                     </div>
                </div>

                <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assignees</label>
                     <div className="flex flex-wrap gap-2 mb-2">
                        {task.assigneeIds.map(id => (
                            <div key={id} onClick={() => removeAssignee(id)} className="cursor-pointer w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-slate-900 text-xs font-bold hover:bg-red-500 transition-colors" title={`Remove ${getPersonName(id)}`}>
                                {getPersonName(id).charAt(0)}
                            </div>
                        ))}
                        <button onClick={() => setShowAssigneeSelect(!showAssigneeSelect)} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500">
                            <Plus size={14} />
                        </button>
                     </div>
                     {showAssigneeSelect && (
                         <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-xs focus:outline-none"
                            onChange={(e) => { addAssignee(e.target.value); setShowAssigneeSelect(false); }}
                            value=""
                         >
                            <option value="">Select Person...</option>
                            {people.filter(p => !task.assigneeIds.includes(p.id)).map(p => (
                                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                            ))}
                         </select>
                     )}
                </div>
            </div>

             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-3">
                     <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center">
                        <Truck size={16} className="mr-2"/> Linked Asset
                    </h3>
                </div>
                
                <select 
                    value={task.assetId || ''} 
                    onChange={handleAssetChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white outline-none mb-3"
                >
                    <option value="">No Linked Asset</option>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>

                {linkedAsset && (
                    <div className="flex items-start space-x-3 bg-slate-800/50 p-3 rounded">
                        {linkedAsset.photoUrl ? (
                            <img src={linkedAsset.photoUrl} className="w-12 h-12 rounded object-cover" alt={linkedAsset.name}/>
                        ) : (
                            <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center"><Truck size={20}/></div>
                        )}
                        <div>
                            <p className="font-bold text-white text-sm">{linkedAsset.name}</p>
                            <p className="text-xs text-slate-500">{linkedAsset.make} {linkedAsset.model}</p>
                            <Link to={`/assets/${linkedAsset.id}`} className="text-xs text-indigo-400 hover:underline">View Asset Details</Link>
                        </div>
                    </div>
                )}
             </div>
        </div>
      </div>

      {/* Modals */}
      {showSubtaskModal && <AddSubtaskModal onClose={() => setShowSubtaskModal(false)} onSave={handleAddSubtask} />}
      {showMaterialModal && <MaterialModal onClose={() => setShowMaterialModal(false)} onSave={handleSaveMaterial} initialMaterial={editingMaterial || undefined} />}
      {showRecurrenceModal && <RecurrenceModal task={task} onClose={() => setShowRecurrenceModal(false)} onSave={handleSaveRecurrence} />}
      {showMaterialsReview && <MaterialsReviewModal suggestions={suggestedMaterials} onClose={() => setShowMaterialsReview(false)} onConfirm={confirmMaterials} />}
    </div>
  );
};
