import { ReactNode, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';

type CloseChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  order: number;
};

type Partner = {
  id: string;
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
  closeChecklist: CloseChecklistItem[];
  createdAt: number;
  updatedAt: number;
};
type PartnerRow = {
  id: string;
  name: string;
  type: string;
  stage: string;
  website: string | null;
  appetite: string | null;
  products_to_write: string[] | null;
  claim_process: string | null;
  rating_process: string | null;
  economics: string | null;
  notes: string | null;
  close_checklist: unknown[] | null;
  created_at: string | null;
  updated_at: string | null;
};
type Contact = {
  id: string;
  partner_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
};
type DocumentWithUrl = {
  id: string;
  partner_id: string;
  storage_path: string;
  file_name: string;
  file_type: string | null;
  category: string | null;
  created_at?: string | null;
  uploaded_at?: string | null;
  url: string | null;
};
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
  closeChecklist: CloseChecklistItem[];
};
type ContactDraft = {
  id?: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  role: string;
};

const STAGES = ['To Contact', 'In Progress', 'Won', 'Lost'];
const TYPES = ['Carrier', 'MGA', 'Wholesale Broker', 'Retail Broker', 'Program Administrator', 'Broker'];
const DOC_CATEGORIES = ['Application', 'Rate Sheet', 'Claims Form', 'Other'];
const DEFAULT_CLOSE_CHECKLIST_LABELS = [
  'Intro call held',
  'NDA / confidentiality signed',
  'Appetite guide received',
  'Products / lines to write confirmed',
  'Commission / economics agreed',
  'Application + submission docs received',
  'Sample risk submitted',
  'Binding authority / LOA confirmed',
  'Producer agreement executed',
];

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
    closeChecklist: partner?.closeChecklist ?? makeDefaultCloseChecklist(),
  };
}

const cleanOptional = (value: string) => value.trim() || null;
const truncate = (value: string, length: number) => value.length > length ? `${value.slice(0, length)}...` : value;
const formatDate = (date: number | string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatShortDate = (date: number | string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const dateValue = (value?: string | number | null) => value ? new Date(value).getTime() : Date.now();
const createId = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function makeDefaultCloseChecklist(): CloseChecklistItem[] {
  return DEFAULT_CLOSE_CHECKLIST_LABELS.map((label, index) => ({ id: createId(), label, checked: false, order: index }));
}

function normalizeCloseChecklist(value: unknown): CloseChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Partial<CloseChecklistItem>;
      const label = typeof row.label === 'string' ? row.label.trim() : '';
      if (!label) return null;
      return {
        id: typeof row.id === 'string' && row.id ? row.id : createId(),
        label,
        checked: Boolean(row.checked),
        order: Number.isFinite(row.order) ? Number(row.order) : index,
      };
    })
    .filter((item): item is CloseChecklistItem => Boolean(item))
    .sort((a, b) => a.order - b.order);
}

function checklistStats(items: CloseChecklistItem[]) {
  return { done: items.filter((item) => item.checked).length, total: items.length };
}

function mapPartner(row: PartnerRow): Partner {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    stage: row.stage,
    website: row.website ?? '',
    appetite: row.appetite ?? '',
    productsToWrite: row.products_to_write ?? [],
    claimProcess: row.claim_process ?? '',
    ratingProcess: row.rating_process ?? '',
    economics: row.economics ?? '',
    notes: row.notes ?? '',
    closeChecklist: normalizeCloseChecklist(row.close_checklist),
    createdAt: dateValue(row.created_at),
    updatedAt: dateValue(row.updated_at ?? row.created_at),
  };
}

function toPartnerPayload(form: PartnerForm) {
  return {
    name: form.name.trim(),
    type: form.type,
    stage: form.stage,
    website: cleanOptional(form.website),
    appetite: cleanOptional(form.appetite),
    products_to_write: form.productsToWrite,
    claim_process: cleanOptional(form.claimProcess),
    rating_process: cleanOptional(form.ratingProcess),
    economics: cleanOptional(form.economics),
    notes: cleanOptional(form.notes),
    close_checklist: normalizeCloseChecklist(form.closeChecklist),
    updated_at: new Date().toISOString(),
  };
}

function throwIfError(error: unknown) {
  if (error) throw error;
}

async function createStageActivity(partnerId: string, oldStage: string, newStage: string) {
  if (oldStage === newStage) return;
  const { error } = await supabase.from('activity').insert({
    partner_id: partnerId,
    date: new Date().toISOString(),
    type: 'Stage Change',
    note: `${oldStage} -> ${newStage}`,
  });
  throwIfError(error);
}

export default function App() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('kanban');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState('');
  const [dragStage, setDragStage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const loadPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: true });
      throwIfError(error);
      setPartners(((data ?? []) as PartnerRow[]).map(mapPartner));
    } catch (error) {
      console.error(error);
      showToast('Could not load partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPartners();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) => [p.name, p.type, p.stage, p.website, p.appetite, p.economics, p.notes, ...(p.productsToWrite ?? []), ...p.closeChecklist.map((item) => item.label)]
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
    await loadPartners();
    showToast('Synced from Supabase');
  };

  const handleStageDrop = async (partnerId: string, stage: string) => {
    const partner = partners.find((item) => item.id === partnerId);
    if (!partner || partner.stage === stage) return;
    try {
      const { error } = await supabase.from('partners').update({ stage, updated_at: new Date().toISOString() }).eq('id', partnerId);
      throwIfError(error);
      await createStageActivity(partnerId, partner.stage, stage);
      await loadPartners();
      showToast(`Moved to ${stage}`);
    } catch (error) {
      console.error(error);
      showToast('Move failed');
    }
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
        <div className="storage-notice-text"><strong style={{ color: 'var(--orange)' }}>SAVED TO SUPABASE</strong> · Partner profiles, contacts, activity, and documents persist in the shared BirdDog database.</div>
      </div>

      <div className="stats">
        <Stat label="Total Partners" value={loading ? '...' : partners.length} />
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
            <div key={stage} className={`kanban-col ${dragStage === stage ? 'drop' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragStage(stage); }} onDragLeave={() => setDragStage(null)} onDrop={(e) => { e.preventDefault(); setDragStage(null); const id = e.dataTransfer.getData('partnerId'); if (id) void handleStageDrop(id, stage); }}>
              <div className="kanban-col-header">
                <div className="kanban-col-title"><span className={`kanban-col-dot ${stageDot[stage]}`} />{stage}</div>
                <div className="kanban-col-count">{byStage[stage].length}</div>
              </div>
              <div className="kanban-cards">
                {byStage[stage].map((partner) => <PartnerCard key={partner.id} partner={partner} onOpen={() => setSelectedId(partner.id)} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <TableView partners={filtered} onOpen={setSelectedId} />
      )}

      {selectedId && <PartnerModal partnerId={selectedId} onClose={() => setSelectedId(null)} onSaved={loadPartners} showToast={showToast} />}
      {creating && <PartnerModal onClose={() => setCreating(false)} onSaved={loadPartners} showToast={showToast} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Stat({ label, value, className = '' }: { label: string; value: string | number; className?: string }) {
  return <div className={`stat ${className}`}><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>;
}

function PartnerCard({ partner, onOpen }: { partner: Partner; onOpen: () => void }) {
  const progress = checklistStats(partner.closeChecklist);
  return (
    <div className="card" draggable onDragStart={(e) => { e.dataTransfer.setData('partnerId', partner.id); }} onClick={onOpen}>
      <div className="card-name">{partner.name}</div>
      <div className="card-type">{partner.type}</div>
      <div className="card-meta"><span className={`pill ${typePill[partner.type] ?? 'pill-program'}`}>{partner.type}</span>{partner.productsToWrite.slice(0, 2).map((tag) => <span key={tag} className="pill pill-program">{tag}</span>)}</div>
      <ProgressBadge done={progress.done} total={progress.total} />
      <div className="card-last-touch">Updated {formatShortDate(partner.updatedAt)}</div>
    </div>
  );
}

function ProgressBadge({ done, total }: { done: number; total: number }) {
  return <div className="progress-badge"><span>Path to Close</span><strong>{done} / {total} done</strong></div>;
}

function TableView({ partners, onOpen }: { partners: Partner[]; onOpen: (id: string) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Partner</th><th>Type</th><th>Stage</th><th>Path to Close</th><th>Website</th><th>Appetite</th></tr></thead>
        <tbody>
          {partners.length ? partners.map((partner) => {
            const progress = checklistStats(partner.closeChecklist);
            return (
              <tr className="row" key={partner.id} onClick={() => onOpen(partner.id)}>
                <td className="td-name">{partner.name}</td>
                <td>{partner.type}</td>
                <td className={`td-stage ${stageClass[partner.stage]}`}>● {partner.stage}</td>
                <td><ProgressBadge done={progress.done} total={progress.total} /></td>
                <td>{partner.website}</td>
                <td>{truncate(partner.appetite ?? '', 90)}</td>
              </tr>
            );
          }) : <tr><td colSpan={6} className="empty">No partners match your search.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function PartnerModal({ partnerId, onClose, onSaved, showToast }: { partnerId?: string; onClose: () => void; onSaved: () => Promise<void>; showToast: (message: string) => void }) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [documents, setDocuments] = useState<DocumentWithUrl[]>([]);
  const [form, setForm] = useState<PartnerForm>(partnerToForm(null));
  const [contactsDraft, setContactsDraft] = useState<ContactDraft[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const [docCategory, setDocCategory] = useState('Application');
  const [uploading, setUploading] = useState(false);

  const loadDetails = async () => {
    if (!partnerId) return;
    const [{ data: partnerData, error: partnerError }, { data: contactsData, error: contactsError }, { data: docsData, error: docsError }] = await Promise.all([
      supabase.from('partners').select('*').eq('id', partnerId).single(),
      supabase.from('contacts').select('*').eq('partner_id', partnerId).order('name', { ascending: true }),
      supabase.from('documents').select('*').eq('partner_id', partnerId).order('uploaded_at', { ascending: false }),
    ]);
    throwIfError(partnerError);
    throwIfError(contactsError);
    throwIfError(docsError);
    const mappedPartner = mapPartner(partnerData as PartnerRow);
    const mappedDocs = ((docsData ?? []) as Omit<DocumentWithUrl, 'url'>[]).map((doc) => ({
      ...doc,
      url: supabase.storage.from('partner-docs').getPublicUrl(doc.storage_path).data.publicUrl,
    }));
    setPartner(mappedPartner);
    setForm(partnerToForm(mappedPartner));
    setContacts((contactsData ?? []) as Contact[]);
    setContactsDraft(((contactsData ?? []) as Contact[]).map(contactToDraft));
    setDocuments(mappedDocs);
  };

  useEffect(() => {
    if (!partnerId) return;
    loadDetails().catch((error) => {
      console.error(error);
      showToast('Could not load profile');
    });
  }, [partnerId]);

  const setField = (field: keyof PartnerForm, value: string | string[] | CloseChecklistItem[]) => setForm((prev) => ({ ...prev, [field]: value }));
  const isNew = !partnerId;

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || form.productsToWrite.includes(tag)) return;
    setForm((prev) => ({ ...prev, productsToWrite: [...prev.productsToWrite, tag] }));
    setTagInput('');
  };

  const persistChecklist = async (items: CloseChecklistItem[]) => {
    const next = normalizeCloseChecklist(items);
    setField('closeChecklist', next);
    if (!partnerId) return;
    const { error } = await supabase.from('partners').update({ close_checklist: next, updated_at: new Date().toISOString() }).eq('id', partnerId);
    if (error) { console.error(error); showToast('Checklist save failed'); return; }
    setPartner((prev) => prev ? { ...prev, closeChecklist: next, updatedAt: Date.now() } : prev);
    void onSaved();
  };

  const addChecklistItem = async () => {
    const label = newChecklistLabel.trim();
    if (!label) return;
    const maxOrder = form.closeChecklist.reduce((max, item) => Math.max(max, item.order), -1);
    await persistChecklist([...form.closeChecklist, { id: createId(), label, checked: false, order: maxOrder + 1 }]);
    setNewChecklistLabel('');
  };

  const updateChecklistItem = async (id: string, changes: Partial<CloseChecklistItem>) => {
    await persistChecklist(form.closeChecklist.map((item) => item.id === id ? { ...item, ...changes } : item));
  };

  const deleteChecklistItem = async (id: string) => {
    await persistChecklist(form.closeChecklist.filter((item) => item.id !== id).map((item, index) => ({ ...item, order: index })));
  };

  const saveContacts = async (pid: string) => {
    for (const row of contactsDraft) {
      if (!row.name.trim()) continue;
      const payload = { partner_id: pid, name: row.name.trim(), title: cleanOptional(row.title), email: cleanOptional(row.email), phone: cleanOptional(row.phone), role: cleanOptional(row.role) };
      if (row.id) {
        const { error } = await supabase.from('contacts').update(payload).eq('id', row.id);
        throwIfError(error);
      } else {
        const { error } = await supabase.from('contacts').insert(payload);
        throwIfError(error);
      }
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Name is required'); return; }
    try {
      const payload = toPartnerPayload(form);
      if (partnerId) {
        const oldStage = partner?.stage ?? form.stage;
        const { error } = await supabase.from('partners').update(payload).eq('id', partnerId);
        throwIfError(error);
        await createStageActivity(partnerId, oldStage, form.stage);
        await saveContacts(partnerId);
        showToast('Saved');
      } else {
        const { data, error } = await supabase.from('partners').insert(payload).select('id').single();
        throwIfError(error);
        const newId = (data as { id: string }).id;
        await saveContacts(newId);
        showToast('Partner created');
      }
      await onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      showToast('Save failed');
    }
  };

  const handleDeletePartner = async () => {
    if (!partnerId || !window.confirm(`Delete ${form.name}? This cannot be undone.`)) return;
    try {
      const { data: docs } = await supabase.from('documents').select('storage_path').eq('partner_id', partnerId);
      const paths = ((docs ?? []) as { storage_path: string }[]).map((doc) => doc.storage_path).filter(Boolean);
      if (paths.length) await supabase.storage.from('partner-docs').remove(paths);
      for (const table of ['contacts', 'documents', 'activity']) {
        const { error } = await supabase.from(table).delete().eq('partner_id', partnerId);
        throwIfError(error);
      }
      const { error } = await supabase.from('partners').delete().eq('id', partnerId);
      throwIfError(error);
      await onSaved();
      showToast('Deleted');
      onClose();
    } catch (error) {
      console.error(error);
      showToast('Delete failed');
    }
  };


  const uploadFile = async (file: File) => {
    if (!partnerId) { showToast('Save partner before uploading files'); return; }
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${partnerId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('partner-docs').upload(storagePath, file, { contentType: file.type || undefined });
      throwIfError(uploadError);
      const { error: insertError } = await supabase.from('documents').insert({ partner_id: partnerId, storage_path: storagePath, file_name: file.name, file_type: cleanOptional(file.type), category: docCategory, uploaded_at: new Date().toISOString() });
      throwIfError(insertError);
      await loadDetails();
      showToast('Document uploaded');
    } catch (error) {
      console.error(error);
      showToast('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (doc: DocumentWithUrl) => {
    const { error: storageError } = await supabase.storage.from('partner-docs').remove([doc.storage_path]);
    if (storageError) console.error(storageError);
    const { error } = await supabase.from('documents').delete().eq('id', doc.id);
    if (error) { console.error(error); showToast('Delete failed'); return; }
    setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
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
            {contactsDraft.map((row, index) => <ContactRow key={row.id ?? index} row={row} setRow={(next) => setContactsDraft((prev) => prev.map((item, i) => i === index ? next : item))} onDelete={async () => { if (row.id) { const { error } = await supabase.from('contacts').delete().eq('id', row.id); if (error) { console.error(error); showToast('Contact delete failed'); return; } setContacts((prev) => prev.filter((item) => item.id !== row.id)); } setContactsDraft((prev) => prev.filter((_, i) => i !== index)); }} />)}
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
          {partnerId ? <Documents documents={documents} docCategory={docCategory} setDocCategory={setDocCategory} uploadFile={uploadFile} deleteDocument={removeDocument} uploading={uploading} /> : <div className="document-drop">Save this partner before uploading documents.</div>}

          <div className="section-divider section-divider-split"><span>Path to Close</span><ProgressBadge done={checklistStats(form.closeChecklist).done} total={checklistStats(form.closeChecklist).total} /></div>
          <CloseChecklist
            items={form.closeChecklist}
            newLabel={newChecklistLabel}
            setNewLabel={setNewChecklistLabel}
            onAdd={addChecklistItem}
            onRename={(id, label) => updateChecklistItem(id, { label })}
            onToggle={(id, checked) => updateChecklistItem(id, { checked })}
            onDelete={deleteChecklistItem}
          />
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
  return { id: contact.id, name: contact.name, title: contact.title ?? '', email: contact.email ?? '', phone: contact.phone ?? '', role: contact.role ?? '' };
}

function ContactRow({ row, setRow, onDelete }: { row: ContactDraft; setRow: (row: ContactDraft) => void; onDelete: () => void }) {
  return <div className="contact-row"><input className="inline-input" value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} placeholder="Name" /><input className="inline-input" value={row.title} onChange={(e) => setRow({ ...row, title: e.target.value })} placeholder="Title" /><input className="inline-input" value={row.email} onChange={(e) => setRow({ ...row, email: e.target.value })} placeholder="Email" /><input className="inline-input" value={row.phone} onChange={(e) => setRow({ ...row, phone: e.target.value })} placeholder="Phone" /><input className="inline-input" value={row.role} onChange={(e) => setRow({ ...row, role: e.target.value })} placeholder="Role" /><button className="btn danger" onClick={onDelete}>Delete</button></div>;
}

function Documents({ documents, docCategory, setDocCategory, uploadFile, deleteDocument, uploading }: { documents: DocumentWithUrl[]; docCategory: string; setDocCategory: (category: string) => void; uploadFile: (file: File) => void; deleteDocument: (doc: DocumentWithUrl) => void; uploading: boolean }) {
  const [dragging, setDragging] = useState(false);
  const onFiles = (files: FileList | null) => { if (files?.[0]) void uploadFile(files[0]); };
  return <><div className="field-grid"><Field label="Category"><select value={docCategory} onChange={(e) => setDocCategory(e.target.value)}>{DOC_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field><Field label="Upload"><label className="btn primary" style={{ textAlign: 'center' }}>{uploading ? 'Uploading...' : 'Choose File'}<input type="file" disabled={uploading} onChange={(e) => onFiles(e.target.files)} /></label></Field></div><div className="document-drop" style={{ borderColor: dragging ? 'var(--orange)' : undefined }} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}>Drag a file here or use Choose File.</div><div className="document-list">{documents.map((doc) => <div className="document-item" key={doc.id}><a href={doc.url ?? '#'} target="_blank" rel="noreferrer">{doc.file_name}</a><span className="pill pill-program">{doc.category ?? 'Other'}</span><span className="activity-date">{formatShortDate(doc.created_at ?? doc.uploaded_at ?? Date.now())}</span><button className="btn danger" onClick={() => deleteDocument(doc)}>Delete</button></div>)}</div></>;
}

function CloseChecklist({ items, newLabel, setNewLabel, onAdd, onRename, onToggle, onDelete }: { items: CloseChecklistItem[]; newLabel: string; setNewLabel: (value: string) => void; onAdd: () => Promise<void>; onRename: (id: string, label: string) => Promise<void>; onToggle: (id: string, checked: boolean) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const sortedItems = items.slice().sort((a, b) => Number(a.checked) - Number(b.checked) || a.order - b.order);
  return (
    <div className="close-checklist">
      {sortedItems.length ? sortedItems.map((item) => (
        <div className={`checklist-item ${item.checked ? 'done' : ''}`} key={item.id}>
          <input type="checkbox" checked={item.checked} onChange={(event) => { void onToggle(item.id, event.target.checked); }} />
          <input className="checklist-label" defaultValue={item.label} onBlur={(event) => { const label = event.target.value.trim(); if (label && label !== item.label) void onRename(item.id, label); }} />
          <button className="activity-delete" onClick={() => { void onDelete(item.id); }}>×</button>
        </div>
      )) : <div className="activity-empty">No close steps yet. Add the next blocker below.</div>}
      <div className="add-checklist-item">
        <input className="inline-input" value={newLabel} onChange={(event) => setNewLabel(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void onAdd(); } }} placeholder="Add close step" />
        <button className="btn" onClick={() => { void onAdd(); }}>Add</button>
      </div>
    </div>
  );
}
