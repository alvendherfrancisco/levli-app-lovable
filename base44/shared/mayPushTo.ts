// "May the caller push the recipient?" for social triggers. Levli's only link
// between two accounts is caregiver access (ProxyAccess): an active grant in
// either direction allows it.
export async function mayPushTo(base44, caller, recipientUserId) {
  const db = base44.asServiceRole.entities.ProxyAccess;
  const [granted, received] = await Promise.all([
    db.filter({ created_by_id: caller.id, grantee_user_id: recipientUserId, status: "active" }),
    db.filter({ created_by_id: recipientUserId, grantee_email: caller.email, status: "active" }),
  ]);
  return granted.length > 0 || received.length > 0;
}