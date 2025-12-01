import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { Asset, AssetType } from '../types';
import { Truck, Cpu, Wrench, FileText, Plus } from 'lucide-react';

const AssetCard: React.FC<{ asset: Asset }> = ({ asset }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500 transition-colors group">
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
        <p className="text-sm text-slate-400 mb-4">{asset.make} {asset.model}</p>
        
        <div className="space-y-2 text-sm">
          {Object.entries(asset.specs).slice(0, 3).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-500">{key}</span>
              <span className="text-slate-300 font-medium">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
           <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center">
             <FileText size={16} className="mr-1"/> History
           </button>
           <button className="text-slate-400 hover:text-white text-sm font-medium flex items-center">
             <Wrench size={16} className="mr-1"/> Service
           </button>
        </div>
      </div>
    </div>
  );
};

export const AssetList = () => {
  const { assets } = useAppStore();
  const [filter, setFilter] = useState<AssetType | 'All'>('All');

  const filteredAssets = filter === 'All' ? assets : assets.filter(a => a.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Assets Library</h2>
          <p className="text-slate-400">Track vehicles, appliances, and equipment.</p>
        </div>
        <button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition">
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
      </div>
    </div>
  );
};