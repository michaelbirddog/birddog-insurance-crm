import { action } from "./_generated/server";

export const health = action({
  args: {},
  handler: async () => ({ ok: true, app: "BirdDog Insurance Partner CRM" }),
});
