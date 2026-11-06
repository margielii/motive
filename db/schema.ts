import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

// Preserved baseline probe. No application route exposes these records.
export const foundationProbe = sqliteTable("foundation_probe", {
  id: text("id").primaryKey(),
  value: text("value").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const accounts = sqliteTable('accounts', { id:text('id').primaryKey(), email:text('email').notNull().unique(), password:text('password').notNull(), status:text('status').notNull().default('active'), admin:integer('admin').notNull().default(0) });
export const invitations = sqliteTable('invitations', { hash:text('hash').primaryKey(), email:text('email').notNull(), expires:integer('expires').notNull(), used:integer('used').notNull().default(0) });
export const sessions = sqliteTable('sessions', { hash:text('hash').primaryKey(), accountId:text('account_id').notNull().references(()=>accounts.id), expires:integer('expires').notNull() });
export const recovery = sqliteTable('recovery', { hash:text('hash').primaryKey(), accountId:text('account_id').notNull().references(()=>accounts.id), expires:integer('expires').notNull(), used:integer('used').notNull().default(0) });
export const groups = sqliteTable('groups', { id:text('id').primaryKey(), name:text('name').notNull() });
export const groupMembers = sqliteTable('group_members', { groupId:text('group_id').notNull().references(()=>groups.id), accountId:text('account_id').notNull().references(()=>accounts.id), role:text('role').notNull() }, t=>[primaryKey({columns:[t.groupId,t.accountId]})]);
export const plans = sqliteTable('plans', { id:text('id').primaryKey(), groupId:text('group_id').notNull().references(()=>groups.id), title:text('title').notNull() });
export const planMembers = sqliteTable('plan_members', { planId:text('plan_id').notNull().references(()=>plans.id), accountId:text('account_id').notNull().references(()=>accounts.id), role:text('role').notNull() }, t=>[primaryKey({columns:[t.planId,t.accountId]})]);
export const guestGrants = sqliteTable('guest_grants', { hash:text('hash').primaryKey(), planId:text('plan_id').notNull().references(()=>plans.id), expires:integer('expires').notNull(), revoked:integer('revoked').notNull().default(0), used:integer('used').notNull().default(0) });
export const guestSessions = sqliteTable('guest_sessions', { hash:text('hash').primaryKey(), grantHash:text('grant_hash').notNull().references(()=>guestGrants.hash), expires:integer('expires').notNull() });
export const images = sqliteTable('images', { id:text('id').primaryKey(), planId:text('plan_id').notNull().references(()=>plans.id), ownerId:text('owner_id').notNull().references(()=>accounts.id), type:text('type').notNull(), size:integer('size').notNull() });
export const rateLimits = sqliteTable('rate_limits', { key:text('key').primaryKey(), count:integer('count').notNull(), expires:integer('expires').notNull() });

// Permanent one-time initialization ledger. Never remove/reset to recover an account.
export const foundationInstallation = sqliteTable('foundation_installation', {
  id: integer('id').primaryKey(),
  siteId: text('site_id').notNull(),
  instanceId: text('instance_id').notNull(),
  stage: text('stage').notNull(),
  bootstrapId: text('bootstrap_id').notNull(),
  initializedAt: integer('initialized_at').notNull(),
});
