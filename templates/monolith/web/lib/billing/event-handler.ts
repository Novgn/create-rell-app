import 'server-only';

// Pure-ish billing event handler for {{projectName}}.
//
// The route handler in app/api/webhooks/clerk-billing/route.ts is a thin
// shell: it verifies the webhook signature, parses the JSON, and delegates
// to `handleBillingEvent` below. Keeping the handler pure (modulo the DB
// write) makes it trivially testable — you can pass a synthetic event
// object and assert which role it would apply.
//
// Supported event types (extend the switch as Clerk Billing grows):
//   - user.created                  → upsert a 'free' row
//   - subscription.created          → upsert role derived from plan
//   - subscription.updated          → upsert role derived from plan
//   - subscription.cancelled        → downgrade to 'free'
//   - subscription.deleted          → downgrade to 'free'
//
// Unknown event types return `{ processed: false }` — the route handler
// translates that into a `200 OK` so Clerk doesn't retry forever.

import { getDb, setUserRole, type Role } from '@{{projectNameKebab}}/shared';

import { planToRole } from './plan-to-role';

/**
 * Minimal shape of the events this handler accepts. We don't pull in the
 * full Clerk type packages because only a few fields are needed and the
 * svix envelope is generic. This interface is a structural subtype that
 * works with whatever Clerk actually sends — extra fields are ignored.
 */
export interface ClerkBillingEvent {
  type: string;
  data: {
    // Present on user.* events.
    id?: string;
    // Present on subscription.* events.
    user_id?: string;
    plan?: { key?: string } | null;
    plan_key?: string;
  };
}

export interface BillingEventResult {
  processed: boolean;
  clerkUserId?: string;
  role?: Role;
}

/**
 * Handle a verified Clerk Billing webhook event. Returns `processed: false`
 * for unknown event types (the route handler turns that into a 200 OK).
 */
export async function handleBillingEvent(event: ClerkBillingEvent): Promise<BillingEventResult> {
  const db = getDb();

  switch (event.type) {
    case 'user.created': {
      const clerkUserId = event.data.id;
      if (!clerkUserId) return { processed: false };
      await setUserRole(db, clerkUserId, 'free');
      return { processed: true, clerkUserId, role: 'free' };
    }

    case 'subscription.created':
    case 'subscription.updated': {
      const clerkUserId = event.data.user_id;
      if (!clerkUserId) return { processed: false };
      const planKey = event.data.plan?.key ?? event.data.plan_key;
      const role = planToRole(planKey);
      await setUserRole(db, clerkUserId, role);
      return { processed: true, clerkUserId, role };
    }

    case 'subscription.cancelled':
    case 'subscription.deleted': {
      const clerkUserId = event.data.user_id;
      if (!clerkUserId) return { processed: false };
      await setUserRole(db, clerkUserId, 'free');
      return { processed: true, clerkUserId, role: 'free' };
    }

    default:
      return { processed: false };
  }
}
