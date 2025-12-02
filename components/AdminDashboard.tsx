import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { AppError } from '../types';
import { AlertOctagon, CheckCircle, BrainCircuit, RefreshCw, ChevronDown, ChevronUp, User, Clock, Terminal } from 'lucide-react';

const ErrorDetail: React.FC<{ error: AppError }> = ({ error }) => {
    const { analyzeError, resolveError } = useAppStore();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        await analyzeError(error);
        setIsAnalyzing(false);
    };

    return (
        <div className={`border rounded-lg p-4 mb-4 transition-all ${error.isResolved ? 'bg-slate-900 border-slate-800 opacity-60' : 'bg-slate-800 border-red-900/50'}`}>
            <div className="flex justify-between items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-start space-x-3">
                    <div className={`mt-1 ${error.isResolved ? 'text-emerald-500' : 'text-red-500'}`}>
                        {error.isResolved ? <CheckCircle size={20} /> : <AlertOctagon size={20} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm">{error.message}</h4>
                        <div className="flex space-x-4 text-xs text-slate-400 mt-1">
                            <span className="flex items-center"><Clock size={12} className="mr-1"/> {new Date(error.timestamp).toLocaleString()}</span>
                            {error.userEmail && <span className="flex items-center"><User size={12} className="mr-1"/> {error.userEmail}</span>}
                        </div>
                    </div>
                </div>
                <button className="text-slate-500 hover:text-white">
                    {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-4 border-t border-slate-700/50 pt-4 space-y-4">
                    {/* Stack Trace */}
                    <div className="bg-black/50 p-3 rounded text-xs font-mono text-slate-300 overflow-x-auto">
                        <p className="text-slate-500 font-bold mb-1 flex items-center"><Terminal size={12} className="mr-1"/> Stack Trace</p>
                        <pre>{error.stack || "No stack trace available."}</pre>
                        {error.componentStack && (
                             <div className="mt-2 pt-2 border-t border-slate-800">
                                <p className="text-slate-500 font-bold mb-1">Component Stack</p>
                                <pre>{error.componentStack}</pre>
                             </div>
                        )}
                    </div>

                    {/* AI Analysis */}
                    {error.aiAnalysis ? (
                        <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-lg">
                            <h5 className="font-bold text-indigo-400 flex items-center mb-2"><BrainCircuit size={16} className="mr-2"/> AI Diagnosis</h5>
                            <div className="prose prose-invert prose-sm text-slate-300 whitespace-pre-wrap text-sm">
                                {error.aiAnalysis}
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={handleAnalyze} 
                            disabled={isAnalyzing}
                            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-bold transition disabled:opacity-50"
                        >
                            {isAnalyzing ? <div className="animate-spin w-4 h-4 border-2 border-white rounded-full border-t-transparent"></div> : <BrainCircuit size={16} />}
                            <span>Diagnose with AI</span>
                        </button>
                    )}

                    {/* Actions */}
                    {!error.isResolved && (
                         <div className="flex justify-end">
                             <button onClick={() => resolveError(error.id)} className="text-emerald-400 hover:text-emerald-300 text-sm font-bold flex items-center">
                                 <CheckCircle size={16} className="mr-1"/> Mark Resolved
                             </button>
                         </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const AdminDashboard = () => {
    const { isAdmin, appErrors, fetchAppErrors } = useAppStore();

    useEffect(() => {
        if (isAdmin) {
            fetchAppErrors();
        }
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
                <p className="text-slate-400">You do not have administrative privileges.</p>
            </div>
        );
    }

    const resolvedCount = appErrors.filter(e => e.isResolved).length;
    const activeCount = appErrors.length - resolvedCount;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">System Administration</h1>
                    <p className="text-slate-400">Monitor application health and user reported errors.</p>
                </div>
                <button onClick={fetchAppErrors} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition">
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
                 <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                     <p className="text-slate-500 uppercase text-xs font-bold">Active Errors</p>
                     <p className="text-3xl font-bold text-red-500">{activeCount}</p>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                     <p className="text-slate-500 uppercase text-xs font-bold">Resolved</p>
                     <p className="text-3xl font-bold text-emerald-500">{resolvedCount}</p>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                     <p className="text-slate-500 uppercase text-xs font-bold">System Status</p>
                     <p className="text-3xl font-bold text-blue-500">Online</p>
                 </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Error Log</h3>
                
                {appErrors.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <CheckCircle size={48} className="mx-auto mb-4 opacity-20 text-emerald-500" />
                        <p>No errors recorded. System running smoothly.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {appErrors.map(error => (
                            <ErrorDetail key={error.id} error={error} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};