
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/AppContext';
import { Asset, TaskStatus, Urgency, Importance, Task } from '../types';
import { ArrowLeft, Save, Trash2, Plus, X, Wrench, FileText, CheckCircle, Circle, MapPin, Calendar, Truck, Gauge } from 'lucide-react';

const ServiceTaskModal = ({ assetId, onClose, onSave }: { assetId: string, onClose: () => void, onSave: (t: any) => void }) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [date, setDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ title, description: desc, dueDate: date });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-96 shadow-2xl">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Log / Schedule Service</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Service Title (e.g. Oil Change)" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
                    <textarea placeholder="Details..." className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white h-24" value={desc} onChange={e => setDesc(e.target.value)} />
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date (Optional)</label>
                        <input type="date" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold">Add Service Record</button>
                </form>
            </div>
        </div>
    );
};

export const AssetDetail = () => {
    const { assetId } = useParams();
    const navigate = useNavigate();
    const { assets, updateAsset, deleteAsset, tasks, addTask, currentUser, updateAssetUsage } = useAppStore();
    
    const asset = assets.find(a => a.id === assetId);
    
    // UI State
    const [activeTab, setActiveTab] = useState<'Overview' | 'Specs' | 'History'>('Overview');
    const [isEditing, setIsEditing] = useState(false);
    const [showServiceModal, setShowServiceModal] = useState(false);
    
    // Form State for Editing
    const [formData, setFormData] = useState<Partial<Asset>>({});
    const [newSpecKey, setNewSpecKey] = useState('');
    const [newSpecValue, setNewSpecValue] = useState('');
    
    // Usage Update State
    const [usageInput, setUsageInput] = useState(asset?.currentUsage || 0);

    if (!asset) return <div className="p-8 text-white">Asset not found</div>;

    // Derived Data
    const serviceTasks = tasks.filter(t => t.assetId === asset.id);
    const pendingServices = serviceTasks.filter(t => t.status !== TaskStatus.Completed);
    const historyServices = serviceTasks.filter(t => t.status === TaskStatus.Completed).sort((a,b) => new Date(b.dueDate || '').getTime() - new Date(a.dueDate || '').getTime());

    const handleStartEdit = () => {
        setFormData(asset);
        setIsEditing(true);
    };

    const handleSave = () => {
        updateAsset({ ...asset, ...formData } as Asset);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if(confirm('Delete this asset? This cannot be undone.')) {
            deleteAsset(asset.id);
            navigate('/assets');
        }
    };

    const handleAddSpec = () => {
        if (newSpecKey && newSpecValue) {
            const currentSpecs = formData.specs || asset.specs;
            setFormData({
                ...formData,
                specs: { ...currentSpecs, [newSpecKey]: newSpecValue }
            });
            setNewSpecKey('');
            setNewSpecValue('');
        }
    };

    const handleRemoveSpec = (key: string) => {
        const currentSpecs = { ...(formData.specs || asset.specs) };
        delete currentSpecs[key];
        setFormData({ ...formData, specs: currentSpecs });
    };

    const handleCreateService = (data: any) => {
        const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            ownerId: currentUser.id,
            title: data.title,
            description: data.description,
            assetId: asset.id,
            subtaskIds: [],
            prerequisiteIds: [],
            urgency: Urgency.Medium,
            importance: Importance.High,
            status: TaskStatus.Pending,
            assigneeIds: [currentUser.id],
            collaboratorIds: [],
            context: 'Family',
            materials: [],
            comments: [],
            dueDate: data.dueDate
        };
        addTask(newTask);
        setShowServiceModal(false);
    };
    
    const saveUsage = () => {
        updateAssetUsage(asset.id, usageInput);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-4">
                <button onClick={() => navigate('/assets')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center space-x-3">
                        <h1 className="text-3xl font-bold text-white">{asset.name}</h1>
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-slate-700 text-slate-300">{asset.type}</span>
                    </div>
                    <p className="text-slate-400 mt-1">{asset.make} {asset.model} {asset.year}</p>
                </div>
                <div className="flex space-x-2">
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold flex items-center">
                                <Save size={18} className="mr-2"/> Save Changes
                            </button>
                        </>
                    ) : (
                        <button onClick={handleStartEdit} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold border border-slate-700">
                            Edit Asset
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800">
                {['Overview', 'Specs', 'History'].map((tab: any) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === tab 
                            ? 'border-indigo-500 text-white' 
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {tab === 'History' ? 'Service History' : tab}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">
                    
                    {activeTab === 'Overview' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                             <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center relative">
                                {isEditing ? (
                                    <div className="absolute inset-0 p-4 flex flex-col justify-center items-center bg-black/50">
                                        <input 
                                            type="text" 
                                            placeholder="Photo URL" 
                                            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                            value={formData.photoUrl || ''}
                                            onChange={e => setFormData({...formData, photoUrl: e.target.value})}
                                        />
                                    </div>
                                ) : null}
                                {(formData.photoUrl || asset.photoUrl) ? (
                                    <img src={formData.photoUrl || asset.photoUrl} alt={asset.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Truck size={64} className="text-slate-600" />
                                )}
                             </div>

                             {isEditing && (
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                        <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={formData.name || asset.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Make</label>
                                        <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={formData.make || asset.make || ''} onChange={e => setFormData({...formData, make: e.target.value})} />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Model</label>
                                        <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={formData.model || asset.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Year</label>
                                        <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={formData.year || asset.year || ''} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tracking Unit</label>
                                        <input type="text" placeholder="e.g. Miles" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={formData.usageUnit || asset.usageUnit || ''} onChange={e => setFormData({...formData, usageUnit: e.target.value})} />
                                     </div>
                                 </div>
                             )}

                             <div className="bg-slate-800/50 p-4 rounded-lg">
                                 <h3 className="font-bold text-white mb-2">Quick Specs</h3>
                                 <div className="grid grid-cols-2 gap-4 text-sm">
                                     {Object.entries(asset.specs).slice(0, 4).map(([k, v]) => (
                                         <div key={k}><span className="text-slate-500">{k}:</span> <span className="text-slate-300">{v}</span></div>
                                     ))}
                                 </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'Specs' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">Technical Specifications</h3>
                            </div>
                            
                            <div className="space-y-2">
                                {Object.entries(isEditing ? (formData.specs || {}) : asset.specs).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center bg-slate-800 p-3 rounded">
                                        <span className="text-slate-400 font-medium">{key}</span>
                                        <div className="flex items-center">
                                            <span className="text-white mr-4">{value}</span>
                                            {isEditing && (
                                                <button onClick={() => handleRemoveSpec(key)} className="text-slate-600 hover:text-red-400">
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {isEditing && (
                                <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Spec Name (e.g. Oil Type)" 
                                        className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm"
                                        value={newSpecKey}
                                        onChange={e => setNewSpecKey(e.target.value)}
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Value" 
                                        className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm"
                                        value={newSpecValue}
                                        onChange={e => setNewSpecValue(e.target.value)}
                                    />
                                    <button onClick={handleAddSpec} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 rounded">
                                        <Plus size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'History' && (
                        <div className="space-y-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center">
                                        <Wrench size={20} className="mr-2 text-amber-500"/> Upcoming Service
                                    </h3>
                                    <button onClick={() => setShowServiceModal(true)} className="text-indigo-400 text-sm hover:underline font-medium">
                                        + Schedule Service
                                    </button>
                                </div>
                                {pendingServices.length > 0 ? (
                                    <div className="space-y-3">
                                        {pendingServices.map(task => (
                                            <Link key={task.id} to={`/tasks/${task.id}`} className="block bg-slate-800/50 p-4 rounded-lg hover:bg-slate-800 transition-colors">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold text-white">{task.title}</p>
                                                        {task.dueDate && <p className="text-xs text-slate-400 flex items-center mt-1"><Calendar size={12} className="mr-1"/> Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                                                    </div>
                                                    <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded">{task.status}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic text-sm">No pending service tasks.</p>
                                )}
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 opacity-80">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                    <CheckCircle size={20} className="mr-2 text-emerald-500"/> Service History
                                </h3>
                                {historyServices.length > 0 ? (
                                    <div className="space-y-3">
                                        {historyServices.map(task => (
                                            <Link key={task.id} to={`/tasks/${task.id}`} className="block bg-slate-800/30 p-3 rounded-lg border border-transparent hover:border-slate-700 transition-colors">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-medium text-slate-300">{task.title}</p>
                                                    <span className="text-xs text-slate-500">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Completed'}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic text-sm">No completed service history.</p>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    
                    {/* Usage Tracker */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center">
                            <Gauge size={16} className="mr-2"/> Usage Tracking
                        </h3>
                        <div className="mb-4">
                            <p className="text-2xl font-bold text-white">{asset.currentUsage || 0} <span className="text-sm font-normal text-slate-400">{asset.usageUnit || 'Units'}</span></p>
                        </div>
                        <div className="flex gap-2">
                             <input 
                                type="number" 
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" 
                                value={usageInput} 
                                onChange={e => setUsageInput(Number(e.target.value))} 
                            />
                             <button onClick={saveUsage} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 rounded font-bold">Update</button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Updating usage may trigger recurring maintenance tasks.</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                         <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Actions</h3>
                         <div className="space-y-2">
                             <button onClick={() => setShowServiceModal(true)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold flex items-center justify-center">
                                 <Wrench size={16} className="mr-2" /> Log Service
                             </button>
                             {isEditing && (
                                <button onClick={handleDelete} className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded font-bold flex items-center justify-center">
                                    <Trash2 size={16} className="mr-2" /> Delete Asset
                                </button>
                             )}
                         </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Maintenance Stats</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-2xl font-bold text-white">{serviceTasks.length}</p>
                                <p className="text-xs text-slate-500">Total Service Records</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-400">${serviceTasks.reduce((acc, t) => acc + (t.costCache || 0), 0).toFixed(2)}</p>
                                <p className="text-xs text-slate-500">Total Maintenance Cost</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showServiceModal && <ServiceTaskModal assetId={asset.id} onClose={() => setShowServiceModal(false)} onSave={handleCreateService} />}
        </div>
    );
};
