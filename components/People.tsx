
import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { Person, Comment, DataShareField, Organization, ContactMethod, ImportantDate } from '../types';
import { RELATIONSHIP_TYPES } from '../constants';
import * as d3 from 'd3';
import { Mail, Phone, Users, X, Plus, Save, MessageSquare, Trash2, Link as LinkIcon, Share2, Shield, UserCheck, User, Building, Briefcase, Calendar, MapPin, Tag, Send, UserPlus, Copy, Check } from 'lucide-react';

const RelationshipGraph = ({ people, organizations }: { people: Person[], organizations: Organization[] }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || people.length === 0) return;

    const width = 800;
    const height = 400;
    
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("class", "bg-slate-900 rounded-xl border border-slate-800 w-full h-full");

    // Nodes: People + Organizations
    const personNodes = people.map(p => ({ 
        id: p.id, 
        name: p.firstName + ' ' + p.lastName, 
        group: p.groups[0],
        type: 'person',
        isMe: p.isCurrentUser 
    }));

    const orgNodes = organizations.map(o => ({
        id: o.id,
        name: o.name,
        group: 'Organization',
        type: 'organization',
        isMe: false
    }));

    const nodes = [...personNodes, ...orgNodes];
    
    const links: any[] = [];
    
    // Person <-> Person Links
    people.forEach(p => {
      p.relationships.forEach(r => {
        if (people.find(target => target.id === r.personId)) {
           // Prevent duplicate links drawing (A->B and B->A)
           if (p.id < r.personId) {
             links.push({ source: p.id, target: r.personId, type: r.type });
           }
        }
      });
    });

    // Person <-> Organization Links
    people.forEach(p => {
        p.affiliations.forEach(aff => {
            if (organizations.find(o => o.id === aff.organizationId)) {
                links.push({ source: p.id, target: aff.organizationId, type: aff.role });
            }
        });
    });

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const linkGroup = svg.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    const nodeGroup = svg.append("g")
      .selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .call(drag(simulation) as any);

    // Draw Circles for People, Squares/Rects for Orgs
    nodeGroup.each(function(d: any) {
        const el = d3.select(this);
        if (d.type === 'organization') {
            el.append("rect")
              .attr("width", 30)
              .attr("height", 30)
              .attr("x", -15)
              .attr("y", -15)
              .attr("rx", 6)
              .attr("fill", "#64748b") // slate-500
              .attr("stroke", "#fff")
              .attr("stroke-width", 1.5);
        } else {
            el.append("circle")
              .attr("r", d.isMe ? 20 : 15)
              .attr("fill", d.isMe ? "#f59e0b" : (d.group === 'Family' ? "#6366f1" : "#10b981"))
              .attr("stroke", "#fff")
              .attr("stroke-width", 1.5);
        }
    });

    // Labels
    nodeGroup.append("text")
      .attr("dx", 22)
      .attr("dy", 4)
      .text((d:any) => d.isMe ? "ME" : d.name)
      .attr("fill", (d:any) => d.isMe ? "#fbbf24" : "#cbd5e1")
      .attr("font-size", (d:any) => d.isMe ? "14px" : "12px")
      .attr("font-weight", (d:any) => d.isMe || d.type === 'organization' ? "bold" : "normal")
      .attr("font-family", "sans-serif");
      
    // Link Labels (Relationship Type)
    const linkLabel = svg.append("g")
        .attr("class", "link-labels")
        .selectAll("text")
        .data(links)
        .enter().append("text")
        .attr("font-size", "10px")
        .attr("fill", "#64748b")
        .attr("text-anchor", "middle")
        .text((d:any) => d.type);

    simulation.on("tick", () => {
      linkGroup
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup.attr("transform", (d:any) => `translate(${d.x},${d.y})`);

      linkLabel
        .attr("x", (d:any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d:any) => (d.source.y + d.target.y) / 2);
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

  }, [people, organizations]);

  return (
    <div className="w-full h-96 mb-8 relative">
       <svg ref={svgRef} className="w-full h-full"></svg>
       <div className="absolute top-4 right-4 bg-slate-900/80 p-2 rounded border border-slate-700 text-xs text-slate-400">
          <div className="flex items-center mb-1"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div> Family</div>
          <div className="flex items-center mb-1"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div> Friends/Others</div>
          <div className="flex items-center"><div className="w-2 h-2 bg-slate-500 mr-2"></div> Organization</div>
       </div>
    </div>
  );
};

// --- Invite Modal ---
const InviteModal = ({ onClose }: { onClose: () => void }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'Idle' | 'Sending' | 'Sent'>('Idle');
    const [copied, setCopied] = useState(false);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Sending');
        setTimeout(() => {
            setStatus('Sent');
        }, 1500);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(`https://nexus-lifeos.app/join?ref=${btoa(email)}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-96 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Invite to Nexus</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                
                {status === 'Sent' ? (
                    <div className="text-center py-4 space-y-4">
                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                            <Check size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Invitation Simulated!</h4>
                            <p className="text-xs text-slate-400 mt-2">
                                Since this is a demo environment, no actual email was sent. 
                                <br/>Please copy the link below manually.
                            </p>
                        </div>
                        <div className="bg-slate-800 p-2 rounded flex items-center justify-between border border-slate-700">
                            <code className="text-xs text-indigo-400 truncate flex-1 mr-2">nexus-lifeos.app/join?ref=...</code>
                            <button onClick={copyLink} className="text-slate-400 hover:text-white">
                                {copied ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}
                            </button>
                        </div>
                        <button onClick={onClose} className="text-sm text-slate-500 hover:text-white">Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                            <input type="email" required className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Personal Message</label>
                            <textarea className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white h-24" value={message} onChange={e => setMessage(e.target.value)} placeholder="Join my family network on Nexus..." />
                        </div>
                        <button type="submit" disabled={status === 'Sending'} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold flex items-center justify-center disabled:opacity-50">
                            {status === 'Sending' ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white rounded-full border-t-transparent"></div>
                            ) : (
                                <>
                                    <Send size={16} className="mr-2" /> Send Invitation
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- Person Detail Modal ---

const SHARE_OPTIONS: { id: DataShareField, label: string }[] = [
    { id: 'Emails', label: 'Email Addresses' },
    { id: 'Phones', label: 'Phone Numbers' },
    { id: 'Address', label: 'Home Address' },
    { id: 'PersonalDates', label: 'Birthdays & Important Dates' },
    { id: 'CustomFields', label: 'Custom Details' },
    { id: 'Relationships', label: 'Family Tree / Relationships' },
    { id: 'Notes', label: 'Interactions & Notes' },
];

const PersonDetailModal = ({ 
    person, 
    onClose, 
    onSave,
    onAddOrg
}: { 
    person: Person | null; 
    onClose: () => void; 
    onSave: (p: Person) => void;
    onAddOrg: () => void;
}) => {
  const { people, organizations, sharePerson, customFieldDefs, addCustomFieldDef } = useAppStore(); 
  const [activeTab, setActiveTab] = useState<'Info' | 'Contact' | 'Personal' | 'Connections' | 'Notes' | 'Sharing'>('Info');
  
  const [formData, setFormData] = useState<Person>({
    id: Math.random().toString(36).substr(2, 9),
    isCurrentUser: false,
    firstName: '',
    lastName: '',
    emails: [],
    phones: [],
    importantDates: [],
    customFields: {},
    groups: ['Family'],
    relationships: [],
    affiliations: [],
    notes: [],
    sharedWith: []
  });

  const [noteText, setNoteText] = useState('');
  
  // Relationship State
  const [newRelId, setNewRelId] = useState('');
  const [newRelType, setNewRelType] = useState('Friend');
  const [customRelType, setCustomRelType] = useState('');

  // Affiliation State
  const [newOrgId, setNewOrgId] = useState('');
  const [newOrgRole, setNewOrgRole] = useState('');

  // Contact Method State
  const [contactLabel, setContactLabel] = useState('Personal');
  const [contactValue, setContactValue] = useState('');

  // Date State
  const [dateLabel, setDateLabel] = useState('Birthday');
  const [dateValue, setDateValue] = useState('');
  const [dateType, setDateType] = useState<'Birthday' | 'Anniversary' | 'Other'>('Birthday');
  const [dateRepeats, setDateRepeats] = useState(true);

  // Custom Field State
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [isCreatingField, setIsCreatingField] = useState(false);
  const [customFieldNameInput, setCustomFieldNameInput] = useState('');

  // Sharing State
  const [shareUserEmail, setShareUserEmail] = useState('');
  const [sharePermissions, setSharePermissions] = useState<Record<DataShareField, boolean>>({
      Emails: true,
      Phones: true,
      Address: false,
      PersonalDates: false,
      CustomFields: false,
      Notes: false,
      Relationships: false
  });

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
      authorId: 'current-user', 
      text: noteText,
      timestamp: new Date().toISOString(),
      isRead: true,
      isPinned: false
    };
    setFormData({ ...formData, notes: [newNote, ...formData.notes] });
    setNoteText('');
  };

  // --- Contact Logic ---
  const addEmail = () => {
      if(!contactValue) return;
      setFormData({
          ...formData,
          emails: [...formData.emails, { id: Math.random().toString(), label: contactLabel, value: contactValue }]
      });
      setContactValue('');
  };
  const removeEmail = (id: string) => setFormData({...formData, emails: formData.emails.filter(e => e.id !== id)});

  const addPhone = () => {
      if(!contactValue) return;
      setFormData({
          ...formData,
          phones: [...formData.phones, { id: Math.random().toString(), label: contactLabel, value: contactValue }]
      });
      setContactValue('');
  };
  const removePhone = (id: string) => setFormData({...formData, phones: formData.phones.filter(e => e.id !== id)});

  // --- Date Logic ---
  const addImportantDate = () => {
      if(!dateValue) return;
      setFormData({
          ...formData,
          importantDates: [...formData.importantDates, { 
              id: Math.random().toString(), 
              label: dateLabel, 
              date: dateValue, 
              type: dateType,
              repeats: dateRepeats 
          }]
      });
      setDateValue('');
  };
  const removeImportantDate = (id: string) => setFormData({...formData, importantDates: formData.importantDates.filter(d => d.id !== id)});

  // --- Custom Field Logic ---
  const saveCustomField = () => {
      if(!newFieldKey && !isCreatingField) return;
      
      let key = newFieldKey;
      if (isCreatingField) {
          if(!customFieldNameInput) return;
          key = customFieldNameInput;
          addCustomFieldDef(key); // Add to global list
          setIsCreatingField(false);
          setCustomFieldNameInput('');
      }

      setFormData({
          ...formData,
          customFields: { ...formData.customFields, [key]: newFieldValue }
      });
      setNewFieldKey('');
      setNewFieldValue('');
  };

  const removeCustomField = (key: string) => {
      const newFields = { ...formData.customFields };
      delete newFields[key];
      setFormData({ ...formData, customFields: newFields });
  };
  
  // --- Relationship Logic ---
  const addRelationship = () => {
    if (!newRelId) return;
    const type = newRelType === 'Other' && customRelType ? customRelType : newRelType;
    if (formData.relationships.some(r => r.personId === newRelId)) return;

    setFormData({
        ...formData,
        relationships: [...formData.relationships, { personId: newRelId, type: type }]
    });
    setNewRelId('');
    setCustomRelType('');
    setNewRelType('Friend');
  };

  const removeRelationship = (targetId: string) => {
      setFormData({
          ...formData,
          relationships: formData.relationships.filter(r => r.personId !== targetId)
      });
  };

  const addAffiliation = () => {
      if(!newOrgId || !newOrgRole) return;
      if (formData.affiliations.some(a => a.organizationId === newOrgId)) return;
      setFormData({
          ...formData,
          affiliations: [...formData.affiliations, { organizationId: newOrgId, role: newOrgRole }]
      });
      setNewOrgId('');
      setNewOrgRole('');
  };

  const removeAffiliation = (orgId: string) => {
      setFormData({
          ...formData,
          affiliations: formData.affiliations.filter(a => a.organizationId !== orgId)
      });
  };
  
  const handleShare = () => {
      if(!shareUserEmail) return;
      
      const fields: DataShareField[] = [];
      SHARE_OPTIONS.forEach(opt => {
          if (sharePermissions[opt.id]) fields.push(opt.id);
      });

      sharePerson(formData.id, {
          userId: shareUserEmail,
          fields: fields
      });
      
      const existingShareIndex = formData.sharedWith.findIndex(s => s.userId === shareUserEmail);
      let newShares = [...formData.sharedWith];
      if (existingShareIndex >= 0) {
          newShares[existingShareIndex] = { userId: shareUserEmail, fields };
      } else {
          newShares.push({ userId: shareUserEmail, fields });
      }
      setFormData({ ...formData, sharedWith: newShares });
      setShareUserEmail('');
  };

  const getPersonName = (id: string) => {
      const p = people.find(p => p.id === id);
      return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
  };

  const getOrgName = (id: string) => organizations.find(o => o.id === id)?.name || 'Unknown';
  const candidatePeople = people.filter(p => p.id !== formData.id);

  // Common styles
  const inputStyle = "w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none";
  const labelStyle = "block text-xs font-bold text-slate-500 uppercase mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-40">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{person ? 'Edit Person' : 'Add Person'}</h2>
          <div className="flex items-center space-x-2">
             <button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm font-bold flex items-center">
                <Save size={14} className="mr-1" /> Save
             </button>
             <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
             {['Info', 'Contact', 'Personal', 'Connections', 'Notes', 'Sharing'].map(tab => (
                 <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-slate-800 text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    {tab}
                 </button>
             ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* --- INFO TAB --- */}
            {activeTab === 'Info' && (
                <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyle}>First Name</label>
                            <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className={inputStyle} required />
                        </div>
                        <div>
                            <label className={labelStyle}>Last Name</label>
                            <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className={inputStyle} required />
                        </div>
                    </div>

                    <div>
                        <label className={labelStyle}>Photo URL</label>
                        <input type="text" value={formData.avatarUrl || ''} onChange={e => setFormData({...formData, avatarUrl: e.target.value})} className={inputStyle} placeholder="https://..." />
                    </div>

                    <div>
                        <label className={labelStyle}>Group</label>
                        <select value={formData.groups[0]} onChange={e => setFormData({...formData, groups: [e.target.value]})} className={inputStyle}>
                            <option value="Family">Family</option>
                            <option value="Friends">Friends</option>
                            <option value="Work">Work</option>
                            <option value="Contractors">Contractors</option>
                        </select>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-4 mt-4">
                        <div className="flex items-center space-x-3">
                            <input type="checkbox" checked={formData.isCurrentUser || false} onChange={e => setFormData({...formData, isCurrentUser: e.target.checked})} className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-indigo-600" />
                            <div>
                                <span className="font-bold text-slate-200 block text-sm">This is Me</span>
                                <span className="text-xs text-slate-500 block">Identifies you in the relationship tree</span>
                            </div>
                        </div>

                        <div>
                            <label className={labelStyle}>Linked App Account</label>
                            <div className="flex items-center space-x-2">
                                <UserCheck size={16} className="text-emerald-500" />
                                <input type="text" value={formData.linkedUserAccount || ''} onChange={e => setFormData({...formData, linkedUserAccount: e.target.value})} placeholder="username@nexus.app" className={inputStyle} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONTACT TAB --- */}
            {activeTab === 'Contact' && (
                <div className="space-y-6">
                    {/* Address */}
                    <div>
                        <label className={labelStyle}><MapPin size={12} className="inline mr-1"/> Home Address</label>
                        <textarea value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className={`${inputStyle} h-20`} placeholder="Street, City, State, Zip..." />
                    </div>

                    {/* Emails */}
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-slate-300 text-sm mb-3 flex items-center"><Mail size={14} className="mr-2"/> Email Addresses</h3>
                        <div className="space-y-2 mb-3">
                            {formData.emails.map(email => (
                                <div key={email.id} className="flex justify-between items-center bg-slate-800 p-2 rounded text-sm">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-bold text-slate-500 bg-slate-900 px-1 rounded">{email.label}</span>
                                        <span className="text-slate-200">{email.value}</span>
                                    </div>
                                    <button onClick={() => removeEmail(email.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <select value={contactLabel} onChange={e => setContactLabel(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white w-24">
                                <option>Personal</option><option>Work</option><option>Other</option>
                            </select>
                            <input type="email" placeholder="Email Address" value={contactValue} onChange={e => setContactValue(e.target.value)} className={`flex-1 ${inputStyle}`} />
                            <button onClick={addEmail} className="bg-indigo-600 px-3 rounded text-white hover:bg-indigo-700"><Plus size={16}/></button>
                        </div>
                    </div>

                    {/* Phones */}
                     <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-slate-300 text-sm mb-3 flex items-center"><Phone size={14} className="mr-2"/> Phone Numbers</h3>
                        <div className="space-y-2 mb-3">
                            {formData.phones.map(phone => (
                                <div key={phone.id} className="flex justify-between items-center bg-slate-800 p-2 rounded text-sm">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-bold text-slate-500 bg-slate-900 px-1 rounded">{phone.label}</span>
                                        <span className="text-slate-200">{phone.value}</span>
                                    </div>
                                    <button onClick={() => removePhone(phone.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <select value={contactLabel} onChange={e => setContactLabel(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white w-24">
                                <option>Mobile</option><option>Home</option><option>Work</option>
                            </select>
                            <input type="tel" placeholder="Phone Number" value={contactValue} onChange={e => setContactValue(e.target.value)} className={`flex-1 ${inputStyle}`} />
                            <button onClick={addPhone} className="bg-indigo-600 px-3 rounded text-white hover:bg-indigo-700"><Plus size={16}/></button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PERSONAL TAB --- */}
            {activeTab === 'Personal' && (
                <div className="space-y-6">
                    <div>
                        <label className={labelStyle}>Birth Date</label>
                        <input type="date" value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} className={inputStyle} />
                    </div>

                    {/* Important Dates */}
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                         <h3 className="font-bold text-slate-300 text-sm mb-3 flex items-center"><Calendar size={14} className="mr-2"/> Important Dates</h3>
                         <div className="space-y-2 mb-3">
                            {formData.importantDates.map(d => (
                                <div key={d.id} className="flex justify-between items-center bg-slate-800 p-2 rounded text-sm">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-slate-200 font-medium">{d.label}</span>
                                            {d.repeats && <span className="text-[10px] bg-indigo-900 text-indigo-300 px-1 rounded uppercase">Repeats</span>}
                                        </div>
                                        <div className="text-xs text-slate-500">{new Date(d.date).toLocaleDateString()}</div>
                                    </div>
                                    <button onClick={() => removeImportantDate(d.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input type="text" placeholder="Label (e.g. Anniversary)" value={dateLabel} onChange={e => setDateLabel(e.target.value)} className={`flex-1 ${inputStyle}`} />
                                <select value={dateType} onChange={e => setDateType(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white">
                                    <option value="Other">Other</option><option value="Birthday">Birthday</option><option value="Anniversary">Anniversary</option>
                                </select>
                            </div>
                            <div className="flex gap-2 items-center">
                                <input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} className={`flex-1 ${inputStyle}`} />
                                <label className="flex items-center space-x-1 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={dateRepeats} onChange={e => setDateRepeats(e.target.checked)} className="rounded bg-slate-700 border-slate-600" />
                                    <span>Repeats</span>
                                </label>
                                <button onClick={addImportantDate} className="bg-indigo-600 px-3 py-2 rounded text-white hover:bg-indigo-700"><Plus size={16}/></button>
                            </div>
                        </div>
                    </div>

                    {/* Custom Fields */}
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                         <h3 className="font-bold text-slate-300 text-sm mb-3 flex items-center"><Tag size={14} className="mr-2"/> Custom Details</h3>
                         <p className="text-xs text-slate-500 mb-4">Add additional details like 'Allergies', 'Favorite Color', etc. New fields are saved globally.</p>
                         
                         <div className="space-y-2 mb-4">
                             {Object.entries(formData.customFields).map(([key, value]) => (
                                 <div key={key} className="flex justify-between items-center bg-slate-800 p-2 rounded text-sm">
                                     <span className="text-slate-400 font-medium w-1/3">{key}</span>
                                     <span className="text-slate-200 flex-1 px-2">{value}</span>
                                     <button onClick={() => removeCustomField(key)} className="text-slate-500 hover:text-red-400"><X size={14}/></button>
                                 </div>
                             ))}
                         </div>

                         <div className="space-y-2 border-t border-slate-700 pt-3">
                             {isCreatingField ? (
                                 <div className="flex gap-2 mb-2">
                                     <input 
                                        type="text" 
                                        placeholder="New Field Name (e.g. Coffee Order)" 
                                        value={customFieldNameInput} 
                                        onChange={e => setCustomFieldNameInput(e.target.value)}
                                        className={`flex-1 ${inputStyle}`}
                                        autoFocus
                                    />
                                    <button onClick={() => setIsCreatingField(false)} className="text-slate-400 hover:text-white px-2"><X size={16}/></button>
                                 </div>
                             ) : (
                                 <div className="flex gap-2">
                                     <select 
                                        value={newFieldKey} 
                                        onChange={e => {
                                            if (e.target.value === '__NEW__') {
                                                setIsCreatingField(true);
                                                setNewFieldKey('');
                                            } else {
                                                setNewFieldKey(e.target.value);
                                            }
                                        }} 
                                        className={`flex-1 ${inputStyle}`}
                                    >
                                         <option value="">Select Field...</option>
                                         {customFieldDefs.filter(f => !formData.customFields[f]).map(f => (
                                             <option key={f} value={f}>{f}</option>
                                         ))}
                                         <option value="__NEW__" className="font-bold text-indigo-400">+ Create New Field</option>
                                     </select>
                                 </div>
                             )}
                             
                             <div className="flex gap-2">
                                 <input type="text" placeholder="Value" value={newFieldValue} onChange={e => setNewFieldValue(e.target.value)} className={`flex-1 ${inputStyle}`} />
                                 <button onClick={saveCustomField} className="bg-indigo-600 px-3 py-2 rounded text-white hover:bg-indigo-700 font-bold text-xs uppercase">Add</button>
                             </div>
                         </div>
                    </div>
                </div>
            )}

            {/* --- CONNECTIONS TAB --- */}
            {activeTab === 'Connections' && (
                <div className="space-y-6">
                    {/* People */}
                    <div>
                        <h3 className="font-bold text-slate-300 text-sm mb-2">People Relationships</h3>
                        <div className="space-y-2 mb-3">
                            {formData.relationships.map(rel => (
                                <div key={rel.personId} className="flex justify-between items-center bg-slate-800 p-2 rounded text-sm">
                                    <div>
                                        <span className="text-slate-200 font-medium">{getPersonName(rel.personId)}</span>
                                        <span className="text-slate-500 text-xs ml-2">is {rel.type}</span>
                                    </div>
                                    <button onClick={() => removeRelationship(rel.personId)} className="text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                             <select value={newRelId} onChange={e => setNewRelId(e.target.value)} className={inputStyle}>
                                <option value="">Select Person...</option>
                                {candidatePeople.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                            </select>
                            <div className="flex gap-2">
                                <select value={newRelType} onChange={e => setNewRelType(e.target.value)} className={`flex-1 ${inputStyle}`}>
                                    {RELATIONSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <button onClick={addRelationship} className="bg-indigo-600 px-3 rounded text-white hover:bg-indigo-700"><Plus size={16}/></button>
                            </div>
                        </div>
                    </div>

                    {/* Entities */}
                    <div className="border-t border-slate-800 pt-4">
                        <h3 className="font-bold text-slate-300 text-sm mb-2">Entity Affiliations</h3>
                        <div className="space-y-2 mb-3">
                             {formData.affiliations.map(aff => (
                                <div key={aff.organizationId} className="flex justify-between items-center bg-slate-800 p-2 rounded text-sm">
                                    <div>
                                        <span className="font-medium text-white">{getOrgName(aff.organizationId)}</span>
                                        <span className="text-xs text-indigo-400 ml-2">{aff.role}</span>
                                    </div>
                                    <button onClick={() => removeAffiliation(aff.organizationId)} className="text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <select value={newOrgId} onChange={e => setNewOrgId(e.target.value)} className={`flex-1 ${inputStyle}`}>
                                    <option value="">Select Organization...</option>
                                    {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                                <button onClick={onAddOrg} className="bg-slate-700 text-slate-300 px-2 rounded hover:bg-slate-600" title="New Org"><Plus size={14}/></button>
                            </div>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Role (e.g. Student)" value={newOrgRole} onChange={e => setNewOrgRole(e.target.value)} className={`flex-1 ${inputStyle}`} />
                                <button onClick={addAffiliation} className="bg-indigo-600 px-3 rounded text-white hover:bg-indigo-700"><Plus size={16}/></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- NOTES TAB --- */}
            {activeTab === 'Notes' && (
                <div className="space-y-4">
                    <div className="flex space-x-2">
                        <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Log interaction..." className={`flex-1 ${inputStyle}`} />
                        <button onClick={addNote} className="bg-indigo-600 px-3 rounded text-white hover:bg-indigo-700"><Plus size={16}/></button>
                    </div>
                    <div className="space-y-3">
                        {formData.notes.map(note => (
                            <div key={note.id} className="bg-slate-800/50 p-3 rounded text-sm">
                                <p className="text-slate-300">{note.text}</p>
                                <p className="text-xs text-slate-500 mt-1">{new Date(note.timestamp).toLocaleString()}</p>
                            </div>
                        ))}
                        {formData.notes.length === 0 && <p className="text-slate-500 italic text-sm">No notes recorded.</p>}
                    </div>
                </div>
            )}

            {/* --- SHARING TAB --- */}
            {activeTab === 'Sharing' && (
                <div className="space-y-6">
                    <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-lg">
                        <h4 className="font-bold text-indigo-100 flex items-center mb-2"><Shield size={16} className="mr-2"/> Sharing Settings</h4>
                        <p className="text-xs text-indigo-300 mb-4">Select specific details to share with other Nexus users.</p>
                        
                        <input type="text" value={shareUserEmail} onChange={e => setShareUserEmail(e.target.value)} placeholder="User Email (e.g. spouse@nexus.app)" className={`${inputStyle} mb-4`} />
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {SHARE_OPTIONS.map(opt => (
                                <label key={opt.id} className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={sharePermissions[opt.id]} 
                                        onChange={e => setSharePermissions({...sharePermissions, [opt.id]: e.target.checked})} 
                                        className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" 
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            ))}
                        </div>
                        <button onClick={handleShare} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded flex items-center justify-center">
                            <Share2 size={16} className="mr-2"/> Share Profile
                        </button>
                    </div>

                    <div>
                        <h4 className="font-bold text-white text-sm mb-2">Active Shares</h4>
                        <div className="space-y-2">
                            {formData.sharedWith.map((share, idx) => (
                                <div key={idx} className="bg-slate-800 p-3 rounded flex justify-between items-center text-sm border border-slate-700">
                                    <div className="flex-1">
                                        <span className="text-white font-bold block mb-1">{share.userId}</span>
                                        <div className="flex flex-wrap gap-1">
                                            {share.fields.map(f => (
                                                <span key={f} className="text-[10px] uppercase font-bold bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <button className="text-slate-500 hover:text-red-400 ml-2"><X size={16}/></button>
                                </div>
                            ))}
                             {formData.sharedWith.length === 0 && <p className="text-slate-500 italic text-sm">Not shared with anyone.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- Add Organization Modal ---
const OrganizationModal = ({ org, onClose, onSave }: { org: Organization | null, onClose: () => void, onSave: (o: Organization) => void }) => {
    const STANDARD_TYPES = ['Business', 'School', 'Medical', 'Community'];
    const [name, setName] = useState(org?.name || '');
    const [address, setAddress] = useState(org?.address || '');
    const initialTypeIsStandard = org && STANDARD_TYPES.includes(org.type);
    const [selectedType, setSelectedType] = useState<string>(org ? (initialTypeIsStandard ? org.type : 'Custom') : 'Business');
    const [customType, setCustomType] = useState<string>((org && !initialTypeIsStandard) ? org.type : '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalType = selectedType === 'Custom' ? customType : selectedType;
        if (!finalType.trim()) return;
        onSave({ id: org?.id || Math.random().toString(36).substr(2, 9), name, type: finalType, address });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-96 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">{org ? 'Edit' : 'Add'} Organization</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                        <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white mb-2" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                            {STANDARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            <option value="Custom">Custom / Other...</option>
                        </select>
                        {selectedType === 'Custom' && (
                            <input type="text" placeholder="Enter custom type" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm" value={customType} onChange={e => setCustomType(e.target.value)} required />
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                        <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold">Save Organization</button>
                </form>
            </div>
        </div>
    );
};

export const PeopleList = () => {
  const { people, organizations, addPerson, updatePerson, addOrganization, updateOrganization } = useAppStore();
  const [viewMode, setViewMode] = useState<'People' | 'Organizations'>('People');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const getOrgName = (id: string) => organizations.find(o => o.id === id)?.name || 'Unknown';
  const handleOpenAddPerson = () => { setSelectedPerson(null); setIsPersonModalOpen(true); };
  const handleOpenEditPerson = (p: Person) => { setSelectedPerson(p); setIsPersonModalOpen(true); };
  const handleSavePerson = (p: Person) => {
    if (people.find(exist => exist.id === p.id)) updatePerson(p);
    else addPerson(p);
  };
  const handleOpenAddOrg = () => { setSelectedOrg(null); setIsOrgModalOpen(true); };
  const handleOpenEditOrg = (o: Organization) => { setSelectedOrg(o); setIsOrgModalOpen(true); };
  const handleSaveOrg = (o: Organization) => {
      if (organizations.find(exist => exist.id === o.id)) updateOrganization(o);
      else addOrganization(o);
  };

  const sortedPeople = [...people].sort((a, b) => (a.isCurrentUser === b.isCurrentUser) ? 0 : a.isCurrentUser ? -1 : 1);

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-white">Network & Relationships</h2>
           <p className="text-slate-400">Manage family, friends, and professional connections.</p>
        </div>
        <div className="flex space-x-2">
            <button onClick={() => setViewMode('People')} className={`px-4 py-2 rounded-lg transition font-medium ${viewMode === 'People' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>People</button>
            <button onClick={() => setViewMode('Organizations')} className={`px-4 py-2 rounded-lg transition font-medium ${viewMode === 'Organizations' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Entities</button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-slate-300 mb-2 px-2 flex items-center"><Share2 size={16} className="mr-2 text-indigo-400"/> Connection Graph</h3>
          <RelationshipGraph people={people} organizations={organizations} />
      </div>
      
      <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">{viewMode === 'People' ? 'Contacts Directory' : 'Entities Directory'}</h3>
          <div className="flex space-x-2">
              {viewMode === 'People' && (
                  <button onClick={() => setIsInviteModalOpen(true)} className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition border border-slate-700">
                      <UserPlus size={20} /><span>Invite User</span>
                  </button>
              )}
              <button onClick={viewMode === 'People' ? handleOpenAddPerson : handleOpenAddOrg} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition">
                <Plus size={20} /><span>Add {viewMode === 'People' ? 'Person' : 'Entity'}</span>
              </button>
          </div>
      </div>

      {viewMode === 'People' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPeople.map(person => (
            <div key={person.id} onClick={() => handleOpenEditPerson(person)} className={`bg-slate-900 border rounded-lg p-6 transition-all flex items-start space-x-4 cursor-pointer group relative ${person.isCurrentUser ? 'border-amber-500/50 hover:border-amber-500' : 'border-slate-800 hover:border-indigo-500'}`}>
                {person.isCurrentUser && <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase rounded tracking-wider">Me</div>}
                <img src={person.avatarUrl || 'https://via.placeholder.com/150'} alt={person.firstName} className={`w-16 h-16 rounded-full border-2 transition-colors ${person.isCurrentUser ? 'border-amber-500' : 'border-slate-700 group-hover:border-indigo-500'}`} />
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">{person.firstName} {person.lastName}</h3>
                    <div className="flex items-center space-x-2 mt-1 mb-3">
                        {person.groups.map(g => <span key={g} className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-400 border border-slate-700">{g}</span>)}
                    </div>
                    <div className="space-y-1 text-sm text-slate-400">
                        {person.emails.length > 0 ? (
                            <div className="flex items-center truncate"><Mail size={14} className="mr-2"/> {person.emails[0].value}</div>
                        ) : (person.phones.length > 0 ? (
                            <div className="flex items-center truncate"><Phone size={14} className="mr-2"/> {person.phones[0].value}</div>
                        ) : null)}
                        
                        {person.linkedUserAccount && (
                            <div className="flex items-center text-emerald-400" title="Linked to App User"><UserCheck size={14} className="mr-2"/> <span className="text-xs">App Linked</span></div>
                        )}
                        {person.affiliations.length > 0 && (
                            <div className="flex items-center mt-2 pt-2 border-t border-slate-800 text-slate-500">
                                <Briefcase size={14} className="mr-2 text-slate-400"/>
                                <span className="text-xs truncate">{person.affiliations[0].role} at {getOrgName(person.affiliations[0].organizationId)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map(org => (
                <div key={org.id} onClick={() => handleOpenEditOrg(org)} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-lg p-6 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center text-indigo-400"><Building size={24} /></div>
                        <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 uppercase font-bold">{org.type}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{org.name}</h3>
                    <p className="text-sm text-slate-400 mb-4">{org.address || "No address listed"}</p>
                    <div className="border-t border-slate-800 pt-4 mt-4">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-2">Affiliated People</p>
                        <div className="flex -space-x-2">
                             {people.filter(p => p.affiliations.some(a => a.organizationId === org.id)).slice(0, 5).map(p => (
                                 <div key={p.id} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs text-white" title={p.firstName}>{p.firstName.charAt(0)}</div>
                             ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
      {isPersonModalOpen && <PersonDetailModal person={selectedPerson} onClose={() => setIsPersonModalOpen(false)} onSave={handleSavePerson} onAddOrg={handleOpenAddOrg} />}
      {isOrgModalOpen && <OrganizationModal org={selectedOrg} onClose={() => setIsOrgModalOpen(false)} onSave={handleSaveOrg} />}
      {isInviteModalOpen && <InviteModal onClose={() => setIsInviteModalOpen(false)} />}
    </div>
  );
};
