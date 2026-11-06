'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

type Row = { id: string; title?: string; name?: string };
export default function Home() {
  const [user, setUser] = useState<{email:string;admin:boolean}|null>(null);
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');
  const [groups, setGroups] = useState<Row[]>([]);
  const [plans, setPlans] = useState<Row[]>([]);
  const [selected, setSelected] = useState('');
  const [images, setImages] = useState<Row[]>([]);
  async function api<T = Record<string,string>>(path: string, method='GET', body?: unknown) {
    const response = await fetch(path,{method, headers:body instanceof File ? {'Content-Type':body.type} : {'Content-Type':'application/json'}, body:body instanceof File ? body : body ? JSON.stringify(body) : undefined});
    const result = await response.json() as T & {error?:string};
    if (!response.ok) throw new Error(result.error ?? 'Request failed');
    return result;
  }
  async function refresh() {
    try { setUser(await api<{email:string;admin:boolean}>('/api/auth/me')); setGroups(await api<Row[]>('/api/groups')); setPlans(await api<Row[]>('/api/plans')); } catch { setUser(null); }
  }
  useEffect(()=>{ queueMicrotask(() => { void refresh(); }); if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function submit(event: FormEvent<HTMLFormElement>, action: (data: Record<string,string>)=>Promise<void>) {
    event.preventDefault(); setMessage('');
    const form = event.currentTarget;
    try { await action(Object.fromEntries(new FormData(form)) as Record<string,string>); } catch(e) { setMessage(e instanceof Error ? e.message : 'Request failed'); }
  }
  async function openPlan(id:string) { try { const p=await api(`/api/plans/${encodeURIComponent(id)}`); setSelected(p.id); setImages(await api<Row[]>(`/api/plans/${encodeURIComponent(id)}/images`)); } catch(e) { setMessage(String(e)); } }
  return <main className="motive-shell">
    <header><Link href="/" aria-label="Motive home">MOTIVE<span>Make room for the plan.</span></Link>{user && <button onClick={async()=>{await api('/api/auth/logout','POST');setUser(null);setGroups([]);setPlans([]);setImages([]);setSelected('');}}>Log out</button>}</header>
    <div role="status" aria-live="polite">{message}</div>
    {!user ? <section><p className="eyebrow">A private place to get together</p><h1>Good plans start here.</h1><p>MOTIVE is invitation only. Ask your organizer for an invitation code.</p>
      <nav aria-label="Account"><button onClick={()=>setMode('login')}>Sign in</button><button onClick={()=>setMode('register')}>Accept invitation</button><button onClick={()=>setMode('recover')}>Recover account</button></nav>
      <form onSubmit={e=>submit(e,async data=>{await api(`/api/auth/${mode}`,'POST',data);setMessage(mode==='recover'?'Password reset. Sign in with your new password.':'Welcome to MOTIVE.');await refresh();})}>
        <h2>{mode==='login'?'Welcome back':mode==='register'?'Your invitation':'Recover access'}</h2>
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
        {mode!=='login' && <label>{mode==='register'?'Invitation code':'Recovery code'}<input name="token" required autoComplete="off" minLength={64} maxLength={64}/></label>}
        <label>{mode==='login'?'Password':'New password (12–128 characters)'}<input name="password" type="password" autoComplete={mode==='login'?'current-password':'new-password'} required minLength={12} maxLength={128}/></label>
        <button type="submit">{mode==='login'?'Sign in':mode==='register'?'Create account':'Reset password'}</button>
      </form><p>Recovery codes come from an administrator after identity verification. No email delivery is required.</p>
      <form onSubmit={e=>submit(e,async data=>{await api('/api/guest/redeem','POST',data);await openPlan(data.planId);})}><h2>Invited to a plan?</h2><label>Guest code<input name="token" required autoComplete="off"/></label><label>Plan ID<input name="planId" required/></label><button>Open shared plan</button></form>
    </section> : <section><p className="eyebrow">Your space</p><h1>What’s the motive?</h1><p>Signed in as {user.email}</p><div className="motive-grid"><article><h2>Groups</h2>{groups.map(g=><p key={g.id}>{g.name}</p>)}<form onSubmit={e=>submit(e,async data=>{await api('/api/groups','POST',data);await refresh();})}><label>New group name<input name="name" required maxLength={100}/></label><button>Create group</button></form></article><article><h2>Plans</h2>{plans.map(p=><p key={p.id}><button onClick={()=>openPlan(p.id)}>{p.title}</button></p>)}<form onSubmit={e=>submit(e,async data=>{await api('/api/plans','POST',data);await refresh();})}><label>Group<select name="groupId" required>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label>Plan title<input name="title" required maxLength={200}/></label><button>Create plan</button></form></article></div>
      {user.admin && <article><h2>Administration</h2><form onSubmit={e=>submit(e,async data=>{const result=await api(`/api/admin/${data.kind}`,'POST',{email:data.email});setMessage(`Share privately: ${result.token} (expires ${new Date(result.expires).toISOString()})`);})}><label>Email<input name="email" type="email" required/></label><label>Code type<select name="kind"><option value="invitations">Invitation</option><option value="recovery">Recovery</option></select></label><button>Issue code</button></form></article>}
    </section>}
    {selected && <section><h2>Plan images</h2><p>Plan ID: {selected}</p>{images.map(i=><p key={i.id}><a href={`/api/images/${i.id}`}>Download image</a></p>)}{user && <form onSubmit={async e=>{e.preventDefault();const file=(new FormData(e.currentTarget).get('image') as File);try{await api(`/api/plans/${selected}/images`,'POST',file);await openPlan(selected);}catch(error){setMessage(String(error));}}}><label>PNG or JPEG, up to 2 MiB<input name="image" type="file" accept="image/png,image/jpeg" required/></label><button>Upload image</button></form>}<button onClick={async()=>{await api('/api/auth/logout','POST');setSelected('');setImages([]);}}>Close shared access</button></section>}
    <footer>Install MOTIVE from your browser’s menu. On iPhone, use Share → Add to Home Screen. Internet access is required.</footer>
  </main>;
}
