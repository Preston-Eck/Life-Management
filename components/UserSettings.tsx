
import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { X, User, Cloud, Palette, LogOut, Check, Trash2, Camera, Mail, Shield } from 'lucide-react';

export const UserSettingsModal = ({ onClose }: { onClose: () => void }) => {
    const { 
        currentUser, updatePerson, logout,
        googleAccounts, linkGoogleAccount, unlinkGoogleAccount
    } = useAppStore();

    const [activeTab, setActiveTab] = useState<'Profile' | 'Integrations' | 'Appearance'>('Profile');
    
    // Profile State
    const [firstName, setFirstName] = useState(currentUser.firstName);
    const [lastName, setLastName] = useState(currentUser.lastName);
    const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
    const [email] = useState(currentUser.emails[0]?.value || ''); // Read-only mostly

    // Integration State
    const [linkInput, setLinkInput] = useState('');

    // Appearance State (Mock - in real app would save to LocalStorage or User Context)
    const [accentColor, setAccentColor] = useState('indigo');
    const [density, setDensity] = useState('comfortable');

    const handleSaveProfile = () => {
        updatePerson({
            ...currentUser,
            firstName,
            lastName,
            avatarUrl
        });
        // Visual feedback could go here
    };

    const handleLinkAccount = () => {
        if (linkInput && linkInput.includes('@')) {
            linkGoogleAccount(linkInput);
            setLinkInput('');
        }
    };

    const handleLogout = () => {
        logout();
        onClose();
    };

    const ACCENT_COLORS = [
        { id: 'indigo', bg: 'bg-indigo-600' },
        { id: 'emerald', bg: 'bg-emerald-600' },
        { id: 'rose', bg: 'bg-rose-600' },
        { id: 'amber', bg: 'bg-amber-600' },
        { id: 'cyan', bg: 'bg-cyan-600' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">Settings & Preferences</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-48 bg-slate-900/50 border-r border-slate-800 p-4 space-y-2">
                        <button 
                            onClick={() => setActiveTab('Profile')}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'Profile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <User size={18} /> <span>Profile</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('Integrations')}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'Integrations' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Cloud size={18} /> <span>Integrations</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('Appearance')}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'Appearance' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Palette size={18} /> <span>Appearance</span>
                        </button>
                        
                        <div className="pt-4 mt-4 border-t border-slate-800">
                             <button 
                                onClick={handleLogout}
                                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                            >
                                <LogOut size={18} /> <span>Sign Out</span>
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        
                        {/* PROFILE TAB */}
                        {activeTab === 'Profile' && (
                            <div className="space-y-6">
                                <div className="flex items-center space-x-6">
                                    <div className="relative group cursor-pointer">
                                        <img src={avatarUrl || 'https://via.placeholder.com/100'} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-slate-800 object-cover" />
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={24} className="text-white"/>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Avatar URL</label>
                                        <input 
                                            type="text" 
                                            value={avatarUrl} 
                                            onChange={e => setAvatarUrl(e.target.value)} 
                                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
                                        <input 
                                            type="text" 
                                            value={firstName} 
                                            onChange={e => setFirstName(e.target.value)} 
                                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name</label>
                                        <input 
                                            type="text" 
                                            value={lastName} 
                                            onChange={e => setLastName(e.target.value)} 
                                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Email</label>
                                    <div className="w-full bg-slate-800/50 border border-slate-700 rounded p-2 text-slate-400 text-sm flex items-center">
                                        <Mail size={14} className="mr-2"/>
                                        {email}
                                        <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Verified</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800 flex justify-end">
                                    <button onClick={handleSaveProfile} className="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* INTEGRATIONS TAB */}
                        {activeTab === 'Integrations' && (
                            <div className="space-y-6">
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start space-x-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 mt-1">
                                        <Cloud size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-blue-100 font-bold text-sm">Google Workspace</h3>
                                        <p className="text-xs text-blue-200/70 mt-1">Sync your Calendar, Gmail, and Drive to unlock AI features.</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {googleAccounts.map(acc => (
                                        <div key={acc.id} className="bg-slate-800 border border-slate-700 p-4 rounded-lg flex justify-between items-center">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{acc.email}</p>
                                                    <div className="flex space-x-2 mt-1">
                                                        {acc.services.map(s => (
                                                            <span key={s} className="text-[10px] bg-slate-900 text-slate-400 px-1.5 rounded uppercase font-bold">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => unlinkGoogleAccount(acc.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-colors" title="Unlink Account">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex space-x-2 pt-2">
                                    <input 
                                        type="email" 
                                        placeholder="Add another Google Account..." 
                                        value={linkInput}
                                        onChange={e => setLinkInput(e.target.value)}
                                        className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                                    />
                                    <button onClick={handleLinkAccount} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-bold text-sm">
                                        Link Account
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* APPEARANCE TAB */}
                        {activeTab === 'Appearance' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="font-bold text-white mb-4">Accent Color</h3>
                                    <div className="flex space-x-4">
                                        {ACCENT_COLORS.map(color => (
                                            <button 
                                                key={color.id}
                                                onClick={() => setAccentColor(color.id)}
                                                className={`w-12 h-12 rounded-full ${color.bg} flex items-center justify-center transition-transform hover:scale-110 border-2 ${accentColor === color.id ? 'border-white' : 'border-transparent'}`}
                                            >
                                                {accentColor === color.id && <Check size={20} className="text-white"/>}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Select a primary color for buttons and highlights.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-white mb-4">Interface Density</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setDensity('comfortable')}
                                            className={`p-4 rounded-lg border text-left transition-all ${density === 'comfortable' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                                        >
                                            <div className="font-bold text-white text-sm mb-1">Comfortable</div>
                                            <div className="text-xs text-slate-400">Standard spacing and larger touch targets.</div>
                                        </button>
                                        <button 
                                            onClick={() => setDensity('compact')}
                                            className={`p-4 rounded-lg border text-left transition-all ${density === 'compact' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                                        >
                                            <div className="font-bold text-white text-sm mb-1">Compact</div>
                                            <div className="text-xs text-slate-400">Reduced spacing to see more data at once.</div>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mt-8">
                                    <h4 className="text-sm font-bold text-slate-300 flex items-center mb-2"><Shield size={14} className="mr-2"/> Data Privacy</h4>
                                    <p className="text-xs text-slate-500 mb-3">All your data is encrypted. You can export your data or delete your account at any time.</p>
                                    <div className="flex space-x-3">
                                        <button className="text-xs text-slate-400 hover:text-white underline">Export Data</button>
                                        <button className="text-xs text-red-500 hover:text-red-400 underline">Delete Account</button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
