
import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { TaskStatus, Urgency } from '../types';
import { AlertTriangle, CheckCircle, ShoppingCart, Activity, Settings, BookOpen, Camera } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { parseReceipt } from '../services/gemini';

const StatCard = ({ title, value, icon: Icon, colorClass, to }: any) => (
  <Link to={to} className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg hover:shadow-xl cursor-pointer block">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold mt-2 text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon size={24} className={colorClass} />
      </div>
    </div>
  </Link>
);

export const Dashboard = () => {
  const { tasks, shoppingList, activityLog, processReceiptItems } = useAppStore();
  const navigate = useNavigate();
  const [showModules, setShowModules] = useState({
    urgent: true,
    activity: true,
    shopping: true,
    development: true
  });
  const [isScanning, setIsScanning] = useState(false);

  // Filter for Urgent (4) and Medium (3) tasks for the "Urgent" widget, prioritizing Urgent
  const urgentTasks = tasks.filter(t => (t.urgency === Urgency.Urgent || t.urgency === Urgency.Medium) && t.status !== TaskStatus.Completed)
                           .sort((a, b) => b.urgency - a.urgency);
                           
  const pendingTasks = tasks.filter(t => t.status !== TaskStatus.Completed);
  const shoppingCount = shoppingList.filter(i => i.status === 'Need').length;

  const handleReceiptScan = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setIsScanning(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result?.toString().split(',')[1];
          if (base64) {
            const result = await parseReceipt(base64, file.type);
            if (result.items.length > 0) {
              processReceiptItems(result.items);
              alert(`Processed receipt from ${result.vendor || 'Unknown Vendor'}. Updated shopping list.`);
            } else {
              alert('Could not identify items on receipt.');
            }
            setIsScanning(false);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, Alex</h2>
          <p className="text-slate-400">Here's what's happening in your Nexus.</p>
        </div>
        <div className="relative group self-end md:self-auto">
           <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition">
             <Settings size={20} />
           </button>
           <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-2 hidden group-hover:block z-10">
              <p className="text-xs text-slate-500 px-2 py-1 uppercase font-bold">Visible Modules</p>
              <label className="flex items-center px-2 py-1 text-sm text-slate-300 hover:bg-slate-800 rounded cursor-pointer">
                 <input type="checkbox" checked={showModules.urgent} onChange={() => setShowModules({...showModules, urgent: !showModules.urgent})} className="mr-2 accent-indigo-500" />
                 Urgent Tasks
              </label>
              <label className="flex items-center px-2 py-1 text-sm text-slate-300 hover:bg-slate-800 rounded cursor-pointer">
                 <input type="checkbox" checked={showModules.shopping} onChange={() => setShowModules({...showModules, shopping: !showModules.shopping})} className="mr-2 accent-indigo-500" />
                 Shopping
              </label>
              <label className="flex items-center px-2 py-1 text-sm text-slate-300 hover:bg-slate-800 rounded cursor-pointer">
                 <input type="checkbox" checked={showModules.activity} onChange={() => setShowModules({...showModules, activity: !showModules.activity})} className="mr-2 accent-indigo-500" />
                 Activity Feed
              </label>
              <label className="flex items-center px-2 py-1 text-sm text-slate-300 hover:bg-slate-800 rounded cursor-pointer">
                 <input type="checkbox" checked={showModules.development} onChange={() => setShowModules({...showModules, development: !showModules.development})} className="mr-2 accent-indigo-500" />
                 Development
              </label>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Urgent Tasks" 
          value={urgentTasks.length} 
          icon={AlertTriangle} 
          colorClass="text-red-500" 
          to="/tasks?filter=urgent"
        />
        <StatCard 
          title="Pending Tasks" 
          value={pendingTasks.length} 
          icon={CheckCircle} 
          colorClass="text-blue-500" 
          to="/tasks"
        />
        <StatCard 
          title="Shopping List" 
          value={shoppingCount} 
          icon={ShoppingCart} 
          colorClass="text-emerald-500" 
          to="/shopping"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Urgent Tasks & Actions */}
        <div className="lg:col-span-2 space-y-8">
            {showModules.urgent && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold flex items-center text-white">
                        <AlertTriangle size={20} className="mr-2 text-amber-500" />
                        Priority Action Items
                    </h3>
                    <Link to="/tasks" className="text-sm text-indigo-400 hover:text-indigo-300">View All</Link>
                </div>
                <div className="space-y-4">
                    {urgentTasks.slice(0, 5).map(task => (
                    <Link key={task.id} to={`/tasks/${task.id}`} className="block bg-slate-800/50 p-4 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                        <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold text-white">{task.title}</h4>
                            <p className="text-sm text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                            task.urgency === Urgency.Urgent ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                            {task.urgency === Urgency.Urgent ? 'URGENT' : 'MEDIUM'}
                        </span>
                        </div>
                    </Link>
                    ))}
                    {urgentTasks.length === 0 && (
                        <div className="text-center py-8 text-slate-500 bg-slate-800/20 rounded-lg border border-slate-800 border-dashed">
                            <p>No urgent tasks. Enjoy the calm!</p>
                        </div>
                    )}
                </div>
                </div>
            )}

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-xl font-bold mb-4 text-white">Quick Links</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <button onClick={() => navigate('/tasks')} className="p-4 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition text-center font-semibold text-white shadow-lg shadow-indigo-900/20">
                    New Task
                    </button>
                    <button onClick={handleReceiptScan} className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition text-center font-semibold border border-slate-700 text-slate-200 flex flex-col items-center justify-center hover:text-white hover:border-slate-500">
                        {isScanning ? <div className="animate-spin w-4 h-4 border-2 border-white rounded-full border-t-transparent mb-1"></div> : <Camera size={20} className="mb-2" />}
                        <span>Scan Receipt</span>
                    </button>
                    <button onClick={() => navigate('/assets')} className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition text-center font-semibold border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500">
                    Add Asset
                    </button>
                    <button onClick={() => navigate('/people')} className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition text-center font-semibold border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500">
                    Add Person
                    </button>
                </div>
            </div>

            {showModules.development && (
               <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center text-white">
                        <BookOpen size={18} className="mr-2 text-purple-400" />
                        Development & Library
                    </h3>
                    <Link to="/library" className="text-xs text-indigo-400 hover:text-indigo-300">View Progress</Link>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-300 font-medium">Reading Goals</span>
                          <span className="text-purple-400 text-xs font-bold">3/12 Books</span>
                       </div>
                       <div className="w-full bg-slate-700 h-2 rounded-full">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                       </div>
                       <p className="text-xs text-slate-500 mt-2">Currently reading: <em>Atomic Habits</em></p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-300 font-medium">Skills</span>
                          <span className="text-cyan-400 text-xs font-bold">React Mastery</span>
                       </div>
                       <div className="w-full bg-slate-700 h-2 rounded-full">
                          <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                       </div>
                       <p className="text-xs text-slate-500 mt-2">Module 4: Advanced Patterns</p>
                    </div>
                 </div>
               </div>
            )}
        </div>

        {/* Right Column: Shopping Snapshot & Activity */}
        <div className="space-y-8">
            {showModules.shopping && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold flex items-center text-white">
                            <ShoppingCart size={18} className="mr-2 text-emerald-500" />
                            Shopping Snapshot
                        </h3>
                        <Link to="/shopping" className="text-xs text-indigo-400 hover:text-indigo-300">View List</Link>
                    </div>
                    <div className="space-y-3">
                        {shoppingList.filter(i => i.status === 'Need').slice(0, 5).map(item => (
                            <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2 last:border-0">
                                <span className="text-slate-300">{item.name}</span>
                                <span className="text-slate-500">x{item.quantity}</span>
                            </div>
                        ))}
                        {shoppingList.filter(i => i.status === 'Need').length === 0 && (
                            <p className="text-sm text-slate-500 italic">Shopping list is clear.</p>
                        )}
                    </div>
                </div>
            )}

            {showModules.activity && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex-1">
                     <h3 className="text-lg font-bold flex items-center mb-4 text-white">
                        <Activity size={18} className="mr-2 text-blue-500" />
                        Recent Activity
                    </h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {activityLog.length > 0 ? activityLog.slice(0, 10).map(log => (
                            <div key={log.id} className="flex items-start space-x-3 text-sm">
                                <div className="mt-1.5 w-2 h-2 rounded-full bg-slate-600 flex-shrink-0"></div>
                                <div>
                                    <p className="text-slate-300"><span className="font-semibold text-indigo-400">{log.user}</span> {log.action}</p>
                                    <p className="text-slate-500 text-xs">{log.entityName} • {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-500">No recent activity.</p>
                        )}
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
