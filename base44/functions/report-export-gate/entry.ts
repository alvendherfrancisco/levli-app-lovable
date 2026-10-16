import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { hasCompedAccess } from '../../shared/compedAccess.ts';

// The server-side half of the doctor report's Premium lock.
//
// The report screen builds the PDF on the device, so this is the check that has
// to answer before anything is built: the screen calls it at the top of its own
// export, and the export stops there unless the account is entitled (see
// src/pages/ReportPage.jsx). Entitlement is read the same way the app reads it —
// see src/lib/SubscriptionContext.jsx and src/lib/compedAccess.js — so a locked
// screen can never be the only thing standing between an account and the PDF.

const nowSec = () => Math.floor(Date.now() / 1000);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (hasCompedAccess(user.email)) {
      return Response.json({ allowed: true, source: 'complimentary' });
    }

    // The App Store entitlement, from the record the app itself reconciles
    // against (src/lib/subscriptionHandler.js): the newest record decides.
    const subs = await base44.asServiceRole.entities.UserSubscription.filter(
      { user_id: user.id },
      '-expiration_date',
      1,
    );
    const expires = Number(subs?.[0]?.expiration_date ?? 0);
    if (Number.isFinite(expires) && expires > nowSec()) {
      return Response.json({ allowed: true, source: 'subscription' });
    }

    // The plan written on the profile by the same reconciliation.
    const profiles = await base44.asServiceRole.entities.UserProfile.filter(
      { created_by_id: user.id },
      '-created_date',
      1,
    );
    const profile = profiles?.[0] ?? null;
    const status = String(profile?.subscription_status || '');
    const plan = String(profile?.plan_type || '');
    const allowed = status === 'active' || status === 'trialing' || (plan === 'lifetime' && status === 'active');

    return Response.json({ allowed, source: allowed ? 'profile' : 'none' });
  } catch (error) {
    console.error('report-export-gate failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}