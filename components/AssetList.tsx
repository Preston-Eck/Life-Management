
import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { Asset, AssetType } from '../types';
import { Truck, Cpu, Wrench, FileText, Plus, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AssetModal = ({ onClose, onSave }: { onClose: () => void, onSave: (a: Asset) => void }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<AssetType>(AssetType.Vehicle);
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: Math.random().toString(36).substr(2, 9),
            name,
            type,
            make,
            model,
            year: year ? parseInt(year) : undefined,
            photoUrl,
            specs: {},
            serviceHistoryTaskIds: []
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-96 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Add New Asset</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Asset Name (e.g. Family SUV)" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={type} onChange={e => setType(e.target.value as AssetType)}>
                            {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Make" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={make} onChange={e => setMake(e.target.value)} />
                        <input type="text" placeholder="Model" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={model} onChange={e => setModel(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Year" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={year} onChange={e => setYear(e.target.value)} />
                        <input type="url" placeholder="Photo URL" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} />
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold">Add Asset</button>
                </form>
            </div>
        </div>
    );
};

const AssetCard: React.FC<{ asset: Asset }> = ({ asset }) => {
  const navigate = useNavigate();

  const handleHistory = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/assets/${asset.id}?tab=history`);
  };

  const handleService = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/assets/${asset.id}?tab=history&action=add_service`);
  };

  return (
    <Link to={`/assets/${asset.id}`} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500 transition-colors group block">
      <div className="h-32 bg-slate-800 overflow-hidden relative">
        {asset.photoUrl ? (
          <img src={asset.photoUrl} alt={asset.name} className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Truck size={48} />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white uppercase">
          {asset.type}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-white mb-1">{asset.name}</h3>
        <p className="text-sm text-slate-400 mb-4">{asset.make} {asset.model} {asset.year ? `(${asset.year})` : ''}</p>
        
        <div className="space-y-2 text-sm">
          {Object.entries(asset.specs).slice(0, 3).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-500">{key}</span>
              <span className="text-slate-300 font-medium">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
           <button onClick={handleHistory} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center px-2 py-1 rounded hover:bg-slate-800 transition-colors">
             <FileText size={16} className="mr-1"/> History
           </button>
           <button onClick={handleService} className="text-slate-400 hover:text-white text-sm font-medium flex items-center px-2 py-1 rounded hover:bg-slate-800 transition-colors">
             <Wrench size={16} className="mr-1"/> Service
           </button>
        </div>
      </div>
    </Link>
  );
};

export const AssetList = () => {
  const { assets, addAsset } = useAppStore();
  const [filter, setFilter] = useState<AssetType | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredAssets = filter === 'All' ? assets : assets.filter(a => a.type === filter);

  const handleSave = (asset: Asset) => {
      addAsset(asset);
      setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Assets Library</h2>
          <p className="text-slate-400">Track vehicles, appliances, and equipment.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition">
          <Plus size={20} />
          <span>Add Asset</span>
        </button>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['All', ...Object.values(AssetType)].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === type ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAssets.map(asset => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
        {filteredAssets.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                <p>No assets found in this category.</p>
                <button onClick={() => setIsModalOpen(true)} className="mt-4 text-indigo-400 hover:text-indigo-300 underline">Add one now</button>
            </div>
        )}
      </div>

      {isModalOpen && <AssetModal onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
    </div>
  );
};
