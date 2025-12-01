
import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { ShoppingItem, ShoppingStatus, ShoppingCategory, Vendor, VendorLocation } from '../types';
import { ShoppingCart, ExternalLink, Check, Camera, Plus, Trash2, X, Save, MoreHorizontal, Store, Tag, Wand2, MapPin, Phone, User, Mail } from 'lucide-react';
import { parseReceipt, suggestCategory } from '../services/gemini';

// --- Vendor Modal ---
const VendorModal = ({ vendor, onClose, onSave }: { vendor: Vendor | null, onClose: () => void, onSave: (v: Vendor) => void }) => {
    const { shoppingCategories, addShoppingCategory } = useAppStore();
    const [name, setName] = useState(vendor?.name || '');
    const [url, setUrl] = useState(vendor?.url || '');
    const [categories, setCategories] = useState<ShoppingCategory[]>(vendor?.categories || []);
    const [addresses, setAddresses] = useState<VendorLocation[]>(vendor?.addresses || []);
    
    // Address Editing State
    const [isAddingAddr, setIsAddingAddr] = useState(false);
    const [addrLabel, setAddrLabel] = useState('');
    const [addrText, setAddrText] = useState('');
    const [addrRep, setAddrRep] = useState('');
    const [addrPhone, setAddrPhone] = useState('');
    const [addrEmail, setAddrEmail] = useState('');

    // Suggestion State
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [newCatInput, setNewCatInput] = useState('');

    const toggleCategory = (cat: ShoppingCategory) => {
        if (categories.includes(cat)) {
            setCategories(categories.filter(c => c !== cat));
        } else {
            setCategories([...categories, cat]);
        }
    };
    
    const handleSuggest = async () => {
        if (!name) return;
        setIsSuggesting(true);
        const suggestions = await suggestCategory(name, 'Vendor', shoppingCategories);
        suggestions.forEach(s => {
            if (!shoppingCategories.includes(s)) {
                addShoppingCategory(s);
            }
            if (!categories.includes(s)) {
                toggleCategory(s);
            }
        });
        setIsSuggesting(false);
    };

    const handleAddCustom = () => {
        if (newCatInput.trim()) {
            addShoppingCategory(newCatInput.trim());
            toggleCategory(newCatInput.trim());
            setNewCatInput('');
        }
    };

    const handleAddAddress = () => {
        if (addrLabel && addrText) {
            setAddresses([...addresses, {
                id: Math.random().toString(36).substr(2, 9),
                label: addrLabel,
                address: addrText,
                salesRep: addrRep,
                phone: addrPhone,
                email: addrEmail
            }]);
            setIsAddingAddr(false);
            setAddrLabel('');
            setAddrText('');
            setAddrRep('');
            setAddrPhone('');
            setAddrEmail('');
        }
    };

    const handleRemoveAddress = (id: string) => {
        setAddresses(addresses.filter(a => a.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: vendor?.id || Math.random().toString(36).substr(2, 9),
            name,
            url,
            categories,
            addresses
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl my-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">{vendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-2">
                        <input type="text" placeholder="Vendor Name" className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                        <button 
                            type="button" 
                            onClick={handleSuggest} 
                            disabled={!name || isSuggesting}
                            className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 px-3 rounded flex items-center border border-purple-500/30"
                            title="Suggest Categories"
                        >
                             {isSuggesting ? <div className="animate-spin w-4 h-4 border-2 border-purple-400 rounded-full border-t-transparent"></div> : <Wand2 size={16}/>}
                        </button>
                    </div>

                    <input type="url" placeholder="Website URL" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={url} onChange={e => setUrl(e.target.value)} />
                    
                    {/* Categories */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase">Supported Categories</label>
                        </div>
                        
                        <div className="bg-slate-800 border border-slate-700 rounded p-2 mb-2 max-h-32 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-wrap gap-2">
                                {shoppingCategories.map(cat => (
                                    <button
                                        type="button"
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                                            categories.includes(cat) 
                                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="New Category..." 
                                className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white text-xs" 
                                value={newCatInput} 
                                onChange={e => setNewCatInput(e.target.value)}
                            />
                            <button type="button" onClick={handleAddCustom} className="bg-slate-700 hover:bg-slate-600 text-white px-3 rounded text-xs font-bold"><Plus size={14}/></button>
                        </div>
                    </div>

                    {/* Locations / Addresses */}
                    <div>
                         <div className="flex justify-between items-center mb-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase">Locations</label>
                             <button type="button" onClick={() => setIsAddingAddr(!isAddingAddr)} className="text-xs text-indigo-400 font-bold hover:text-white flex items-center">
                                 {isAddingAddr ? <X size={12} className="mr-1"/> : <Plus size={12} className="mr-1"/>}
                                 {isAddingAddr ? 'Cancel' : 'Add Location'}
                             </button>
                        </div>
                        
                        {isAddingAddr && (
                            <div className="bg-slate-800 p-3 rounded border border-slate-700 mb-3 space-y-2 animate-fadeIn">
                                <input type="text" placeholder="Label (e.g. Downtown)" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" value={addrLabel} onChange={e => setAddrLabel(e.target.value)} />
                                <input type="text" placeholder="Address" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" value={addrText} onChange={e => setAddrText(e.target.value)} />
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="text" placeholder="Sales Rep" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" value={addrRep} onChange={e => setAddrRep(e.target.value)} />
                                    <input type="text" placeholder="Phone" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" value={addrPhone} onChange={e => setAddrPhone(e.target.value)} />
                                </div>
                                <input type="email" placeholder="Email" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" value={addrEmail} onChange={e => setAddrEmail(e.target.value)} />
                                <button type="button" onClick={handleAddAddress} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-1 rounded text-xs font-bold">Add Address</button>
                            </div>
                        )}

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {addresses.length === 0 && !isAddingAddr && (
                                <p className="text-xs text-slate-500 italic p-2 border border-dashed border-slate-800 rounded">No specific locations added.</p>
                            )}
                            {addresses.map(addr => (
                                <div key={addr.id} className="bg-slate-800 border border-slate-700 p-3 rounded text-sm relative group">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-white text-xs bg-slate-700 px-1.5 py-0.5 rounded">{addr.label}</span>
                                        <button type="button" onClick={() => handleRemoveAddress(addr.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={12}/></button>
                                    </div>
                                    <p className="text-slate-300 mt-1 flex items-start text-xs"><MapPin size={12} className="mr-1 mt-0.5 flex-shrink-0 text-slate-500"/> {addr.address}</p>
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                                        {addr.salesRep && <div className="flex items-center"><User size={12} className="mr-1"/> {addr.salesRep}</div>}
                                        {addr.phone && <div className="flex items-center"><Phone size={12} className="mr-1"/> {addr.phone}</div>}
                                    </div>
                                    {addr.email && <div className="mt-1 text-xs text-slate-400 flex items-center"><Mail size={12} className="mr-1"/> {addr.email}</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold">Save Vendor</button>
                </form>
            </div>
        </div>
    );
};

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
    const { vendors, shoppingCategories, addShoppingCategory } = useAppStore();
    const [name, setName] = useState(item?.name || '');
    const [quantity, setQuantity] = useState(item?.quantity || 1);
    const [unitPrice, setUnitPrice] = useState(item?.unitPrice || 0);
    const [url, setUrl] = useState(item?.url || '');
    const [status, setStatus] = useState<ShoppingStatus>(item?.status || ShoppingStatus.Need);
    const [category, setCategory] = useState<ShoppingCategory | ''>(item?.category || '');
    const [vendorId, setVendorId] = useState<string>(item?.vendorId || '');
    const [vendorLocationId, setVendorLocationId] = useState<string>(item?.vendorLocationId || '');

    // State for creating new category
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Suggested Vendors based on Category
    const suggestedVendors = category 
        ? vendors.filter(v => v.categories.includes(category as ShoppingCategory)) 
        : [];
    
    // Vendor Logic
    const selectedVendor = vendors.find(v => v.id === vendorId);
    
    const handleSuggestCategory = async () => {
        if (!name) return;
        setIsSuggesting(true);
        const suggestions = await suggestCategory(name, 'Item', shoppingCategories);
        if (suggestions.length > 0) {
            const best = suggestions[0];
            if (!shoppingCategories.includes(best)) {
                addShoppingCategory(best);
            }
            setCategory(best);
        }
        setIsSuggesting(false);
    };
    
    const handleAddNewCategory = () => {
        if (newCategoryName.trim()) {
            addShoppingCategory(newCategoryName.trim());
            setCategory(newCategoryName.trim());
            setIsAddingCategory(false);
            setNewCategoryName('');
        }
    };
    
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
            taskId: item?.taskId,
            category: category as ShoppingCategory,
            vendorId: vendorId || undefined,
            vendorLocationId: vendorLocationId || undefined
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
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                            {isAddingCategory ? (
                                <div className="flex gap-1">
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-xs outline-none"
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        placeholder="New..."
                                        autoFocus
                                    />
                                    <button type="button" onClick={handleAddNewCategory} className="bg-indigo-600 px-2 rounded text-white"><Check size={14}/></button>
                                    <button type="button" onClick={() => setIsAddingCategory(false)} className="text-slate-400 px-1"><X size={14}/></button>
                                </div>
                            ) : (
                                <div className="flex gap-1">
                                    <select 
                                        value={category} 
                                        onChange={e => setCategory(e.target.value as ShoppingCategory)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">None</option>
                                        {shoppingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <button 
                                        type="button" 
                                        onClick={handleSuggestCategory} 
                                        disabled={!name || isSuggesting}
                                        className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 px-2 rounded border border-purple-500/30 flex items-center justify-center"
                                        title="Auto-Categorize"
                                    >
                                        {isSuggesting ? <div className="animate-spin w-3 h-3 border-2 border-purple-400 rounded-full border-t-transparent"></div> : <Wand2 size={14}/>}
                                    </button>
                                    <button type="button" onClick={() => setIsAddingCategory(true)} className="bg-slate-700 text-slate-300 hover:text-white px-2 rounded flex items-center justify-center"><Plus size={14}/></button>
                                </div>
                            )}
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Vendor</label>
                             <select 
                                value={vendorId} 
                                onChange={e => { setVendorId(e.target.value); setVendorLocationId(''); }}
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                            >
                                <option value="">Any Store</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Vendor Locations */}
                    {selectedVendor && selectedVendor.addresses.length > 0 && (
                        <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Store Location</label>
                             <select 
                                value={vendorLocationId} 
                                onChange={e => setVendorLocationId(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none mb-2"
                             >
                                <option value="">Any Location / Online</option>
                                {selectedVendor.addresses.map(addr => <option key={addr.id} value={addr.id}>{addr.label} - {addr.address}</option>)}
                             </select>
                             
                             {vendorLocationId && (
                                 <div className="text-xs text-slate-400 space-y-1 pl-1 border-l-2 border-indigo-500">
                                     {(() => {
                                         const loc = selectedVendor.addresses.find(a => a.id === vendorLocationId);
                                         if (!loc) return null;
                                         return (
                                             <>
                                                {loc.salesRep && <p>Rep: {loc.salesRep}</p>}
                                                {loc.phone && <p>Tel: {loc.phone}</p>}
                                             </>
                                         );
                                     })()}
                                 </div>
                             )}
                        </div>
                    )}
                    
                    {/* Suggested Vendors */}
                    {suggestedVendors.length > 0 && !vendorId && (
                        <div className="bg-indigo-500/10 p-2 rounded border border-indigo-500/30">
                            <span className="text-xs font-bold text-indigo-300 block mb-1">Suggested Stores:</span>
                            <div className="flex flex-wrap gap-2">
                                {suggestedVendors.map(v => (
                                    <button 
                                        type="button" 
                                        key={v.id} 
                                        onClick={() => setVendorId(v.id)}
                                        className="text-xs px-2 py-0.5 bg-slate-800 hover:bg-indigo-600 rounded text-slate-300 hover:text-white transition-colors"
                                    >
                                        {v.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

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
  const { shoppingList, addShoppingItem, updateShoppingItem, deleteShoppingItem, tasks, processReceiptItems, vendors, addVendor, updateVendor, deleteVendor } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVendorListOpen, setIsVendorListOpen] = useState(false);
  
  // Filtering
  const [filterVendorId, setFilterVendorId] = useState<string>('All');
  const [vendorModalTarget, setVendorModalTarget] = useState<Vendor | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  // Group items by status logic
  const neededItems = shoppingList.filter(i => i.status === ShoppingStatus.Need);
  const orderedItems = shoppingList.filter(i => i.status === ShoppingStatus.Ordered);
  const acquiredItems = shoppingList.filter(i => i.status === ShoppingStatus.Acquired);

  // Smart Filtering Logic
  const getFilteredList = (list: ShoppingItem[]) => {
      if (filterVendorId === 'All') return list;
      
      const vendor = vendors.find(v => v.id === filterVendorId);
      if (!vendor) return list;

      return list.filter(item => {
          // 1. Explicitly assigned to this vendor
          if (item.vendorId === filterVendorId) return true;
          // 2. Not assigned to ANY vendor, but Category matches Vendor's categories
          if (!item.vendorId && item.category && vendor.categories.includes(item.category)) return true;
          return false;
      });
  };

  const filteredNeeded = getFilteredList(neededItems);
  const filteredOrdered = getFilteredList(orderedItems);

  const totalCost = filteredNeeded.reduce((acc, item) => acc + item.totalCost, 0);

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
  
  const handleSaveVendor = (v: Vendor) => {
      if (vendors.find(existing => existing.id === v.id)) updateVendor(v);
      else addVendor(v);
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
  
  // Helper to get location label
  const getLocationLabel = (item: ShoppingItem) => {
      if (item.vendorId && item.vendorLocationId) {
          const vendor = vendors.find(v => v.id === item.vendorId);
          const location = vendor?.addresses.find(a => a.id === item.vendorLocationId);
          if (location) return `@ ${vendor?.name} - ${location.label}`;
      }
      return null;
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
                <div className="text-sm text-slate-400 flex flex-wrap items-center gap-2">
                    <span>Qty: {item.quantity}</span>
                    <span>${item.unitPrice}/ea</span>
                    {item.category && (
                        <span className="flex items-center text-slate-500 bg-slate-800 px-1.5 rounded-full text-[10px] uppercase font-bold">
                           <Tag size={10} className="mr-1"/> {item.category}
                        </span>
                    )}
                    {getLocationLabel(item) && (
                        <span className="flex items-center text-indigo-300 bg-indigo-500/10 px-1.5 rounded-full text-[10px] font-bold">
                           <MapPin size={10} className="mr-1"/> {getLocationLabel(item)}
                        </span>
                    )}
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white">Shopping List</h2>
            <p className="text-slate-400">Procurement for tasks and daily life.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
             <button 
                onClick={handleScanReceipt}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg transition border border-slate-700 text-sm"
                disabled={isProcessing}
            >
                {isProcessing ? <div className="animate-spin w-4 h-4 border-2 border-white rounded-full border-t-transparent"></div> : <Camera size={16} />}
                <span className="hidden sm:inline">{isProcessing ? 'Processing...' : 'Scan Receipt'}</span>
            </button>
            
            <button 
                onClick={() => setIsVendorListOpen(!isVendorListOpen)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition border text-sm ${isVendorListOpen ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
            >
                <Store size={16} />
                <span className="hidden sm:inline">Vendors</span>
            </button>

             <button onClick={handleOpenAdd} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition text-sm">
                <Plus size={16} />
                <span className="hidden sm:inline">Add Item</span>
            </button>
        </div>
      </div>
      
      {/* Vendor List Panel (Toggleable) */}
      {isVendorListOpen && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white flex items-center"><Store size={18} className="mr-2 text-indigo-400"/> Manage Vendors</h3>
                  <button onClick={() => { setVendorModalTarget(null); setIsVendorModalOpen(true); }} className="text-xs bg-indigo-600 px-2 py-1 rounded text-white hover:bg-indigo-700">+ Add Vendor</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vendors.map(v => (
                      <div key={v.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex justify-between items-start group">
                          <div>
                              <p className="font-bold text-white">{v.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1 mb-2">
                                  {v.categories.map(c => <span key={c} className="text-[10px] bg-slate-900 text-slate-400 px-1 rounded">{c}</span>)}
                              </div>
                              <p className="text-xs text-slate-500 flex items-center"><MapPin size={10} className="mr-1"/> {v.addresses.length} Location{v.addresses.length !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setVendorModalTarget(v); setIsVendorModalOpen(true); }} className="p-1 text-slate-400 hover:text-white"><MoreHorizontal size={14}/></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
         <div className="p-4 bg-slate-800/50 flex flex-col md:flex-row justify-between items-center border-b border-slate-800 gap-4">
             <div className="flex items-center space-x-4 w-full md:w-auto">
                <span className="font-semibold text-slate-300 whitespace-nowrap">Active Items</span>
                
                {/* Store Filter Dropdown */}
                <div className="relative flex-1 md:flex-none">
                    <select 
                        value={filterVendorId}
                        onChange={(e) => setFilterVendorId(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 w-full md:w-48 appearance-none"
                    >
                        <option value="All">All Stores</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>
             </div>
             
             <span className="text-emerald-400 font-bold whitespace-nowrap">Pending Cost: ${totalCost.toFixed(2)}</span>
         </div>
         
         <div className="divide-y divide-slate-800">
            {filteredNeeded.length > 0 && (
                <>
                   <div className="px-4 py-2 bg-amber-500/10 text-xs font-bold text-amber-500 uppercase tracking-wider">Need to Buy</div>
                   {filteredNeeded.map(renderItemRow)}
                </>
            )}
            
            {filteredOrdered.length > 0 && (
                <>
                   <div className="px-4 py-2 bg-blue-500/10 text-xs font-bold text-blue-500 uppercase tracking-wider">Ordered / In Transit</div>
                   {filteredOrdered.map(renderItemRow)}
                </>
            )}

            {filteredNeeded.length === 0 && filteredOrdered.length === 0 && (
                <div className="p-8 text-center text-slate-500 italic">
                    {filterVendorId === 'All' ? 'Your active shopping list is empty.' : 'No items for this store.'}
                </div>
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
      
      {isVendorModalOpen && (
          <VendorModal 
            vendor={vendorModalTarget}
            onClose={() => setIsVendorModalOpen(false)}
            onSave={handleSaveVendor}
          />
      )}
    </div>
  );
};
