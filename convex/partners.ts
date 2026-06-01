import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const partnerFields = {
  name: v.string(),
  type: v.string(),
  stage: v.string(),
  website: v.optional(v.string()),
  appetite: v.optional(v.string()),
  productsToWrite: v.array(v.string()),
  claimProcess: v.optional(v.string()),
  ratingProcess: v.optional(v.string()),
  economics: v.optional(v.string()),
  notes: v.optional(v.string()),
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("partners").order("asc").collect();
  },
});

export const get = query({
  args: { id: v.id("partners") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: partnerFields,
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("partners", { ...args, createdAt: now, updatedAt: now });
  },
});

export const update = mutation({
  args: { id: v.id("partners"), ...partnerFields },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Partner not found");
    const { id, ...patch } = args;
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
    if (existing.stage !== args.stage) {
      await ctx.db.insert("activity", {
        partnerId: id,
        date: Date.now(),
        type: "Stage Change",
        note: `${existing.stage} to ${args.stage}`,
      });
    }
  },
});

export const updateStage = mutation({
  args: { id: v.id("partners"), stage: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Partner not found");
    if (existing.stage === args.stage) return;
    await ctx.db.patch(args.id, { stage: args.stage, updatedAt: Date.now() });
    await ctx.db.insert("activity", {
      partnerId: args.id,
      date: Date.now(),
      type: "Stage Change",
      note: `${existing.stage} to ${args.stage}`,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("partners") },
  handler: async (ctx, args) => {
    const contacts = await ctx.db.query("contacts").withIndex("by_partner", (q) => q.eq("partnerId", args.id)).collect();
    const docs = await ctx.db.query("documents").withIndex("by_partner", (q) => q.eq("partnerId", args.id)).collect();
    const activities = await ctx.db.query("activity").withIndex("by_partner", (q) => q.eq("partnerId", args.id)).collect();
    for (const contact of contacts) await ctx.db.delete(contact._id);
    for (const doc of docs) {
      await ctx.storage.delete(doc.storageId);
      await ctx.db.delete(doc._id);
    }
    for (const item of activities) await ctx.db.delete(item._id);
    await ctx.db.delete(args.id);
  },
});
