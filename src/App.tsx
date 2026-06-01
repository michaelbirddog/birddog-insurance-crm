import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Doc, Id } from '../convex/_generated/dataModel';

type Partner = Doc<'partners'>;
type Contact = Doc<'contacts'>;
type Activity = Doc<'activity'>;
type DocumentWithUrl = Doc<'documents'> & { url: string | null };
type View = 'kanban' | 'table';
type PartnerForm = {
  name: string;
  type: string;
  stage: string;
  website: string;
  appetite: string;
  productsToWrite: string[];
  claimProcess: string;
  ratingProcess: string;
  economics: string;
  notes: string;
};
type ContactDraft = {
  _id?: Id<'contacts'>;
  name: string;
  title: string;
  email: string;
  phone: string;
  role: string;
};

const STAGES = ['To Contact', 'In Progress', 'Won', 'Lost'];
const TYPES = ['Carrier', 'MGA', 'Wholesale Broker', 'Retail Broker', 'Program Administrator', 'Broker'];
const ACTIVITY_TYPES = ['Email', 'Call', 'Meeting', 'Note', 'Submission', 'Quote', 'Stage Change'];
const DOC_CATEGORIES = ['Application', 'Rate Sheet', 'Claims Form', 'Other'];

const stageDot: Record<string, string> = {
  'To Contact': 'dot-to-contact',
  'In Progress': 'dot-in-progress',
  Won: 'dot-won',
  Lost: 'dot-lost',
};
const stageClass: Record<string, string> = {
  'To Contact': 'stage-to-contact',
  'In Progress': 'stage-in-progress',
  Won: 'stage-won',
  Lost: 'stage-lost',
};
const typePill: Record<string, string> = {
  Carrier: 'pill-carrier',
  MGA: 'pill-mga',
  Broker: 'pill-broker',
  'Program Administrator': 'pill-program',
  'Wholesale Broker': 'pill-broker',
  'Retail Broker': 'pill-broker',
};

function partnerToForm(partner?: Partner | null): PartnerForm {
  return {
    name: partner?.name ?? '',
    type: partner?.type ?? 'Carrier',
    stage: partner?.stage ?? 'To Contact',
    website: partner?.website ?? '',
    appetite: partner?.appetite ?? '',
    productsToWrite: partner?.productsToWrite ?? [],
    claimProcess: partner?.claimProcess ?? '',
    ratingProcess: partner?.ratingProcess ?? '',
    economics: partner?.economics ?? '',
    notes: partner?.notes ?? '',
  };
}

const cleanOptional = (value: string) => value.trim() || undefined;
const truncate = (value: string, length: number) => value.length > length ? `${value.slice(0, length)}...` : value;
const formatDate = (date: number) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatShortDate = (date: number) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function App() {
  const partners = useQuery(api.partners.list) ?? [];
  const seedPartners = useMutation(api.seed.seedPartners);
  const updateStage = useMutation(api.partners.updateStage);
  const [view, setView] = useState<View>('kanban');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<Id<'partners'> | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState('');
  const [dragStage, setDragStage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) => [p.name, p.type, p.stage, p.website, p.appetite, p.economics, p.notes, ...(p.productsToWrite ?? [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q));
  }, [partners, search]);

  const counts = useMemo(() => {
    const base = Object.fromEntries(STAGES.map((stage) => [stage, 0])) as Record<string, number>;
    for (const partner of partners) base[partner.stage] = (base[partner.stage] ?? 0) + 1;
    return base;
  }, [partners]);
  const winRate = counts.Won + counts.Lost > 0 ? `${Math.round((counts.Won / (counts.Won + counts.Lost)) * 100)}%` : '-';

  const byStage = useMemo(() => {
    const grouped = Object.fromEntries(STAGES.map((stage) => [stage, [] as Partner[]])) as Record<string, Partner[]>;
    for (const partner of filtered) {
      if (grouped[partner.stage]) grouped[partner.stage].push(partner);
    }
    return grouped;
  }, [filtered]);

  const handleSeed = async () => {
    const result = await seedPartners();
    showToast(result.seeded ? `Seeded ${result.count} partners` : 'Seed skipped');
  };

  const handleStageDrop = async (partnerId: Id<'partners'>, stage: string) => {
    await updateStage({ id: partnerId, stage });
    showToast(`Moved to ${stage}`);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(partners, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `birddog-insurance-partners-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported');
  };

  return (
    <div className="app">
      <div className="header">
        <div className="header-left">
          <h1>Insurance <span className="accent">Partner</span> Pipeline</h1>
          <div className="subtitle">BirdDog Adventures - Carrier & MGA outreach tracker</div>
        </div>
        <div className="header-right">
          <button className="btn" onClick={handleSeed}>Seed Partners</button>
          <button className="btn" onClick={exportJson}>Export JSON</button>
          <button className="btn primary" onClick={() => setCreating(true)}>+ New Partner</button>
        </div>
      </div>

      <div className="storage-notice">
        <div className="storage-notice-text"><strong style={{ color: 'var(--orange)' }}>SAVED TO CONVEX</strong> · Partner profiles, contacts, activity, and documents persist in the shared BirdDog database.</div>
      </div>

      <div className="stats">
        <Stat label="Total Partners" value={partners.length} />
        <Stat label="To Contact" value={counts['To Contact']} />
        <Stat label="In Progress" value={counts['In Progress']} className="accent" />
        <Stat label="Won" value={counts.Won} className="won" />
        <Stat label="Win Rate" value={winRate} className="lost" />
      </div>

      <div className="toolbar">
        <div className="view-tabs">
          <button className={`view-tab ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>Pipeline</button>
          <button className={`view-tab ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>Table</button>
        </div>
        <div className="toolbar-right">
          <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners, contacts, notes..." />
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="kanban">
          {STAGES.map((stage) => (
            <div key={stage} className={`kanban-col ${dragStage === stage ? 'drop' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragStage(stage); }} onDragLeave={() => setDragStage(null)} onDrop={(e) => { e.preventDefault(); setDragStage(null); const id = e.dataTransfer.getData('partnerId') as Id<'partners'>; if (id) void handleStageDrop(id, stage); }}>
              <div className="kanban-col-header">
                <div className="kanban-col-title"><span className={`kanban-col-dot ${stageDot[stage]}`} />{stage}</div>
                <div className="kanban-col-count">{byStage[stage].length}</div>
              </div>
              <div className="kanban-cards">
                {byStage[stage].map((partner) => <PartnerCard key={partner._id} partner={partner} onOpen={() => setSelectedId(partner._id)} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <TableView partners={filtered} onOpen={setSelectedId} />
      )}

      {selectedId && <PartnerModal partnerId={selectedId} onClose={() => setSelectedId(null)} showToast={showToast} />}
      {creating && <PartnerModal onClose={() => setCreating(false)} showToast={showToast} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Stat({ label, value, className = '' }: { label: string; value: string | number; className?: string }) {
  return <div className={`stat ${className}`}><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>;
}

function PartnerCard({ partner, onOpen }: { partner: Partner; onOpen: () => void }) {
  return (
    <div className="card" draggable onDragStart={(e) => { e.dataTransfer.setData('partnerId', partner._id); }} onClick={onOpen}>
      <div className="card-name">{partner.name}</div>
      <div className="card-type">{partner.type}</div>
      <div className="card-meta"><span className={`pill ${typePill[partner.type] ?? 'pill-program'}`}>{partner.type}</span>{partner.productsToWrite.slice(0, 2).map((tag) => <span key={tag} className="pill pill-program">{tag}</span>)}</div>
      <div className="card-last-touch">Updated {formatShortDate(partner.updatedAt)}</div>
    </div>
  );
}

function TableView({ partners, onOpen }: { partners: Partner[]; onOpen: (id: Id<'partners'>) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Partner</th><th>Type</th><th>Stage</th><th>Website</th><th>Appetite</th></tr></thead>
        <tbody>
          {partners.length ? partners.map((partner) => (
            <tr className="row" key={partner._id} onClick={() => onOpen(partner._id)}>
              <td className="td-name">{partner.name}</td>
              <td>{partner.type}</td>
              <td className={`td-stage ${stageClass[partner.stage]}`}>● {partner.stage}</td>
              <td>{partner.website}</td>
              <td>{truncate(partner.appetite ?? '', 90)}</td>
            </tr>
          )) : <tr><td colSpan={5} className="empty">No partners match your search.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function PartnerModal({ partnerId, onClose, showToast }: { partnerId?: Id<'partners'>; onClose: () => void; showToast: (message: string) => void }) {
  const partner = useQuery(api.partners.get, partnerId ? { id: partnerId } : 'skip');
  const contacts = useQuery(api.contacts.listByPartner, partnerId ? { partnerId } : 'skip') ?? [];
  const documents = useQuery(api.documents.listByPartner, partnerId ? { partnerId } : 'skip') ?? [];
  const activity = useQuery(api.activity.listByPartner, partnerId ? { partnerId } : 'skip') ?? [];
  const createPartner = useMutation(api.partners.create);
  const updatePartner = useMutation(api.partners.update);
  const deletePartner = useMutation(api.partners.remove);
  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);
  const deleteContact = useMutation(api.contacts.remove);
  const createActivity = useMutation(api.activity.create);
  const deleteActivity = useMutation(api.activity.remove);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const saveDocument = useMutation(api.documents.saveDocument);
  const deleteDocument = useMutation(api.documents.remove);
  const [form, setForm] = useState<PartnerForm>(partnerToForm(null));
  const [contactsDraft, setContactsDraft] = useState<ContactDraft[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [activityType, setActivityType] = useState('Email');
  const [activityNote, setActivityNote] = useState('');
  const [docCategory, setDocCategory] = useState('Application');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (partner) setForm(partnerToForm(partner));
  }, [partner]);
  useEffect(() => {
    setContactsDraft(contacts.map(contactToDraft));
  }, [contacts]);

  const setField = (field: keyof PartnerForm, value: string | string[]) => setForm((prev) => ({ ...prev, [field]: value }));
  const isNew = !partnerId;

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || form.productsToWrite.includes(tag)) return;
    setForm((prev) => ({ ...prev, productsToWrite: [...prev.productsToWrite, tag] }));
    setTagInput('');
  };

  const saveContacts = async (pid: Id<'partners'>) => {
    for (const row of contactsDraft) {
      if (!row.name.trim()) continue;
      const payload = { name: row.name.trim(), title: cleanOptional(row.title), email: cleanOptional(row.email), phone: cleanOptional(row.phone), role: cleanOptional(row.role) };
      if (row._id) await updateContact({ id: row._id, ...payload });
      else await createContact({ partnerId: pid, ...payload });
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Name is required'); return; }
    const payload = {
      name: form.name.trim(),
      type: form.type,
      stage: form.stage,
      website: cleanOptional(form.website),
      appetite: cleanOptional(form.appetite),
      productsToWrite: form.productsToWrite,
      claimProcess: cleanOptional(form.claimProcess),
      ratingProcess: cleanOptional(form.ratingProcess),
      economics: cleanOptional(form.economics),
      notes: cleanOptional(form.notes),
    };
    if (partnerId) {
      await updatePartner({ id: partnerId, ...payload });
      await saveContacts(partnerId);
      showToast('Saved');
    } else {
      const newId = await createPartner(payload);
      await saveContacts(newId);
      showToast('Partner created');
    }
    onClose();
  };

  const handleDeletePartner = async () => {
    if (!partnerId || !window.confirm(`Delete ${form.name}? This cannot be undone.`)) return;
    await deletePartner({ id: partnerId });
    showToast('Deleted');
    onClose();
  };

  const handleAddActivity = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!partnerId || !activityNote.trim()) return;
    await createActivity({ partnerId, type: activityType, note: activityNote.trim() });
    setActivityNote('');
  };

  const uploadFile = async (file: File) => {
    if (!partnerId) { showToast('Save partner before uploading files'); return; }
    setUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      const json = await result.json() as { storageId: Id<'_storage'> };
      await saveDocument({ partnerId, storageId: json.storageId, fileName: file.name, fileType: cleanOptional(file.type), category: docCategory });
      showToast('Document uploaded');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <input className="modal-title" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Partner name..." />
            <div className="modal-subtitle">{isNew ? 'New Partner' : 'Editing'} · {partner ? `Created ${formatDate(partner.createdAt)}` : 'Unsaved profile'}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="section-divider">Overview</div>
          <div className="field-grid">
            <Field label="Type"><select value={form.type} onChange={(e) => setField('type', e.target.value)}>{TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field>
            <Field label="Stage"><select value={form.stage} onChange={(e) => setField('stage', e.target.value)}>{STAGES.map((stage) => <option key={stage}>{stage}</option>)}</select></Field>
            <Field label="Website" full><input value={form.website} onChange={(e) => setField('website', e.target.value)} placeholder="example.com" /></Field>
          </div>

          <div className="section-divider">Product Fit - what risks they'll write</div>
          <Field label="Appetite" full><textarea value={form.appetite} onChange={(e) => setField('appetite', e.target.value)} placeholder="What lines/risks does this partner cover?" /></Field>
          <div className="tag-row">{form.productsToWrite.map((tag) => <span className="tag-chip" key={tag}>{tag}<button onClick={() => setForm((prev) => ({ ...prev, productsToWrite: prev.productsToWrite.filter((item) => item !== tag) }))}>×</button></span>)}</div>
          <div className="add-tag"><input className="inline-input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add product or line" /><button className="btn" onClick={addTag}>Add</button></div>

          <div className="section-divider">Structured Contacts</div>
          <div className="contact-grid">
            {contactsDraft.map((row, index) => <ContactRow key={row._id ?? index} row={row} setRow={(next) => setContactsDraft((prev) => prev.map((item, i) => i === index ? next : item))} onDelete={async () => { if (row._id) await deleteContact({ id: row._id }); setContactsDraft((prev) => prev.filter((_, i) => i !== index)); }} />)}
            <button className="btn" onClick={() => setContactsDraft((prev) => [...prev, { name: '', title: '', email: '', phone: '', role: '' }])}>+ Add Contact</button>
          </div>

          <div className="section-divider">Claim Process</div>
          <Field label="Claims" full><textarea value={form.claimProcess} onChange={(e) => setField('claimProcess', e.target.value)} placeholder="How claims are filed, contacts, forms, timing." /></Field>
          <div className="section-divider">Rating / Indication Process</div>
          <Field label="Rating process" full><textarea value={form.ratingProcess} onChange={(e) => setField('ratingProcess', e.target.value)} placeholder="How they rate, indication flow, turnaround, required data." /></Field>
          <div className="section-divider">Commission / Economics Terms</div>
          <Field label="Economics" full><textarea value={form.economics} onChange={(e) => setField('economics', e.target.value)} placeholder="Commission %, profit share, minimums, exclusivity terms..." /></Field>
          <div className="section-divider">Notes</div>
          <Field label="Notes" full><textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Context, gut reads, strategic considerations." /></Field>

          <div className="section-divider">Documents</div>
          {partnerId ? <Documents documents={documents} docCategory={docCategory} setDocCategory={setDocCategory} uploadFile={uploadFile} deleteDocument={(id) => deleteDocument({ id })} uploading={uploading} /> : <div className="document-drop">Save this partner before uploading documents.</div>}

          <div className="section-divider">Activity Log</div>
          <div className="activity-log">
            {activity.length ? activity.slice().sort((a, b) => b.date - a.date).map((item) => <ActivityRow key={item._id} item={item} onDelete={() => deleteActivity({ id: item._id })} />) : <div className="activity-empty">No activity yet. Log your first touch below.</div>}
          </div>
          {partnerId && <form className="add-activity" onSubmit={handleAddActivity}><select value={activityType} onChange={(e) => setActivityType(e.target.value)}>{ACTIVITY_TYPES.map((type) => <option key={type}>{type}</option>)}</select><input value={activityNote} onChange={(e) => setActivityNote(e.target.value)} placeholder="What happened?" /><button className="btn primary">Log</button></form>}
        </div>
        <div className="modal-footer">
          <div>{partnerId && <button className="btn danger" onClick={handleDeletePartner}>Delete Partner</button>}</div>
          <div className="modal-footer-right"><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={handleSave}>{isNew ? 'Create' : 'Save'}</button></div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: ReactNode }) {
  return <div className={`field ${full ? 'full' : ''}`}><label>{label}</label>{children}</div>;
}

function contactToDraft(contact: Contact): ContactDraft {
  return { _id: contact._id, name: contact.name, title: contact.title ?? '', email: contact.email ?? '', phone: contact.phone ?? '', role: contact.role ?? '' };
}

function ContactRow({ row, setRow, onDelete }: { row: ContactDraft; setRow: (row: ContactDraft) => void; onDelete: () => void }) {
  return <div className="contact-row"><input className="inline-input" value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} placeholder="Name" /><input className="inline-input" value={row.title} onChange={(e) => setRow({ ...row, title: e.target.value })} placeholder="Title" /><input className="inline-input" value={row.email} onChange={(e) => setRow({ ...row, email: e.target.value })} placeholder="Email" /><input className="inline-input" value={row.phone} onChange={(e) => setRow({ ...row, phone: e.target.value })} placeholder="Phone" /><input className="inline-input" value={row.role} onChange={(e) => setRow({ ...row, role: e.target.value })} placeholder="Role" /><button className="btn danger" onClick={onDelete}>Delete</button></div>;
}

function Documents({ documents, docCategory, setDocCategory, uploadFile, deleteDocument, uploading }: { documents: DocumentWithUrl[]; docCategory: string; setDocCategory: (category: string) => void; uploadFile: (file: File) => void; deleteDocument: (id: Id<'documents'>) => void; uploading: boolean }) {
  const [dragging, setDragging] = useState(false);
  const onFiles = (files: FileList | null) => { if (files?.[0]) void uploadFile(files[0]); };
  return <><div className="field-grid"><Field label="Category"><select value={docCategory} onChange={(e) => setDocCategory(e.target.value)}>{DOC_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field><Field label="Upload"><label className="btn primary" style={{ textAlign: 'center' }}>{uploading ? 'Uploading...' : 'Choose File'}<input type="file" disabled={uploading} onChange={(e) => onFiles(e.target.files)} /></label></Field></div><div className="document-drop" style={{ borderColor: dragging ? 'var(--orange)' : undefined }} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}>Drag a file here or use Choose File.</div><div className="document-list">{documents.map((doc) => <div className="document-item" key={doc._id}><a href={doc.url ?? '#'} target="_blank" rel="noreferrer">{doc.fileName}</a><span className="pill pill-program">{doc.category ?? 'Other'}</span><span className="activity-date">{formatShortDate(doc.uploadedAt)}</span><button className="btn danger" onClick={() => deleteDocument(doc._id)}>Delete</button></div>)}</div></>;
}

function ActivityRow({ item, onDelete }: { item: Activity; onDelete: () => void }) {
  return <div className="activity-item"><div className="activity-date">{formatDate(item.date)}</div><div className="activity-body"><span className="activity-type">{item.type}</span>{item.note}</div><button className="activity-delete" onClick={onDelete}>×</button></div>;
}
