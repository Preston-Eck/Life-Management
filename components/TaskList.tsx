
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/AppContext';
import { Task, TaskStatus, Urgency, Importance, RecurrenceRule, Attachment, Person } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Circle, CheckCircle, AlertCircle, Plus, Wand2, X, Clock, Repeat, Paperclip, Camera, Image, Truck, MapPin, Users, Calendar, LayoutList, Columns, Filter, ArrowUpDown, Search, SlidersHorizontal } from 'lucide-react';
import { generateSubtasks, estimateMaterials, analyzeTaskAttributes } from '../services/gemini';

// --- Create Task Modal ---
const CreateTaskModal = ({ onClose, onSave }: { onClose: () => void, onSave: (task: Partial<Task>) => void }) => {
    const { assets } = useAppStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    
    // Initialize with empty strings/null to force selection or AI usage
    const [urgency, setUrgency] = useState<Urgency | ''>('');
    const [importance, setImportance] = useState<Importance | ''>('');
    const [context, setContext] = useState<'Work' | 'Personal' | 'Family' | 'School' | 'Other' | ''>('');
    const [timeEstimate, setTimeEstimate] = useState<number | ''>('');
    
    const [selectedAssetId, setSelectedAssetId] = useState<string>('');
    
    // Recurrence State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [recurrenceUnit, setRecurrenceUnit] = useState<'day' | 'week' | 'month' | 'year'>('week');

    // Attachments State
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    
    // Loading State
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
                setAttachments([...attachments, newAtt]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(attachments.filter(a => a.id !== id));
    };

    const handleAutoFill = async () => {
        if (!title) return;
        setIsAnalyzing(true);
        const result = await analyzeTaskAttributes(title, description);
        setUrgency(result.urgency);
        setImportance(result.importance);
        setContext(result.context as any);
        setTimeEstimate(result.timeEstimate);
        setIsAnalyzing(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Ensure values are filled
        if (!urgency || !importance || !context || timeEstimate === '') {
            alert("Please fill in all required fields or use the Magic Fill button.");
            return;
        }

        let recurrence: RecurrenceRule | undefined = undefined;
        if (isRecurring) {
            recurrence = {
                type: 'Time',
                interval: recurrenceInterval,
                unit: recurrenceUnit,
                endCondition: 'Never' // Default for quick create
            };
        }

        onSave({
            title,
            description,
            dueDate: dueDate || undefined,
            urgency: urgency as Urgency,
            importance: importance as Importance,
            context: context as any,
            timeEstimate: Number(timeEstimate),
            recurrence,
            attachments,
            assetId: selectedAssetId || undefined
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl my-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white text-lg">Create New Task</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            required 
                            autoFocus 
                            placeholder="e.g., Pay bills"
                        />
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                         <textarea 
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white h-24 focus:border-indigo-500 outline-none"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Details about the task..."
                         />
                    </div>
                    
                    {/* Magic Fill Button */}
                    <div className="flex justify-end">
                        <button 
                            type="button" 
                            onClick={handleAutoFill}
                            disabled={!title || isAnalyzing}
                            className={`flex items-center space-x-2 text-sm font-bold px-3 py-2 rounded transition-all ${
                                !title 
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 border border-purple-500/30'
                            }`}
                        >
                            {isAnalyzing ? (
                                <div className="animate-spin w-4 h-4 border-2 border-purple-300 rounded-full border-t-transparent"></div>
                            ) : (
                                <Wand2 size={16} />
                            )}
                            <span>{isAnalyzing ? 'Analyzing...' : 'Auto-Fill Details'}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                             <input 
                                type="date" 
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" 
                                value={dueDate} 
                                onChange={e => setDueDate(e.target.value)} 
                             />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Context</label>
                             <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
                                value={context}
                                onChange={e => setContext(e.target.value as any)}
                                required
                             >
                                 <option value="" disabled>Select Context...</option>
                                 <option value="Personal">Personal</option>
                                 <option value="Work">Work</option>
                                 <option value="Family">Family</option>
                                 <option value="School">School</option>
                                 <option value="Other">Other</option>
                             </select>
                        </div>
                    </div>
                    
                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link Asset (Optional)</label>
                         <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded p-2">
                             <Truck size={16} className="text-slate-400"/>
                             <select 
                                className="w-full bg-transparent text-white outline-none"
                                value={selectedAssetId}
                                onChange={e => setSelectedAssetId(e.target.value)}
                             >
                                 <option value="">None</option>
                                 {assets.map(a => (
                                     <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                                 ))}
                             </select>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Urgency</label>
                            <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
                                value={urgency}
                                onChange={e => setUrgency(Number(e.target.value))}
                                required
                            >
                                <option value="" disabled>Select...</option>
                                <option value={1}>1 - Not Urgent</option>
                                <option value={2}>2 - Low</option>
                                <option value={3}>3 - Medium</option>
                                <option value={4}>4 - Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Importance</label>
                            <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
                                value={importance}
                                onChange={e => setImportance(Number(e.target.value))}
                                required
                            >
                                <option value="" disabled>Select...</option>
                                <option value={1}>1 - Not Important</option>
                                <option value={2}>2 - Low</option>
                                <option value={3}>3 - High</option>
                                <option value={4}>4 - Very Important</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-start">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Est. Time (Hours)</label>
                            <div className="flex items-center bg-slate-800 border border-slate-700 rounded p-2">
                                <Clock size={16} className="text-slate-400 mr-2"/>
                                <input 
                                    type="number" 
                                    min="0.25"
                                    step="0.25"
                                    className="w-full bg-transparent text-white outline-none" 
                                    value={timeEstimate} 
                                    onChange={e => setTimeEstimate(Number(e.target.value))} 
                                    placeholder="0.0"
                                    required
                                />
                            </div>
                         </div>
                         
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recurrence</label>
                             <div className="bg-slate-800 border border-slate-700 rounded p-2">
                                 <label className="flex items-center space-x-2 cursor-pointer mb-2">
                                     <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded bg-slate-700 border-slate-600 text-indigo-600" />
                                     <span className="text-sm text-white font-medium">Repeats?</span>
                                 </label>
                                 {isRecurring && (
                                     <div className="flex space-x-2 text-sm">
                                         <input type="number" min="1" value={recurrenceInterval} onChange={e => setRecurrenceInterval(Number(e.target.value))} className="w-10 bg-slate-900 rounded p-1 text-center text-white" />
                                         <select value={recurrenceUnit} onChange={e => setRecurrenceUnit(e.target.value as any)} className="flex-1 bg-slate-900 rounded p-1 text-white">
                                             <option value="day">Day(s)</option>
                                             <option value="week">Week(s)</option>
                                             <option value="month">Month(s)</option>
                                         </select>
                                     </div>
                                 )}
                             </div>
                         </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Attachments</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {attachments.map(att => (
                                <div key={att.id} className="bg-slate-800 px-2 py-1 rounded flex items-center space-x-2 border border-slate-700">
                                    <span className="text-xs text-white max-w-[100px] truncate">{att.name}</span>
                                    <button type="button" onClick={() => removeAttachment(att.id)} className="text-slate-400 hover:text-red-400"><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <label className="flex-1 flex items-center justify-center p-2 bg-slate-800 border border-slate-700 rounded cursor-pointer hover:bg-slate-700 transition">
                                <Camera size={18} className="text-indigo-400 mr-2" />
                                <span className="text-sm text-slate-300">Camera</span>
                                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                            </label>
                            <label className="flex-1 flex items-center justify-center p-2 bg-slate-800 border border-slate-700 rounded cursor-pointer hover:bg-slate-700 transition">
                                <Paperclip size={18} className="text-indigo-400 mr-2" />
                                <span className="text-sm text-slate-300">Upload</span>
                                <input type="file" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold mt-4">Create Task</button>
                </form>
            </div>
        </div>
    );
};

// --- Task Item Component ---
const TaskItem: React.FC<{ task: Task; depth?: number; hideChildren?: boolean }> = ({ task, depth = 0, hideChildren = false }) => {
  const { tasks, updateTask, people } = useAppStore();
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locInput, setLocInput] = useState(task.location || '');

  const subtasks = tasks.filter(t => task.subtaskIds.includes(t.id));

  // Assignment Logic
  const allGroups: string[] = Array.from(new Set(people.flatMap(p => p.groups))).filter(Boolean) as string[];
  
  const toggleStatus = (e: React.MouseEvent) => {
    e.preventDefault();
    const newStatus = task.status === TaskStatus.Completed ? TaskStatus.Pending : TaskStatus.Completed;
    updateTask({ ...task, status: newStatus });
  };

  const handleAISubtasks = async (e: React.MouseEvent) => {
    e.preventDefault();
    setGenerating(true);
    const newSubtasksData = await generateSubtasks(task.title, task.description);
    // Note: In real logic, addSubtask from store would be used
    console.log("Generated Subtasks:", newSubtasksData);
    alert(`AI Generated ${newSubtasksData.length} subtasks (Mock)`);
    setGenerating(false);
  };

  const saveLocation = () => {
      updateTask({ ...task, location: locInput });
      setEditingLocation(false);
  };

  const toggleAssignee = (personId: string) => {
      let newAssignees = [...task.assigneeIds];
      if (newAssignees.includes(personId)) {
          newAssignees = newAssignees.filter(id => id !== personId);
      } else {
          newAssignees.push(personId);
      }
      updateTask({ ...task, assigneeIds: newAssignees });
  };

  const assignGroup = (groupName: string) => {
      const members = people.filter(p => p.groups.includes(groupName));
      const memberIds = members.map(m => m.id);
      // Merge unique IDs
      const newAssignees = Array.from(new Set([...task.assigneeIds, ...memberIds]));
      updateTask({ ...task, assigneeIds: newAssignees });
  };

  return (
    <div className={`border-b border-slate-800 ${depth > 0 ? 'ml-6 border-l border-slate-800 pl-4' : ''}`}>
      <div className="flex items-center py-4 group hover:bg-slate-900/50 -mx-4 px-4 transition-colors">
        <button onClick={() => setExpanded(!expanded)} className={`mr-2 text-slate-500 hover:text-white transition-transform ${expanded ? 'rotate-90' : ''} ${subtasks.length === 0 && !expanded ? 'invisible' : ''}`}>
          <ChevronRight size={18} />
        </button>
        
        <button onClick={toggleStatus} className={`mr-4 transition-colors ${task.status === TaskStatus.Completed ? 'text-emerald-500' : 'text-slate-600 hover:text-indigo-500'}`}>
          {task.status === TaskStatus.Completed ? <CheckCircle size={24} /> : <Circle size={24} />}
        </button>

        <Link to={`/tasks/${task.id}`} className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium truncate ${task.status === TaskStatus.Completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
              {task.title}
            </h4>
            <div className="flex items-center space-x-2 text-xs">
               {task.recurrence && <Repeat size={12} className="text-slate-400" />}
               {(task.urgency >= 3 || task.importance >= 3) && (
                 <span className={`px-2 py-0.5 rounded border ${
                    task.urgency === Urgency.Urgent 
                    ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                 }`}>
                   {task.urgency === Urgency.Urgent ? 'Urgent' : (task.importance >= 3 ? 'Important' : 'Medium')}
                 </span>
               )}
               {task.dueDate && <span className="text-slate-400 flex items-center"><Calendar size={10} className="mr-1"/>{new Date(task.dueDate).toLocaleDateString()}</span>}
            </div>
          </div>
          <p className="text-sm text-slate-500 truncate">{task.description}</p>
        </Link>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex space-x-2">
            <button onClick={handleAISubtasks} className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded" title="AI Breakdown">
                {generating ? <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div> : <Wand2 size={16} />}
            </button>
        </div>
      </div>
      
      {/* Expanded Inline Editing Area */}
      {expanded && (
          <div className="mb-4 bg-slate-800/30 p-4 rounded-lg border border-slate-800/50 space-y-4">
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Location Editing */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                      <div className="flex items-center space-x-2">
                           {editingLocation ? (
                               <>
                                <input 
                                    type="text" 
                                    value={locInput} 
                                    onChange={e => setLocInput(e.target.value)} 
                                    className="bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white flex-1"
                                    autoFocus
                                />
                                <button onClick={saveLocation} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">Save</button>
                               </>
                           ) : (
                               <div className="flex items-center text-sm text-slate-300 cursor-pointer hover:text-white" onClick={() => setEditingLocation(true)}>
                                   <MapPin size={14} className="mr-2 text-slate-500"/>
                                   {task.location || 'Set Location...'}
                               </div>
                           )}
                      </div>
                  </div>

                  {/* Assignee Editing */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quick Assign</label>
                      <div className="flex flex-wrap gap-2">
                           {/* Groups */}
                           {allGroups.map(group => (
                               <button 
                                   key={group}
                                   onClick={() => assignGroup(group)}
                                   className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-0.5 rounded border border-slate-600"
                               >
                                   + {group}
                               </button>
                           ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                           {people.map(p => {
                               const isAssigned = task.assigneeIds.includes(p.id);
                               return (
                                   <button 
                                       key={p.id}
                                       onClick={() => toggleAssignee(p.id)}
                                       className={`flex items-center space-x-1 px-2 py-1 rounded text-xs border ${
                                           isAssigned 
                                           ? 'bg-indigo-600 border-indigo-500 text-white' 
                                           : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                       }`}
                                   >
                                       <Users size={10} />
                                       <span>{p.firstName}</span>
                                   </button>
                               )
                           })}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Render Subtasks if visible and not hidden by view logic */}
      {(!hideChildren && expanded && subtasks.length > 0) && (
        <div className="mb-4">
          {subtasks.map(st => <TaskItem key={st.id} task={st} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
};

// --- Main Task List with Views ---
type ViewMode = 'List' | 'DueDate' | 'Context' | 'Status' | 'Location';

export const TaskList = () => {
  const { tasks, addTask, currentUser, people } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('List');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // --- Filtration State ---
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterContext, setFilterContext] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All'); // 'High', 'Urgent', 'Normal'
  const [filterAssignee, setFilterAssignee] = useState<string>('All');

  // --- Sorting State ---
  const [sortField, setSortField] = useState<'DueDate' | 'Title' | 'Importance' | 'Created'>('DueDate');
  const [sortDirection, setSortDirection] = useState<'Asc' | 'Desc'>('Asc');

  const handleSaveNewTask = (taskData: Partial<Task>) => {
      const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          ownerId: currentUser.id,
          title: taskData.title || 'New Task',
          description: taskData.description || '',
          dueDate: taskData.dueDate,
          urgency: taskData.urgency || Urgency.Medium,
          importance: taskData.importance || Importance.High,
          status: TaskStatus.Pending,
          context: taskData.context || 'Personal',
          assigneeIds: [currentUser.id],
          collaboratorIds: [],
          subtaskIds: [],
          prerequisiteIds: [],
          materials: [],
          comments: [],
          timeEstimate: taskData.timeEstimate,
          recurrence: taskData.recurrence,
          attachments: taskData.attachments || [],
          assetId: taskData.assetId
      };
      addTask(newTask);
      setIsModalOpen(false);
      navigate(`/tasks/${newTask.id}`);
  };

  // --- Filter Logic ---
  const filteredTasks = useMemo(() => {
      return tasks.filter(t => {
          // 1. Search
          if (searchText) {
              const term = searchText.toLowerCase();
              const matchTitle = t.title.toLowerCase().includes(term);
              const matchDesc = t.description.toLowerCase().includes(term);
              if (!matchTitle && !matchDesc) return false;
          }

          // 2. Context
          if (filterContext !== 'All' && t.context !== filterContext) return false;

          // 3. Status
          if (filterStatus !== 'All') {
              if (filterStatus === 'Active' && t.status === TaskStatus.Completed) return false;
              if (filterStatus === 'Completed' && t.status !== TaskStatus.Completed) return false;
              if (filterStatus !== 'Active' && filterStatus !== 'Completed' && t.status !== filterStatus) return false;
          }

          // 4. Priority
          if (filterPriority !== 'All') {
              if (filterPriority === 'Urgent' && t.urgency !== Urgency.Urgent) return false;
              if (filterPriority === 'High Importance' && t.importance !== Importance.VeryImportant && t.importance !== Importance.High) return false;
          }

          // 5. Assignee
          if (filterAssignee !== 'All') {
              if (!t.assigneeIds.includes(filterAssignee)) return false;
          }

          return true;
      });
  }, [tasks, searchText, filterContext, filterStatus, filterPriority, filterAssignee]);

  // --- Sort Logic (Applied to Lists) ---
  const sortedTasks = useMemo(() => {
      const list = [...filteredTasks];
      list.sort((a, b) => {
          let valA: any = '';
          let valB: any = '';

          switch (sortField) {
              case 'Title':
                  valA = a.title;
                  valB = b.title;
                  break;
              case 'DueDate':
                  // Handle missing dates -> put them last usually
                  valA = a.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
                  valB = b.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
                  break;
              case 'Importance':
                  valA = a.importance + a.urgency; // Score
                  valB = b.importance + b.urgency;
                  break;
              default: 
                  valA = 0; valB = 0; 
          }

          if (valA < valB) return sortDirection === 'Asc' ? -1 : 1;
          if (valA > valB) return sortDirection === 'Asc' ? 1 : -1;
          return 0;
      });
      return list;
  }, [filteredTasks, sortField, sortDirection]);

  // Root tasks for List view (filtering applied, but only showing roots unless searching)
  // If searching, we often want to show subtasks too, but let's stick to root visualization for hierarchy, 
  // OR show flat list if filtered.
  const displayTasks = useMemo(() => {
      // If we are filtering significantly, hierarchy might hide matches. 
      // Strategy: If Text Search is active, show flat list. Else show hierarchy.
      if (searchText) return sortedTasks;
      return sortedTasks.filter(t => !t.parentId); 
  }, [sortedTasks, searchText]);


  // --- Grouping Logic (Uses Filtered Tasks) ---
  const groupedTasks = useMemo((): Record<string, Task[]> => {
      const groups: Record<string, Task[]> = {};
      const sourceList = sortedTasks; // Use filtered AND sorted tasks

      if (viewMode === 'DueDate') {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);

          sourceList.forEach(t => {
              if (t.status === TaskStatus.Completed && filterStatus !== 'Completed') return; 
              
              let key = 'No Date';
              if (t.dueDate) {
                  const d = new Date(t.dueDate);
                  const dZero = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  
                  if (dZero < today) key = 'Overdue';
                  else if (dZero.getTime() === today.getTime()) key = 'Today';
                  else if (dZero <= nextWeek) key = 'This Week';
                  else key = 'Later';
              }
              if (!groups[key]) groups[key] = [];
              groups[key].push(t);
          });
          
          // Order keys
          const ordered: Record<string, Task[]> = {};
          ['Overdue', 'Today', 'This Week', 'Later', 'No Date'].forEach(k => {
              if (groups[k]) ordered[k] = groups[k];
          });
          return ordered;
      }

      if (viewMode === 'Context') {
          sourceList.forEach(t => {
              const key = t.context || 'Unassigned';
              if (!groups[key]) groups[key] = [];
              groups[key].push(t);
          });
          return groups;
      }

      if (viewMode === 'Status') {
           sourceList.forEach(t => {
              const key = t.status;
              if (!groups[key]) groups[key] = [];
              groups[key].push(t);
          });
          return groups;
      }

      if (viewMode === 'Location') {
           sourceList.forEach(t => {
              const key = t.location || 'Unassigned';
              if (!groups[key]) groups[key] = [];
              groups[key].push(t);
          });
          return groups;
      }

      return {};
  }, [viewMode, sortedTasks, filterStatus]);

  const renderViewSwitcher = () => (
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 mb-4 pb-2 gap-4">
          <div className="flex space-x-1 overflow-x-auto no-scrollbar">
              {[
                  { id: 'List', icon: LayoutList, label: 'List' },
                  { id: 'DueDate', icon: Calendar, label: 'Due Date' },
                  { id: 'Context', icon: Columns, label: 'Context' },
                  { id: 'Status', icon: CheckCircle, label: 'Status' },
                  { id: 'Location', icon: MapPin, label: 'Location' },
              ].map(view => (
                  <button
                    key={view.id}
                    onClick={() => setViewMode(view.id as ViewMode)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        viewMode === view.id 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                      <view.icon size={16} />
                      <span className="hidden sm:inline">{view.label}</span>
                  </button>
              ))}
          </div>

          <div className="flex items-center space-x-2">
               <div className="relative">
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search tasks..." 
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-indigo-500 w-40 md:w-56"
                    />
               </div>
               <button 
                  onClick={() => setShowFilters(!showFilters)} 
                  className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-slate-800 text-indigo-400 border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}
                  title="Filter & Sort"
               >
                   <SlidersHorizontal size={18} />
               </button>
          </div>
      </div>
  );

  const renderFilterPanel = () => (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fadeIn">
          <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Context</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-sm" value={filterContext} onChange={e => setFilterContext(e.target.value)}>
                  <option value="All">All Contexts</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Family">Family</option>
                  <option value="School">School</option>
              </select>
          </div>
          <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Active">Active (Not Completed)</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
              </select>
          </div>
          <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-sm" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                  <option value="All">Any Priority</option>
                  <option value="Urgent">Urgent Only</option>
                  <option value="High Importance">High Importance</option>
              </select>
          </div>
          <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assignee</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-sm" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
                  <option value="All">Anyone</option>
                  {people.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
          </div>
          <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sort By</label>
              <div className="flex gap-2">
                  <select className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-sm" value={sortField} onChange={e => setSortField(e.target.value as any)}>
                      <option value="DueDate">Due Date</option>
                      <option value="Importance">Priority Score</option>
                      <option value="Title">Title</option>
                  </select>
                  <button onClick={() => setSortDirection(prev => prev === 'Asc' ? 'Desc' : 'Asc')} className="bg-slate-800 border border-slate-700 rounded px-2 text-slate-400 hover:text-white">
                      <ArrowUpDown size={16} className={sortDirection === 'Desc' ? 'transform rotate-180' : ''} />
                  </button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Tasks</h2>
          <p className="text-slate-400">Manage work, personal, and family projects.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition shadow-lg shadow-indigo-900/20"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      <div className="flex flex-col">
          {renderViewSwitcher()}
          {showFilters && renderFilterPanel()}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden px-6 min-h-[400px]">
        {viewMode === 'List' ? (
             displayTasks.length > 0 ? (
                displayTasks.map(task => (
                   <TaskItem key={task.id} task={task} />
                ))
             ) : (
                <div className="p-12 text-center text-slate-500">
                    <p>{searchText || filterContext !== 'All' ? 'No tasks match your filters.' : 'No tasks found. Create one to get started!'}</p>
                </div>
             )
        ) : (
            // Grouped Rendering
            <div className="py-4 space-y-8">
                {Object.entries(groupedTasks).map(([groupName, groupTasks]) => {
                    const tasks = groupTasks as Task[];
                    return (
                        <div key={groupName}>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-2 ${
                                    groupName === 'Overdue' || groupName === 'Urgent' ? 'bg-red-500' : 
                                    groupName === 'Today' ? 'bg-amber-500' : 'bg-indigo-500'
                                }`}></span>
                                {groupName} <span className="ml-2 text-slate-600">({tasks.length})</span>
                            </h3>
                            <div className="bg-slate-800/30 rounded-xl border border-slate-800/50 px-4">
                                {tasks.map(task => (
                                    <TaskItem key={task.id} task={task} hideChildren={true} />
                                ))}
                            </div>
                        </div>
                    );
                })}
                {Object.keys(groupedTasks).length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        <p>No tasks match this view.</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {isModalOpen && (
          <CreateTaskModal onClose={() => setIsModalOpen(false)} onSave={handleSaveNewTask} />
      )}
    </div>
  );
};
