// OFFLINE preparation only. Does not connect to or modify any database.
// Run in a private terminal. Treat the displayed code as a password.
import { randomBytes, createHash } from 'node:crypto';
const email = (process.argv[2] ?? '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Supply the verified recipient email');
const token = randomBytes(32).toString('hex');
const hash = createHash('sha256').update(token).digest('hex');
console.log('Share this invitation privately with the verified recipient (valid 24 hours):\n' + token);
console.log('\nOperator SQL; review before applying to the intended MOTIVE database:\n' +
  `INSERT INTO invitations(hash,email,expires,used) VALUES ('${hash}','${email.replaceAll("'", "''")}',${Date.now()+86400000},0);`);
