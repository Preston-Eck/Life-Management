
import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { Task, TaskStatus, Urgency, Importance } from '../types';
import { Link } from 'react-router-dom';
import { ChevronRight, Circle, CheckCircle, AlertCircle, Plus, Wand2 } from 'lucide-react';
import { generateSubtasks, estimateMaterials } from '../services/gemini';

const TaskItem: React.FC<{ task: Task; depth?: number }> = ({ task, depth = 0 }) => {
  const { tasks, updateTask } = useAppStore();
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);

  const subtasks = tasks.filter(t => task.subtaskIds.includes(t.id));

  const toggleStatus = (e: React.MouseEvent) => {
    e.preventDefault();
    const newStatus = task.status === TaskStatus.Completed ? TaskStatus.Pending : TaskStatus.Completed;
    updateTask({ ...task, status: newStatus });
  };

  const handleAISubtasks = async (e: React.MouseEvent) => {
    e.preventDefault();
    setGenerating(true);
    const newSubtasksData = await generateSubtasks(task.title, task.description);
    
    // In a real app, these would be added to the store properly with IDs
    console.log("Generated Subtasks:", newSubtasksData);
    alert("AI Generated " + newSubtasksData.length + " subtasks (Check console - Mock implementation)");
    setGenerating(false);
  };

  return (
    <div className={`border-b border-slate-800 ${depth > 0 ? 'ml-6 border-l border-slate-800 pl-4' : ''}`}>
      <div className="flex items-center py-4 group hover:bg-slate-900/50 -mx-4 px-4 transition-colors">
        <button onClick={() => setExpanded(!expanded)} className={`mr-2 text-slate-500 hover:text-white transition-transform ${expanded ? 'rotate-90' : ''} ${subtasks.length === 0 ? 'invisible' : ''}`}>
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
               {(task.urgency >= 3 || task.importance >= 3) && (
                 <span className={`px-2 py-0.5 rounded border ${
                    task.urgency === Urgency.Urgent 
                    ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                 }`}>
                   {task.urgency === Urgency.Urgent ? 'Urgent' : (task.importance >= 3 ? 'Important' : 'Medium')}
                 </span>
               )}
               {task.dueDate && <span className="text-slate-400">{new Date(task.dueDate).toLocaleDateString()}</span>}
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
      
      {expanded && subtasks.length > 0 && (
        <div className="mb-4">
          {subtasks.map(st => <TaskItem key={st.id} task={st} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
};

export const TaskList = () => {
  const { tasks } = useAppStore();
  const rootTasks = tasks.filter(t => !t.parentId); // Only show top level, children are nested

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Tasks</h2>
          <p className="text-slate-400">Manage work, personal, and family projects.</p>
        </div>
        <button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition">
          <Plus size={20} />
          <span>New Task</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden px-6">
        {rootTasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};
