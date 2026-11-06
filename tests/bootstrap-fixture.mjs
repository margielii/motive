// Synthetic offline-only intent data. Never reads hosted secrets or request logs.
import {webcrypto,randomBytes,randomUUID,createHash,pbkdf2Sync} from 'node:crypto';
import {serializeBootstrapIntent} from '../lib/bootstrap-intent.mjs';
export const freshToken=()=>randomBytes(32).toString('hex');
export async function makeBootstrap(target,patch={}) {
 const issuedAt=Date.now(),password='synthetic secure operator password',invitation=freshToken(),salt=freshToken();
 const keys=await webcrypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const pub=await webcrypto.subtle.exportKey('jwk',keys.publicKey);
 const intent={version:2,operationId:randomUUID(),...target,issuedAt,expiresAt:issuedAt+3600000,adminEmail:'operator@motive.test',passwordHash:`pbkdf2-sha256$600000$${salt}$${pbkdf2Sync(password,salt,600000,32,'sha256').toString('hex')}`,invitationEmail:'invitee@motive.test',invitationHash:createHash('sha256').update(invitation).digest('hex'),invitationExpiresAt:issuedAt+86400000,publicKey:{kty:'EC',crv:'P-256',x:pub.x,y:pub.y},...patch};
 const signature=Buffer.from(await webcrypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,new TextEncoder().encode(serializeBootstrapIntent(intent)))).toString('hex');
 return {intent,request:{version:'2',operationId:intent.operationId,signature},password,invitation};
}
