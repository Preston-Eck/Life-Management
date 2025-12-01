
import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { X, Cloud, Plus, RefreshCw, Mail, Calendar, Trash2, Check, ExternalLink, Wand2 } from 'lucide-react';

export const GoogleIntegrationModal = ({ onClose }: { onClose: () => void }) => {
    const { 
        googleAccounts, linkGoogleAccount, unlinkGoogleAccount,
        taskSuggestions, generateTaskSuggestions, acceptSuggestion, rejectSuggestion
    } = useAppStore();
    
    const [emailInput, setEmailInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    const handleLink = () => {
        if (emailInput && emailInput.includes('@')) {
            linkGoogleAccount(emailInput);
            setEmailInput('');
        }
    };

    const handleScan = async () => {
        setIsScanning(true);
        await generateTaskSuggestions();
        setIsScanning(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                            <Cloud size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Google Integrations</h2>
                            <p className="text-sm text-slate-400">Sync Gmail, Calendar, and Drive</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-white" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Linked Accounts */}
                    <section>
                        <h3 className="font-bold text-white mb-4">Linked Accounts</h3>
                        <div className="space-y-3">
                            {googleAccounts.map(acc => (
                                <div key={acc.id} className="bg-slate-800 p-4 rounded-lg flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
                                            {acc.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{acc.email}</p>
                                            <div className="flex space-x-2 text-xs text-slate-400">
                                                {acc.services.map(s => <span key={s}>{s}</span>)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xs text-slate-500">Last synced: {new Date(acc.lastSync || '').toLocaleTimeString()}</span>
                                        <button onClick={() => unlinkGoogleAccount(acc.id)} className="text-slate-500 hover:text-red-400">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="flex space-x-2">
                                <input 
                                    type="email" 
                                    placeholder="Add Google Account (Email)..." 
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                    value={emailInput}
                                    onChange={e => setEmailInput(e.target.value)}
                                />
                                <button onClick={handleLink} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded font-medium">Link</button>
                            </div>
                        </div>
                    </section>

                    {/* AI Suggestions */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center">
                                <Wand2 size={18} className="mr-2 text-purple-400" />
                                AI Task Suggestions
                            </h3>
                            <button 
                                onClick={handleScan} 
                                disabled={isScanning || googleAccounts.length === 0}
                                className="flex items-center space-x-2 text-sm bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition disabled:opacity-50"
                            >
                                {isScanning ? <div className="animate-spin w-3 h-3 border-2 border-white rounded-full border-t-transparent"></div> : <RefreshCw size={14} />}
                                <span>Scan Now</span>
                            </button>
                        </div>

                        {taskSuggestions.length === 0 ? (
                            <div className="text-center p-8 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
                                <p className="text-slate-500">No suggestions found. Try scanning your accounts.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {taskSuggestions.map(sug => (
                                    <div key={sug.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-indigo-500 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                                    sug.source === 'Gmail' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                    {sug.source}
                                                </span>
                                                <span className="text-xs text-slate-500">{sug.sourceAccount}</span>
                                            </div>
                                            <div className="text-xs text-emerald-400 font-mono">{(sug.confidence * 100).toFixed(0)}% Match</div>
                                        </div>
                                        <h4 className="font-bold text-white mb-1">{sug.title}</h4>
                                        <p className="text-sm text-slate-400 mb-3">{sug.description}</p>
                                        <div className="flex space-x-2 justify-end">
                                            <button onClick={() => rejectSuggestion(sug.id)} className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-white bg-slate-700 rounded hover:bg-slate-600">Reject</button>
                                            <button onClick={() => acceptSuggestion(sug)} className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center">
                                                <Check size={12} className="mr-1" /> Accept Task
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};
