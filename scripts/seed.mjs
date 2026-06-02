import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import WebSocket from 'ws';

const supabaseUrl = 'https://bqqsvrzalmttczgpicxs.supabase.co';
const serviceKey = readFileSync('/tmp/bd_ins_svc.txt', 'utf8').trim();
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket },
});

const defaultCloseChecklist = [
  'Intro call held',
  'NDA / confidentiality signed',
  'Appetite guide received',
  'Products / lines to write confirmed',
  'Commission / economics agreed',
  'Application + submission docs received',
  'Sample risk submitted',
  'Binding authority / LOA confirmed',
  'Producer agreement executed',
].map((label, index) => ({
  id: `default-${index + 1}`,
  label,
  checked: false,
  order: index,
}));

const seedPartners = [
  { name: 'Outdoor Underwriters (MMA)', type: 'MGA', stage: 'To Contact', productFit: 'Hunt lease liability, timberland, guides & outfitters. Strongest direct fit for Teddy hunting experiences.', website: 'outdoorund.com', notes: 'Top priority — direct overlap with hunt lease product. Owned by McGriff/Marsh.' },
  { name: 'Lockton Affinity Outdoor', type: 'Program Administrator', stage: 'To Contact', productFit: 'Affinity program administrator — could white-label or co-brand a Teddy landowner program.', website: 'locktonaffinityoutdoor.com', notes: 'Affinity model fits platform play. Ask about minimum policy count to launch a program.' },
  { name: 'Markel Programs', type: 'Carrier', stage: 'To Contact', productFit: 'Carrier with program business intake. Writes recreational, equine, sporting clubs.', website: 'markel.com', notes: 'Submit through program intake. Higher bar — they want established producers/MGAs.' },
  { name: 'Philadelphia Insurance Companies', type: 'Carrier', stage: 'To Contact', productFit: 'Great Outdoors Program — hunting clubs, fishing camps, outfitters. Direct product fit.', website: 'phly.com', notes: 'Tokio Marine subsidiary. Great Outdoors Program is exactly our lane.' },
  { name: 'Great American Insurance Group', type: 'Carrier', stage: 'To Contact', productFit: 'AgriBusiness and Equine divisions — covers farms, ranches, equine ops.', website: 'greatamericaninsurancegroup.com', notes: 'AgriBusiness side aligns with Section 180 / land services customer base.' },
  { name: 'Burlington Insurance / IFG Companies', type: 'Carrier', stage: 'To Contact', productFit: 'E&S carrier — accessed via wholesale only. Need a wholesale partner for distribution.', website: 'iicgrp.com', notes: 'Wholesale-only — no direct retail. Pair with Breckenridge or similar.' },
  { name: 'HDI Global Insurance', type: 'Carrier', stage: 'To Contact', productFit: 'Specialty lines carrier — international parent (Talanx). Niche/large risk appetite.', website: 'hdi.global', notes: 'Specialty/large risk — may be overkill for individual lease policies but useful for aggregated program.' },
  { name: 'AssuredPartners (Davis-Garvin)', type: 'Retail Broker', stage: 'To Contact', productFit: 'Retail broker administering the Nationwide Hunt Club program. Direct competitor or partner.', website: 'davisgarvin.com', notes: 'Davis-Garvin runs the dominant Nationwide hunt club program. Partnership or compete.' },
  { name: 'Breckenridge Insurance Services', type: 'Wholesale Broker', stage: 'To Contact', productFit: 'Wholesale broker — Outdoors/Recreational program, huntleasebind.com binding authority.', website: 'huntleasebind.com', notes: 'Has bind authority via huntleasebind.com — fastest path to live quotes.' },
  { name: 'McNeil & Company (AdvenSure)', type: 'MGA', stage: 'To Contact', productFit: 'AdvenSure program (backed by Arch) — outdoor recreation & hospitality. Adventure operators, lodges.', website: 'mcneilandcompany.com', notes: 'Arch paper via AdvenSure. Strong for hospitality/adventure side of Teddy.' },
  { name: 'Chubb / Westchester Programs', type: 'Carrier', stage: 'To Contact', productFit: 'Carrier — E&S programs intake via Westchester. Wide appetite if scale is there.', website: 'chubb.com', notes: 'High bar — they want material premium volume. Approach with a program prospectus.' },
  { name: 'River Valley Underwriters', type: 'MGA', stage: 'To Contact', productFit: 'Regional MGA — guides & outfitters specialty. Geographic focus.', website: 'rivervalleyunderwriters.com', notes: 'Regional — check footprint vs. where our landowners cluster.' },
  { name: 'Next Wave Insurance Services', type: 'Program Administrator', stage: 'To Contact', productFit: 'Program administrator — builds and runs specialty programs.', website: 'nextwaveins.com', notes: 'Program-builder model — could architect a Teddy-specific program from scratch.' },
];

const { count, error: countError } = await supabase
  .from('partners')
  .select('id', { count: 'exact', head: true });

if (countError) throw countError;

if ((count ?? 0) > 0) {
  console.log(`Seed skipped: partners table already has ${count} rows.`);
  process.exit(0);
}

const now = new Date().toISOString();
const rows = seedPartners.map((partner) => ({
  name: partner.name,
  type: partner.type,
  stage: partner.stage,
  website: partner.website,
  appetite: partner.productFit,
  products_to_write: [],
  claim_process: null,
  rating_process: null,
  economics: null,
  notes: partner.notes,
  close_checklist: defaultCloseChecklist,
  created_at: now,
  updated_at: now,
}));

const { error: insertError } = await supabase.from('partners').insert(rows);
if (insertError) throw insertError;

console.log(`Seeded ${rows.length} partners.`);
