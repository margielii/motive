// Domain-separated, deterministic encoding shared by the offline signer and Worker.
// This message stays server-side; HTTP carries only operationId + its signature.
export function serializeBootstrapIntent(p) {
  return JSON.stringify(['MOTIVE_BOOTSTRAP_V2',p.operationId,p.siteId,p.instanceId,p.stage,p.issuedAt,p.expiresAt,p.adminEmail,p.passwordHash,p.invitationEmail,p.invitationHash,p.invitationExpiresAt,p.publicKey.x,p.publicKey.y]);
}
