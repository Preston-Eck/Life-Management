
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/AppContext';
import { Cloud, Check, ArrowRight, ShieldCheck, Database, Calendar, Mail } from 'lucide-react';

export const Onboarding = () => {
  const { currentUser, linkGoogleAccount, googleAccounts, completeOnboarding } = useAppStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [linkEmail, setLinkEmail] = useState('');
  
  // Auto-fill the email from the current user's linked account if it looks like an email
  React.useEffect(() => {
    if (currentUser.linkedUserAccount && currentUser.linkedUserAccount.includes('@')) {
        setLinkEmail(currentUser.linkedUserAccount);
    }
  }, [currentUser]);

  const handleLink = () => {
    if (linkEmail) {
        linkGoogleAccount(linkEmail);
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Progress Bar */}
        <div className="bg-slate-800 h-2 w-full">
            <div 
                className="h-full bg-indigo-500 transition-all duration-500" 
                style={{ width: `${(step / 3) * 100}%` }}
            ></div>
        </div>

        <div className="p-8">
            
            {/* Step 1: Welcome */}
            {step === 1 && (
                <div className="text-center space-y-6 animate-fadeIn">
                    <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Welcome, {currentUser.firstName}!</h1>
                    <p className="text-slate-400 text-lg max-w-md mx-auto">
                        Nexus is designed to be your private, AI-powered operating system for life and work. Let's get you set up.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-8">
                        <div className="bg-slate-800 p-4 rounded-lg">
                            <Database className="text-emerald-400 mb-2"/>
                            <h3 className="font-bold text-white">Secure Data</h3>
                            <p className="text-xs text-slate-400">Your data is private and owned by you.</p>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg">
                            <Cloud className="text-blue-400 mb-2"/>
                            <h3 className="font-bold text-white">Cloud Sync</h3>
                            <p className="text-xs text-slate-400">Integrated with your existing tools.</p>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg">
                            <Calendar className="text-purple-400 mb-2"/>
                            <h3 className="font-bold text-white">Smart Schedule</h3>
                            <p className="text-xs text-slate-400">AI organizes your tasks and time.</p>
                        </div>
                    </div>
                    <div className="pt-8">
                        <button 
                            onClick={() => setStep(2)} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold flex items-center mx-auto transition-all transform hover:scale-105"
                        >
                            Get Started <ArrowRight size={20} className="ml-2"/>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Google Integration */}
            {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                     <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Digital Life</h2>
                        <p className="text-slate-400">Link your Google services to enable AI automation for emails and calendar.</p>
                     </div>

                     <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center mb-6">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-8 h-8 mr-3" alt="Google" />
                            <div>
                                <h3 className="font-bold text-white">Google Account</h3>
                                <p className="text-xs text-slate-400">Gmail, Calendar, Drive</p>
                            </div>
                        </div>

                        {googleAccounts.length > 0 ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center">
                                    <Check size={20} className="text-emerald-500 mr-2" />
                                    <div>
                                        <p className="font-bold text-emerald-400">Connected</p>
                                        <p className="text-xs text-emerald-300/70">{googleAccounts[0].email}</p>
                                    </div>
                                </div>
                                <button onClick={() => setStep(3)} className="text-xs text-emerald-400 hover:text-white underline">Continue</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <input 
                                    type="email" 
                                    value={linkEmail}
                                    onChange={e => setLinkEmail(e.target.value)}
                                    placeholder="Enter your Gmail address..."
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                                />
                                <button 
                                    onClick={handleLink}
                                    disabled={!linkEmail.includes('@')}
                                    className="w-full bg-white text-slate-900 font-bold py-3 rounded-lg hover:bg-slate-200 transition disabled:opacity-50"
                                >
                                    Link Account
                                </button>
                                <p className="text-xs text-center text-slate-500">
                                    This will simulate connecting to Google APIs for the demo.
                                </p>
                            </div>
                        )}
                     </div>

                     <div className="flex justify-between items-center pt-4">
                         <button onClick={() => setStep(3)} className="text-slate-400 hover:text-white text-sm">Skip for now</button>
                         {googleAccounts.length > 0 && (
                             <button onClick={() => setStep(3)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center">
                                Next <ArrowRight size={16} className="ml-2"/>
                             </button>
                         )}
                     </div>
                </div>
            )}

             {/* Step 3: Finish */}
             {step === 3 && (
                <div className="text-center space-y-6 animate-fadeIn py-8">
                     <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                        <Check size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">All Set!</h1>
                    <p className="text-slate-400 text-lg">
                        Your workspace is ready.
                    </p>
                    <div className="pt-6">
                        <button 
                            onClick={handleFinish} 
                            className="bg-white text-slate-900 hover:bg-slate-200 px-8 py-3 rounded-full font-bold text-lg shadow-xl transition-transform hover:scale-105"
                        >
                            Enter Dashboard
                        </button>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};
