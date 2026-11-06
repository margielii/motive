import { boundary } from '../server/boundary';
const worker = { async fetch(req:Request, env:Cloudflare.Env) { return await boundary(req,env) ?? new Response('public-shell'); } };

export default worker;
