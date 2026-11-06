// Offline preparation only. Output contains a fresh bootstrap credential: use a
// private terminal, never commit/log it, and do not pass it in command arguments.
// This helper performs no networking, writes no files and changes no resources.
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const [stage,adminEmail,invitationEmail]=process.argv.slice(2);
const validEmail=s=>typeof s==='string'&&s===s.trim().toLowerCase()&&s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
if(!['local','staging','production'].includes(stage)||!validEmail(adminEmail)||!validEmail(invitationEmail)||adminEmail===invitationEmail)throw new Error('Supply stage, verified admin email, and a different verified first invitee email');
const hosting=JSON.parse(await readFile(new URL('../.openai/hosting.json',import.meta.url),'utf8'));
const target={siteId:hosting.project_id,instanceId:randomUUID(),stage};
const raw=randomBytes(32).toString('hex'),issuedAt=Date.now();
console.log(JSON.stringify({
  warning:'PRIVATE OUTPUT. Offline preparation does not authorize deployment or initialization. Configure only the separately approved MOTIVE target.',
  runtimeValues:[
    {key:'MOTIVE_INSTANCE',value:JSON.stringify(target),is_secret:false},
    {key:'MOTIVE_BOOTSTRAP',value:JSON.stringify({tokenHash:createHash('sha256').update(raw).digest('hex'),issuedAt,expiresAt:issuedAt+1800000,adminEmail}),is_secret:true},
  ],
  request:{method:'POST',path:'/api/foundation/bootstrap',headers:{'X-Motive-Bootstrap':raw,'Content-Type':'application/json'},body:{...target,adminEmail,invitationEmail}},
  requiredAtExecution:['Use the exact approved Site origin as Origin header','Enter an admin password privately (12–128 characters)','Add confirm: INITIALIZE MOTIVE ONCE after reviewing siteId, instanceId and stage'],
},null,2));
