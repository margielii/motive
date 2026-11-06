// Offline only. No credentials in arguments, stdout, HTTP headers, bodies or replies.
// Writes one exclusive mode-0600 bundle OUTSIDE this checkout. Never upload it.
import {randomBytes,randomUUID,createHash,pbkdf2Sync,webcrypto} from 'node:crypto';
import {readFile,writeFile,realpath} from 'node:fs/promises';
import {resolve,dirname,basename,relative,sep,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {serializeBootstrapIntent} from '../lib/bootstrap-intent.mjs';
const [instancePath,adminEmail,invitationEmail,outputPath]=process.argv.slice(2);
const validEmail=s=>typeof s==='string'&&s===s.trim().toLowerCase()&&s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
if(!instancePath||!outputPath||!validEmail(adminEmail)||!validEmail(invitationEmail)||adminEmail===invitationEmail)throw new Error('Supply verified instance JSON path, admin email, invitee email and a private output path outside the checkout');
const root=await realpath(fileURLToPath(new URL('..',import.meta.url)));
const directory=await realpath(dirname(resolve(outputPath)));
const location=relative(root,directory);
if(!(location==='..'||location.startsWith('..'+sep)||isAbsolute(location)))throw new Error('Private output must be outside the checkout');
const target=JSON.parse(await readFile(instancePath,'utf8'));
const hosting=JSON.parse(await readFile(new URL('../.openai/hosting.json',import.meta.url),'utf8'));
if(target.siteId!==hosting.project_id||!/^[a-f0-9-]{36}$/.test(target.instanceId)||!['local','staging','production'].includes(target.stage))throw new Error('Instance must match the reviewed build target; do not regenerate its identity');
const password=randomBytes(32).toString('hex'),salt=randomBytes(32).toString('hex'),invitation=randomBytes(32).toString('hex'),issuedAt=Date.now();
const keys=await webcrypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const jwk=await webcrypto.subtle.exportKey('jwk',keys.publicKey);
const intent={version:2,operationId:randomUUID(),siteId:target.siteId,instanceId:target.instanceId,stage:target.stage,issuedAt,expiresAt:issuedAt+1800000,adminEmail,passwordHash:`pbkdf2-sha256$600000$${salt}$${pbkdf2Sync(password,salt,600000,32,'sha256').toString('hex')}`,invitationEmail,invitationHash:createHash('sha256').update(invitation).digest('hex'),invitationExpiresAt:issuedAt+86400000,publicKey:{kty:'EC',crv:'P-256',x:jwk.x,y:jwk.y}};
const signature=Buffer.from(await webcrypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,new TextEncoder().encode(serializeBootstrapIntent(intent)))).toString('hex');
const bundle={runtimeValue:{key:'MOTIVE_BOOTSTRAP_V2',is_secret:true,value:JSON.stringify(intent)},request:{method:'POST',path:'/api/foundation/bootstrap',headers:{'Content-Type':'application/json'},body:{version:'2',operationId:intent.operationId,signature}},privateCredentials:{adminEmail,password,invitationEmail,invitationCode:invitation},warning:'Configure only after exact target approval. Only request is suitable for HTTP; never transmit the bundle or credentials. Private signing key was not exported.'};
await writeFile(resolve(directory,basename(outputPath)),JSON.stringify(bundle,null,2)+'\n',{flag:'wx',mode:0o600});
console.log('Prepared private offline bundle. No credentials printed; no network or hosted operation performed.');
