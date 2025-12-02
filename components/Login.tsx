
import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { Hexagon, Lock } from 'lucide-react';

export const Login = () => {
    const { login } = useAppStore();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = () => {
        // Simulate Google Auth Popup interaction
        const emailToUse = email || 'alex.mercer@gmail.com';
        setIsLoading(true);
        setTimeout(() => {
            login(emailToUse);
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg mb-4">
                        <Hexagon size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Nexus LifeOS</h1>
                    <p className="text-slate-400 text-center">Your private, AI-powered command center.</p>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Demo Access</label>
                         <input 
                            type="email" 
                            placeholder="Enter email (or leave empty for Demo)"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            * Use <strong>alex.mercer@gmail.com</strong> to see mock data. <br/>
                            * Any other email creates a fresh, empty account.
                        </p>
                    </div>

                    <button 
                        onClick={handleGoogleLogin} 
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center transition-all disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-slate-900 rounded-full border-t-transparent animate-spin mr-2"></div>
                        ) : (
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-3" alt="Google" />
                        )}
                        {isLoading ? 'Authenticating...' : 'Sign in with Google'}
                    </button>
                    
                    <div className="flex items-center justify-center text-xs text-slate-500 mt-4">
                        <Lock size={12} className="mr-1" /> Secure End-to-End Encryption (Simulated)
                    </div>
                </div>
            </div>
            
            <p className="mt-8 text-slate-600 text-sm">
                &copy; {new Date().getFullYear()} Nexus LifeOS. Private & Secure.
            </p>
        </div>
    );
};
