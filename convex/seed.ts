import { mutation } from "./_generated/server";

const seedPartnerData = [
  { name: "Outdoor Underwriters (MMA)", type: "MGA", stage: "To Contact", appetite: "Hunt lease liability, timberland, guides & outfitters. Strongest direct fit for Teddy hunting experiences.", website: "outdoorund.com", notes: "Top priority. Direct overlap with hunt lease product. Owned by McGriff/Marsh.", economics: "", decisionMakers: "" },
  { name: "Lockton Affinity Outdoor", type: "Program Administrator", stage: "To Contact", appetite: "Affinity program administrator. Could white-label or co-brand a Teddy landowner program.", website: "locktonaffinityoutdoor.com", notes: "Affinity model fits platform play. Ask about minimum policy count to launch a program.", economics: "", decisionMakers: "" },
  { name: "Markel Programs", type: "Carrier", stage: "To Contact", appetite: "Carrier with program business intake. Writes recreational, equine, sporting clubs.", website: "markel.com", notes: "Submit through program intake. Higher bar. They want established producers/MGAs.", economics: "", decisionMakers: "" },
  { name: "Philadelphia Insurance Companies", type: "Carrier", stage: "To Contact", appetite: "Great Outdoors Program. Hunting clubs, fishing camps, outfitters. Direct product fit.", website: "phly.com", notes: "Tokio Marine subsidiary. Great Outdoors Program is exactly our lane.", economics: "", decisionMakers: "" },
  { name: "Great American Insurance Group", type: "Carrier", stage: "To Contact", appetite: "AgriBusiness and Equine divisions. Covers farms, ranches, equine ops.", website: "greatamericaninsurancegroup.com", notes: "AgriBusiness side aligns with Section 180 / land services customer base.", economics: "", decisionMakers: "" },
  { name: "Burlington Insurance / IFG Companies", type: "Carrier", stage: "To Contact", appetite: "E&S carrier. Accessed via wholesale only. Need a wholesale partner for distribution.", website: "iicgrp.com", notes: "Wholesale-only. No direct retail. Pair with Breckenridge or similar.", economics: "", decisionMakers: "" },
  { name: "HDI Global Insurance", type: "Carrier", stage: "To Contact", appetite: "Specialty lines carrier. International parent (Talanx). Niche/large risk appetite.", website: "hdi.global", notes: "Specialty/large risk. May be overkill for individual lease policies but useful for aggregated program.", economics: "", decisionMakers: "" },
  { name: "AssuredPartners (Davis-Garvin)", type: "Retail Broker", stage: "To Contact", appetite: "Retail broker administering the Nationwide Hunt Club program. Direct competitor or partner.", website: "davisgarvin.com", notes: "Davis-Garvin runs the dominant Nationwide hunt club program. Partnership or compete.", economics: "", decisionMakers: "" },
  { name: "Breckenridge Insurance Services", type: "Wholesale Broker", stage: "To Contact", appetite: "Wholesale broker. Outdoors/Recreational program, huntleasebind.com binding authority.", website: "huntleasebind.com", notes: "Has bind authority via huntleasebind.com. Fastest path to live quotes.", economics: "", decisionMakers: "" },
  { name: "McNeil & Company (AdvenSure)", type: "MGA", stage: "To Contact", appetite: "AdvenSure program (backed by Arch). Outdoor recreation & hospitality. Adventure operators, lodges.", website: "mcneilandcompany.com", notes: "Arch paper via AdvenSure. Strong for hospitality/adventure side of Teddy.", economics: "", decisionMakers: "" },
  { name: "Chubb / Westchester Programs", type: "Carrier", stage: "To Contact", appetite: "Carrier. E&S programs intake via Westchester. Wide appetite if scale is there.", website: "chubb.com", notes: "High bar. They want material premium volume. Approach with a program prospectus.", economics: "", decisionMakers: "" },
  { name: "River Valley Underwriters", type: "MGA", stage: "To Contact", appetite: "Regional MGA. Guides & outfitters specialty. Geographic focus.", website: "rivervalleyunderwriters.com", notes: "Regional. Check footprint vs. where our landowners cluster.", economics: "", decisionMakers: "" },
  { name: "Next Wave Insurance Services", type: "Program Administrator", stage: "To Contact", appetite: "Program administrator. Builds and runs specialty programs.", website: "nextwaveins.com", notes: "Program-builder model. Could architect a Teddy-specific program from scratch.", economics: "", decisionMakers: "" }
];

export const seedPartnersIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("partners").first();
    if (existing) return { seeded: false, count: 0, reason: "partners table is not empty" };
    const now = Date.now();
    for (const partner of seedPartnerData) {
      const partnerId = await ctx.db.insert("partners", {
        name: partner.name,
        type: partner.type,
        stage: partner.stage,
        website: partner.website,
        appetite: partner.appetite,
        productsToWrite: [],
        claimProcess: "",
        ratingProcess: "",
        economics: partner.economics,
        notes: partner.notes,
        createdAt: now,
        updatedAt: now,
      });
      if (partner.decisionMakers.trim()) {
        await ctx.db.insert("contacts", { partnerId, name: partner.decisionMakers.trim() });
      }
    }
    return { seeded: true, count: seedPartnerData.length };
  },
});

export const seedPartners = seedPartnersIfEmpty;
