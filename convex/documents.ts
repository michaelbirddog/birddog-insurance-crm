import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const saveDocument = mutation({
  args: {
    partnerId: v.id("partners"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", { ...args, uploadedAt: Date.now() });
  },
});

export const listByPartner = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    const docs = await ctx.db.query("documents").withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId)).collect();
    return await Promise.all(docs.map(async (doc) => ({ ...doc, url: await ctx.storage.getUrl(doc.storageId) })));
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => await ctx.storage.getUrl(args.storageId),
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) return;
    await ctx.storage.delete(doc.storageId);
    await ctx.db.delete(args.id);
  },
});
