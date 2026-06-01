import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  partners: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_stage", ["stage"]).index("by_name", ["name"]),
  contacts: defineTable({
    partnerId: v.id("partners"),
    name: v.string(),
    title: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
  }).index("by_partner", ["partnerId"]),
  documents: defineTable({
    partnerId: v.id("partners"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.optional(v.string()),
    category: v.optional(v.string()),
    uploadedAt: v.number(),
  }).index("by_partner", ["partnerId"]),
  activity: defineTable({
    partnerId: v.id("partners"),
    date: v.number(),
    type: v.string(),
    note: v.string(),
  }).index("by_partner", ["partnerId"]).index("by_partner_date", ["partnerId", "date"]),
});
