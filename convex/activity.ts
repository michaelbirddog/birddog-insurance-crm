import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByPartner = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activity")
      .withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId))
      .collect();
  },
});

export const create = mutation({
  args: { partnerId: v.id("partners"), type: v.string(), note: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activity", { ...args, date: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("activity") },
  handler: async (ctx, args) => await ctx.db.delete(args.id),
});
