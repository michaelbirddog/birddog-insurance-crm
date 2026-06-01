import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByPartner = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    return await ctx.db.query("contacts").withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId)).collect();
  },
});

export const create = mutation({
  args: {
    partnerId: v.id("partners"),
    name: v.string(),
    title: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => await ctx.db.insert("contacts", args),
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    name: v.string(),
    title: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => await ctx.db.delete(args.id),
});
