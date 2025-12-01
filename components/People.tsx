import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { Person, Comment } from '../types';
import * as d3 from 'd3';
import { Mail, Phone, Users, X, Plus, Save, MessageSquare } from 'lucide-react';

const RelationshipGraph = ({ people }: { people: Person[] }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || people.length === 0) return;

    const width = 800;
    const height = 400;
    
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("class", "bg-slate-900 rounded-xl border border-slate-800 w-full h-full");

    const nodes = people.map(p => ({ id: p.id, name: p.firstName + ' ' + p.lastName, group: p.groups[0] }));
    const links: any[] = [];
    people.forEach(p => {
      p.relationships.forEach(r => {
        if (people.find(target => target.id === r.personId)) {
           links.push({ source: p.id, target: r.personId, type: r.type });
        }
      });
    });

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 15)
      .attr("fill", (d) => d.group === 'Family' ? "#6366f1" : "#10b981")
      .call(drag(simulation) as any);

    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dx", 20)
      .attr("dy", 4)
      .text(d => d.name)
      .attr("fill", "#cbd5e1")
      .attr("font-size", "12px")
      .attr("font-family", "sans-serif");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
      
      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

  }, [people]);

  return (
    <div className="w-full h-96 mb-8">
       <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

// --- Person Detail Modal ---

const PersonDetailModal = ({ person, onClose, onSave }: { person: Person | null; onClose: () => void; onSave: (p: Person) => void }) => {
  const [formData, setFormData] = useState<Person>({
    id: Math.random().toString(36).substr(2, 9),
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    groups: ['Family'],
    relationships: [],
    notes: []
  });

  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (person) setFormData(person);
  }, [person]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    const newNote: Comment = {
      id: Math.random().toString(),
      authorId: 'current-user', // Mock
      text: noteText,
      timestamp: new Date().toISOString(),
      isRead: true,
      isPinned: false
    };
    setFormData({ ...formData, notes: [newNote, ...formData.notes] });
    setNoteText('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{person ? 'Edit Person' : 'Add Person'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
              <input 
                type="text" 
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name</label>
              <input 
                 type="text" 
                 value={formData.lastName}
                 onChange={e => setFormData({...formData, lastName: e.target.value})}
                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none"
                 required
              />
            </div>
          </div>
          <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
              <input 
                 type="email" 
                 value={formData.email || ''}
                 onChange={e => setFormData({...formData, email: e.target.value})}
                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none"
              />
          </div>
          <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Group</label>
              <select 
                value={formData.groups[0]} 
                onChange={e => setFormData({...formData, groups: [e.target.value]})}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none"
              >
                <option value="Family">Family</option>
                <option value="Friends">Friends</option>
                <option value="Work">Work</option>
                <option value="Contractors">Contractors</option>
              </select>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="font-semibold text-slate-300 mb-2 flex items-center">
              <MessageSquare size={16} className="mr-2" />
              Notes & Interactions
            </h3>
            <div className="flex space-x-2 mb-4">
              <input 
                type="text" 
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Log an interaction..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
              />
              <button type="button" onClick={addNote} className="bg-indigo-600 px-3 rounded text-white hover:bg-indigo-700"><Plus size={16}/></button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {formData.notes.map(note => (
                <div key={note.id} className="bg-slate-800/50 p-3 rounded text-sm">
                  <p className="text-slate-300">{note.text}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(note.timestamp).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
             <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2">
               <Save size={18} />
               <span>Save Contact</span>
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PeopleList = () => {
  const { people, addPerson, updatePerson } = useAppStore();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAdd = () => {
    setSelectedPerson(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (person: Person) => {
    setSelectedPerson(person);
    setIsModalOpen(true);
  };

  const handleSave = (person: Person) => {
    if (people.find(p => p.id === person.id)) {
      updatePerson(person);
    } else {
      addPerson(person);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-white">People & Relationships</h2>
           <p className="text-slate-400">Manage contacts, family trees, and professional networks.</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition">
          <Plus size={20} />
          <span>Add Person</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-slate-300 mb-2 px-2">Relationship Map</h3>
          <RelationshipGraph people={people} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {people.map(person => (
          <div key={person.id} onClick={() => handleOpenEdit(person)} className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-indigo-500 transition-colors flex items-start space-x-4 cursor-pointer group">
            <img src={person.avatarUrl || 'https://via.placeholder.com/150'} alt={person.firstName} className="w-16 h-16 rounded-full border-2 border-slate-700 group-hover:border-indigo-500 transition-colors" />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate">{person.firstName} {person.lastName}</h3>
              <div className="flex items-center space-x-2 mt-1 mb-3">
                 {person.groups.map(g => (
                   <span key={g} className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-400 border border-slate-700">{g}</span>
                 ))}
              </div>
              <div className="space-y-1 text-sm text-slate-400">
                {person.email && <div className="flex items-center"><Mail size={14} className="mr-2"/> {person.email}</div>}
                {person.relationships.length > 0 && (
                    <div className="flex items-center mt-2 pt-2 border-t border-slate-800">
                        <Users size={14} className="mr-2 text-indigo-400"/>
                        <span className="text-xs">
                          {person.relationships.length} Connections
                        </span>
                    </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <PersonDetailModal 
          person={selectedPerson} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
};