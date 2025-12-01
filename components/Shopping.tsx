import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { ShoppingStatus } from '../types';
import { ShoppingCart, ExternalLink, Check, Camera, Plus } from 'lucide-react';
import { parseReceiptImage } from '../services/gemini';

export const ShoppingList = () => {
  const { shoppingList, updateShoppingItem, tasks, processReceiptItems } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const neededItems = shoppingList.filter(i => i.status === ShoppingStatus.Need);
  const acquiredItems = shoppingList.filter(i => i.status === ShoppingStatus.Acquired);

  const totalCost = neededItems.reduce((acc, item) => acc + item.totalCost, 0);

  const markAcquired = (id: string) => {
      const item = shoppingList.find(i => i.id === id);
      if(item) updateShoppingItem({ ...item, status: ShoppingStatus.Acquired, statusUpdatedDate: new Date().toISOString() });
  };

  const getTaskTitle = (taskId?: string) => {
    if(!taskId) return null;
    return tasks.find(t => t.id === taskId)?.title;
  };

  const handleScanReceipt = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result?.toString().split(',')[1];
          if (base64) {
            const result = await parseReceiptImage(base64);
            processReceiptItems(result.items);
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-white">Shopping List</h2>
            <p className="text-slate-400">Procurement for tasks and daily life.</p>
        </div>
        <div className="flex items-center space-x-4">
             <button 
                onClick={handleScanReceipt}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition border border-slate-700"
                disabled={isProcessing}
            >
                {isProcessing ? <div className="animate-spin w-4 h-4 border-2 border-white rounded-full border-t-transparent"></div> : <Camera size={18} />}
                <span>{isProcessing ? 'Processing...' : 'Scan Receipt'}</span>
            </button>
             <button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition">
                <Plus size={18} />
                <span>Add Item</span>
            </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
         <div className="p-4 bg-slate-800/50 flex justify-between items-center">
             <span className="font-semibold text-slate-300">Need to Buy ({neededItems.length})</span>
             <span className="text-emerald-400 font-bold">Est. ${totalCost.toFixed(2)}</span>
         </div>
        {neededItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Nothing to buy!</div>
        ) : (
            <div className="divide-y divide-slate-800">
                {neededItems.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center space-x-4">
                           <button onClick={() => markAcquired(item.id)} className="w-6 h-6 rounded-full border border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                                <Check size={14} className="opacity-0 hover:opacity-100 text-emerald-500" />
                           </button>
                           <div>
                               <h4 className="font-medium text-white">{item.name}</h4>
                               <div className="text-sm text-slate-400 flex space-x-3">
                                   <span>Qty: {item.quantity}</span>
                                   <span>${item.unitPrice}/ea</span>
                                   {item.taskId && (
                                       <span className="text-indigo-400 bg-indigo-500/10 px-1 rounded text-xs flex items-center">
                                           For: {getTaskTitle(item.taskId)}
                                       </span>
                                   )}
                               </div>
                           </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="font-bold text-slate-200">${item.totalCost.toFixed(2)}</span>
                            {item.url && (
                                <a href={item.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                                    <ExternalLink size={18} />
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

       <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden opacity-75">
        <div className="p-4 bg-slate-800/50 font-semibold text-slate-300">Acquired</div>
         <div className="divide-y divide-slate-800">
            {acquiredItems.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                             <Check size={14} className="text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                             <span className="text-slate-500 line-through">{item.name}</span>
                             <span className="text-xs text-slate-600">{new Date(item.statusUpdatedDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <span className="text-slate-500">${item.totalCost.toFixed(2)}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};