
import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { ShoppingItem, ShoppingStatus } from '../types';
import { ShoppingCart, ExternalLink, Check, Camera, Plus, Trash2, X, Save, MoreHorizontal } from 'lucide-react';
import { parseReceipt } from '../services/gemini';

// --- Shopping Item Modal ---
const ShoppingItemModal = ({ 
    item, 
    onClose, 
    onSave,
    onDelete
}: { 
    item: ShoppingItem | null, 
    onClose: () => void, 
    onSave: (i: ShoppingItem) => void,
    onDelete: (id: string) => void
}) => {
    const [name, setName] = useState(item?.name || '');
    const [quantity, setQuantity] = useState(item?.quantity || 1);
    const [unitPrice, setUnitPrice] = useState(item?.unitPrice || 0);
    const [url, setUrl] = useState(item?.url || '');
    const [status, setStatus] = useState<ShoppingStatus>(item?.status || ShoppingStatus.Need);
    // Note: Assuming vendor selection isn't strictly enforced yet, just using text for simplicity or URL could imply vendor
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: item?.id || Math.random().toString(36).substr(2, 9),
            name,
            quantity,
            unitPrice,
            totalCost: quantity * unitPrice,
            url,
            status,
            statusUpdatedDate: new Date().toISOString(),
            taskId: item?.taskId
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white text-lg">{item ? 'Edit Item' : 'Add Item'}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name</label>
                        <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
                            <input type="number" min="1" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit Price ($)</label>
                            <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product URL (Optional)</label>
                        <input type="url" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                        <select 
                            value={status} 
                            onChange={e => setStatus(e.target.value as ShoppingStatus)}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none"
                        >
                            {Object.values(ShoppingStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex space-x-3 pt-2">
                        {item && (
                            <button 
                                type="button" 
                                onClick={() => { if(confirm('Delete this item?')) onDelete(item.id); }}
                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded font-bold border border-red-500/20"
                            >
                                Delete
                            </button>
                        )}
                        <button type="submit" className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold flex justify-center items-center">
                            <Save size={18} className="mr-2" />
                            Save Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ShoppingList = () => {
  const { shoppingList, addShoppingItem, updateShoppingItem, deleteShoppingItem, tasks, processReceiptItems } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group items by status logic
  const neededItems = shoppingList.filter(i => i.status === ShoppingStatus.Need);
  const orderedItems = shoppingList.filter(i => i.status === ShoppingStatus.Ordered);
  const acquiredItems = shoppingList.filter(i => i.status === ShoppingStatus.Acquired);

  const totalCost = shoppingList.filter(i => i.status !== ShoppingStatus.Acquired).reduce((acc, item) => acc + item.totalCost, 0);

  const handleOpenAdd = () => {
      setSelectedItem(null);
      setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ShoppingItem) => {
      setSelectedItem(item);
      setIsModalOpen(true);
  };

  const handleSave = (item: ShoppingItem) => {
      if (selectedItem) {
          updateShoppingItem(item);
      } else {
          addShoppingItem(item);
      }
      setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
      deleteShoppingItem(id);
      setIsModalOpen(false);
  };

  const cycleStatus = (e: React.MouseEvent, item: ShoppingItem) => {
      e.stopPropagation(); // Prevent opening modal
      let nextStatus = ShoppingStatus.Need;
      if (item.status === ShoppingStatus.Need) nextStatus = ShoppingStatus.Ordered;
      else if (item.status === ShoppingStatus.Ordered) nextStatus = ShoppingStatus.Acquired;
      else if (item.status === ShoppingStatus.Acquired) nextStatus = ShoppingStatus.Need;

      updateShoppingItem({ 
          ...item, 
          status: nextStatus, 
          statusUpdatedDate: new Date().toISOString() 
      });
  };

  const getTaskTitle = (taskId?: string) => {
    if(!taskId) return null;
    return tasks.find(t => t.id === taskId)?.title;
  };

  const handleScanReceipt = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result?.toString().split(',')[1];
          if (base64) {
            const result = await parseReceipt(base64, file.type);
            processReceiptItems(result.items);
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const renderItemRow = (item: ShoppingItem) => (
      <div 
        key={item.id} 
        onClick={() => handleOpenEdit(item)}
        className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer group border-b border-slate-800 last:border-0"
      >
        <div className="flex items-center space-x-4">
            <button 
                onClick={(e) => cycleStatus(e, item)}
                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                    item.status === ShoppingStatus.Acquired ? 'bg-emerald-500 border-emerald-500' :
                    item.status === ShoppingStatus.Ordered ? 'bg-blue-500/20 border-blue-500' :
                    'border-slate-600 hover:border-indigo-400'
                }`}
                title={`Current: ${item.status} (Click to cycle)`}
            >
                {item.status === ShoppingStatus.Acquired && <Check size={14} className="text-white" />}
                {item.status === ShoppingStatus.Ordered && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
            </button>
            
            <div>
                <h4 className={`font-medium ${item.status === ShoppingStatus.Acquired ? 'text-slate-500 line-through' : 'text-white'}`}>
                    {item.name}
                </h4>
                <div className="text-sm text-slate-400 flex items-center space-x-3">
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
            <span className={`font-bold ${item.status === ShoppingStatus.Acquired ? 'text-slate-600' : 'text-slate-200'}`}>
                ${item.totalCost.toFixed(2)}
            </span>
            {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-indigo-400 hover:text-indigo-300">
                    <ExternalLink size={18} />
                </a>
            )}
            <MoreHorizontal size={16} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
  );

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
             <button onClick={handleOpenAdd} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition">
                <Plus size={18} />
                <span>Add Item</span>
            </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
         <div className="p-4 bg-slate-800/50 flex justify-between items-center border-b border-slate-800">
             <span className="font-semibold text-slate-300">Active Items</span>
             <span className="text-emerald-400 font-bold">Pending Cost: ${totalCost.toFixed(2)}</span>
         </div>
         
         <div className="divide-y divide-slate-800">
            {neededItems.length > 0 && (
                <>
                   <div className="px-4 py-2 bg-amber-500/10 text-xs font-bold text-amber-500 uppercase tracking-wider">Need to Buy</div>
                   {neededItems.map(renderItemRow)}
                </>
            )}
            
            {orderedItems.length > 0 && (
                <>
                   <div className="px-4 py-2 bg-blue-500/10 text-xs font-bold text-blue-500 uppercase tracking-wider">Ordered / In Transit</div>
                   {orderedItems.map(renderItemRow)}
                </>
            )}

            {neededItems.length === 0 && orderedItems.length === 0 && (
                <div className="p-8 text-center text-slate-500 italic">Your active shopping list is empty.</div>
            )}
         </div>
      </div>

       <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden opacity-75">
        <div className="p-4 bg-slate-800/50 font-semibold text-slate-300 border-b border-slate-800">Acquired History</div>
         <div className="divide-y divide-slate-800">
            {acquiredItems.length > 0 ? acquiredItems.map(renderItemRow) : (
                <div className="p-4 text-center text-slate-600 text-sm">No items acquired recently.</div>
            )}
        </div>
      </div>

      {isModalOpen && (
          <ShoppingItemModal 
            item={selectedItem}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
      )}
    </div>
  );
};
