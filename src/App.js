import { BrowserRouter as Router, Routes, Route, Link, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';

function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const saved = localStorage.getItem('auth');
    if (saved) setUser(JSON.parse(saved));
  }, []);
  function login(data) { localStorage.setItem('auth', JSON.stringify(data)); setUser(data); }
  function logout() { localStorage.removeItem('auth'); setUser(null); }
  return { user, login, logout };
}

function Protected({ roles, user, children }) {
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function Login({ auth }) {
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [error,setError] = useState('');
  async function submit(e){
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      if(!res.ok) return setError('Login failed');
      const data = await res.json();
      auth.login({ token: data.token, user: data.user });
    } catch(err){ setError('Network error'); }
  }
  return <div className="page"><h2>Login</h2><form onSubmit={submit}><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/><button>Login</button>{error && <div className="err">{error}</div>}<div><Link to="/register">Register</Link></div></form></div>;
}

function validateEmail(v){ return /^\S+@\S+\.\S+$/.test(v); }
function validatePassword(v){ return /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/.test(v); }
function Register(){
  const [form,setForm] = useState({name:'',email:'',address:'',password:''});
  const [msg,setMsg] = useState('');
  function update(e){ setForm({...form,[e.target.name]:e.target.value}); }
  async function submit(e){
    e.preventDefault();
    setMsg('');
    if(form.name.length < 20 || form.name.length > 60) return setMsg('Name 20-60 chars');
    if(form.address.length > 400) return setMsg('Address too long');
    if(!validateEmail(form.email)) return setMsg('Invalid email');
    if(!validatePassword(form.password)) return setMsg('Password invalid');
    try {
      const res = await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      if(res.ok) setMsg('Registered. You can login now.'); else setMsg('Error.');
    } catch(err){ setMsg('Network error'); }
  }
  return <div className="page"><h2>Register</h2><form onSubmit={submit}><input name="name" value={form.name} onChange={update} placeholder="Name"/><input name="email" value={form.email} onChange={update} placeholder="Email"/><input name="address" value={form.address} onChange={update} placeholder="Address"/><input name="password" type="password" value={form.password} onChange={update} placeholder="Password"/><button>Sign Up</button><div>{msg}</div></form></div>;
}

function sortToggle(currentSort, setSort, order, setOrder, field){
  if(currentSort === field){ setOrder(order === 'asc' ? 'desc' : 'asc'); }
  else { setSort(field); setOrder('asc'); }
}
function Stores({ auth }) {
  const [stores,setStores] = useState([]);
  const [filters,setFilters] = useState({name:'',address:''});
  const [sort,setSort] = useState('name');
  const [order,setOrder] = useState('asc');
  async function load(){
    const params = new URLSearchParams({...filters,sort,order});
    const res = await fetch('/api/stores?'+params.toString(),{headers:{'Authorization':'Bearer '+auth.user.token}});
    if(res.ok){ setStores(await res.json()); }
  }
  useEffect(()=>{ if(auth.user) load(); // eslint-disable-next-line
  },[sort,order]);
  function change(e){ setFilters({...filters,[e.target.name]:e.target.value}); }
  async function apply(){ await load(); }
  async function rate(id,val){
    await fetch('/api/ratings/'+id,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+auth.user.token},body:JSON.stringify({rating:val})});
    load();
  }
  return <div className="page"><h2>Stores</h2><div className="filters"><input name="name" placeholder="Name" value={filters.name} onChange={change}/><input name="address" placeholder="Address" value={filters.address} onChange={change}/><button onClick={apply}>Search</button></div><table><thead><tr><th onClick={()=>sortToggle(sort,setSort,order,setOrder,'name')}>Name {sort==='name'?order:''}</th><th onClick={()=>sortToggle(sort,setSort,order,setOrder,'address')}>Address {sort==='address'?order:''}</th><th>Avg Rating</th><th>Your Rating</th><th>Action</th></tr></thead><tbody>{stores.map(s=> <tr key={s.id}><td>{s.name}</td><td>{s.address}</td><td>{Number(s.avg_rating).toFixed(2)}</td><td>{s.user_rating||'-'}</td><td>{[1,2,3,4,5].map(v=> <button key={v} disabled={s.user_rating===v} onClick={()=>rate(s.id,v)}>{v}</button>)}</td></tr>)}</tbody></table></div>;
}

function AdminDashboard({ auth }){
  const [stats,setStats] = useState(null);
  useEffect(()=>{ async function load(){ const r = await fetch('/api/admin/stats',{headers:{'Authorization':'Bearer '+auth.user.token}}); if(r.ok) setStats(await r.json()); } load(); },[auth]);
  return <div className="page"><h2>Admin Dashboard</h2>{stats && <ul><li>Users: {stats.total_users}</li><li>Stores: {stats.total_stores}</li><li>Ratings: {stats.total_ratings}</li></ul>}<Link to="/admin/users">Manage Users</Link></div>;
}

function AdminUsers({ auth }){
  const [users,setUsers] = useState([]);
  const [filters,setFilters] = useState({name:'',email:'',address:'',role:''});
  const [sort,setSort] = useState('name');
  const [order,setOrder] = useState('asc');
  const navigate = useNavigate();
  function change(e){ setFilters({...filters,[e.target.name]:e.target.value}); }
  async function load(){ const params = new URLSearchParams({...filters,sort,order}); const r = await fetch('/api/users?'+params.toString(),{headers:{'Authorization':'Bearer '+auth.user.token}}); if(r.ok) setUsers(await r.json()); }
  useEffect(()=>{ load(); // eslint-disable-next-line
  },[sort,order]);
  return <div className="page"><h2>Users</h2><div><input name="name" placeholder="Name" value={filters.name} onChange={change}/><input name="email" placeholder="Email" value={filters.email} onChange={change}/><input name="address" placeholder="Address" value={filters.address} onChange={change}/><input name="role" placeholder="Role" value={filters.role} onChange={change}/><button onClick={load}>Search</button><Link to="/admin/users/create">Create User</Link></div><table><thead><tr><th onClick={()=>sortToggle(sort,setSort,order,setOrder,'name')}>Name {sort==='name'?order:''}</th><th onClick={()=>sortToggle(sort,setSort,order,setOrder,'email')}>Email {sort==='email'?order:''}</th><th>Address</th><th onClick={()=>sortToggle(sort,setSort,order,setOrder,'role')}>Role {sort==='role'?order:''}</th></tr></thead><tbody>{users.map(u=> <tr key={u.id} onClick={()=>navigate('/admin/users/'+u.id)} style={{cursor:'pointer'}}><td>{u.name}</td><td>{u.email}</td><td>{u.address}</td><td>{u.role}</td></tr>)}</tbody></table></div>;
}

function AdminCreateUser({ auth }){
  const [form,setForm] = useState({name:'',email:'',address:'',password:'',role:'user'});
  const [msg,setMsg] = useState('');
  function update(e){ setForm({...form,[e.target.name]:e.target.value}); }
  async function submit(e){
    e.preventDefault();
    setMsg('');
    if(form.name.length<20||form.name.length>60) return setMsg('Name 20-60');
    if(form.address.length>400) return setMsg('Address long');
    if(!validateEmail(form.email)) return setMsg('Email');
    if(!validatePassword(form.password)) return setMsg('Password invalid');
    const res = await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+auth.user.token},body:JSON.stringify(form)});
    setMsg(res.ok?'Created':'Error');
  }
  return <div className="page"><h2>Create User</h2><form onSubmit={submit}><input name="name" value={form.name} onChange={update} placeholder="Name"/><input name="email" value={form.email} onChange={update} placeholder="Email"/><input name="address" value={form.address} onChange={update} placeholder="Address"/><input name="password" type="password" value={form.password} onChange={update} placeholder="Password"/><select name="role" value={form.role} onChange={update}><option value="user">User</option><option value="admin">Admin</option><option value="owner">Owner</option></select><button>Create</button><div>{msg}</div></form></div>;
}

function AdminStores({ auth }){
  const [stores,setStores] = useState([]);
  const [filters,setFilters] = useState({name:'',address:''});
  const [sort,setSort] = useState('name');
  const [order,setOrder] = useState('asc');
  function change(e){ setFilters({...filters,[e.target.name]:e.target.value}); }
  async function load(){ const params=new URLSearchParams({...filters,sort,order}); const r= await fetch('/api/stores?'+params.toString(),{headers:{'Authorization':'Bearer '+auth.user.token}}); if(r.ok) setStores(await r.json()); }
  useEffect(()=>{ load(); // eslint-disable-next-line
  },[sort,order]);
  return <div className="page"><h2>Stores</h2><div><input name="name" placeholder="Name" value={filters.name} onChange={change}/><input name="address" placeholder="Address" value={filters.address} onChange={change}/><button onClick={load}>Search</button><Link to="/admin/stores/create">Create Store</Link></div><table><thead><tr><th onClick={()=>sortToggle(sort,setSort,order,setOrder,'name')}>Name {sort==='name'?order:''}</th><th>Email</th><th onClick={()=>sortToggle(sort,setSort,order,setOrder,'address')}>Address {sort==='address'?order:''}</th><th>Avg Rating</th></tr></thead><tbody>{stores.map(s=> <tr key={s.id}><td>{s.name}</td><td>{s.email}</td><td>{s.address}</td><td>{Number(s.avg_rating).toFixed(2)}</td></tr>)}</tbody></table></div>;
}

function AdminCreateStore({ auth }){
  const [form,setForm] = useState({name:'',email:'',address:'',owner_id:''});
  const [owners,setOwners] = useState([]);
  const [msg,setMsg] = useState('');
  function update(e){ setForm({...form,[e.target.name]:e.target.value}); }
  useEffect(()=>{ async function load(){ const r= await fetch('/api/users?role=owner',{headers:{'Authorization':'Bearer '+auth.user.token}}); if(r.ok) setOwners(await r.json()); } load(); },[auth]);
  async function submit(e){ e.preventDefault(); setMsg(''); if(form.name.length<20||form.name.length>60) return setMsg('Name 20-60'); if(form.address.length>400) return setMsg('Address long'); if(!validateEmail(form.email)) return setMsg('Email'); const res = await fetch('/api/stores',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+auth.user.token},body:JSON.stringify({...form, owner_id: form.owner_id || null})}); setMsg(res.ok?'Created':'Error'); }
  return <div className="page"><h2>Create Store</h2><form onSubmit={submit}><input name="name" value={form.name} onChange={update} placeholder="Name"/><input name="email" value={form.email} onChange={update} placeholder="Email"/><input name="address" value={form.address} onChange={update} placeholder="Address"/><select name="owner_id" value={form.owner_id} onChange={update}><option value="">No Owner</option>{owners.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}</select><button>Create</button><div>{msg}</div></form></div>;
}

function UserDetail({ auth }){
  const { id } = useParams();
  const [user,setUser] = useState(null);
  useEffect(()=>{ async function load(){ const r = await fetch('/api/users/'+id,{headers:{'Authorization':'Bearer '+auth.user.token}}); if(r.ok) setUser(await r.json()); } load(); },[id,auth]);
  if(!user) return <div className="page">Loading...</div>;
  return <div className="page"><h2>User Detail</h2><div>Name: {user.name}</div><div>Email: {user.email}</div><div>Address: {user.address}</div><div>Role: {user.role}</div>{user.owner_rating !== undefined && <div>Owner Avg Rating: {Number(user.owner_rating).toFixed(2)}</div>}</div>;
}

function ChangePassword({ auth }){
  const [oldPassword,setOld] = useState('');
  const [newPassword,setNew] = useState('');
  const [msg,setMsg] = useState('');
  async function submit(e){ e.preventDefault(); setMsg(''); if(!validatePassword(newPassword)) return setMsg('Invalid new password'); const r = await fetch('/api/users/password/change',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+auth.user.token},body:JSON.stringify({oldPassword, newPassword})}); setMsg(r.ok?'Updated':'Error'); }
  return <div className="page"><h2>Change Password</h2><form onSubmit={submit}><input type="password" placeholder="Old Password" value={oldPassword} onChange={e=>setOld(e.target.value)}/><input type="password" placeholder="New Password" value={newPassword} onChange={e=>setNew(e.target.value)}/><button>Update</button><div>{msg}</div></form></div>;
}

function OwnerDashboard({ auth }){
  const [stores,setStores] = useState([]);
  const [ratings,setRatings] = useState([]);
  const [selected,setSelected] = useState(null);
  useEffect(()=>{ async function load(){ const r = await fetch('/api/owner/stores',{headers:{'Authorization':'Bearer '+auth.user.token}}); if(r.ok) setStores(await r.json()); } load(); },[auth]);
  async function openStore(id){ setSelected(id); const r = await fetch('/api/owner/stores/'+id+'/ratings',{headers:{'Authorization':'Bearer '+auth.user.token}}); if(r.ok) setRatings(await r.json()); }
  return <div className="page"><h2>Owner Dashboard</h2><table><thead><tr><th>Store</th><th>Address</th><th>Avg Rating</th><th># Ratings</th></tr></thead><tbody>{stores.map(s=> <tr key={s.id} onClick={()=>openStore(s.id)} style={{cursor:'pointer'}}><td>{s.name}</td><td>{s.address}</td><td>{Number(s.avg_rating).toFixed(2)}</td><td>{s.rating_count}</td></tr>)}</tbody></table>{selected && <div><h3>Ratings For Store {selected}</h3><table><thead><tr><th>User</th><th>Email</th><th>Rating</th></tr></thead><tbody>{ratings.map(r=> <tr key={r.id}><td>{r.name}</td><td>{r.email}</td><td>{r.rating}</td></tr>)}</tbody></table></div>}</div>;
}

// Removed old OwnerRatings; replaced by OwnerDashboard

function Nav({ auth }){
  return <nav><Link to="/">Home</Link>{auth.user && <><Link to="/stores">Stores</Link><Link to="/change-password">Password</Link></>}{auth.user?.user.role==='admin' && <><Link to="/admin">Admin</Link><Link to="/admin/users">Users</Link><Link to="/admin/stores">Stores</Link></>}{auth.user?.user.role==='owner' && <Link to="/owner">Owner</Link>}{auth.user ? <button onClick={auth.logout}>Logout</button> : <Link to="/login">Login</Link>}</nav>;
}

export default function App(){
  const auth = useAuth();
  return <Router><Nav auth={auth}/><Routes><Route path="/" element={<div className="page"><h1>Store Ratings</h1></div>} />
    <Route path="/login" element={<Login auth={auth}/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route path="/stores" element={<Protected user={auth.user?.user} roles={['user','admin','owner']}><Stores auth={auth}/></Protected>}/>
  <Route path="/admin" element={<Protected user={auth.user?.user} roles={['admin']}><AdminDashboard auth={auth}/></Protected>}/>
  <Route path="/admin/users" element={<Protected user={auth.user?.user} roles={['admin']}><AdminUsers auth={auth}/></Protected>}/>
  <Route path="/admin/users/create" element={<Protected user={auth.user?.user} roles={['admin']}><AdminCreateUser auth={auth}/></Protected>}/>
  <Route path="/admin/users/:id" element={<Protected user={auth.user?.user} roles={['admin']}><UserDetail auth={auth}/></Protected>}/>
  <Route path="/admin/stores" element={<Protected user={auth.user?.user} roles={['admin']}><AdminStores auth={auth}/></Protected>}/>
  <Route path="/admin/stores/create" element={<Protected user={auth.user?.user} roles={['admin']}><AdminCreateStore auth={auth}/></Protected>}/>
  <Route path="/change-password" element={<Protected user={auth.user?.user} roles={['admin','user','owner']}><ChangePassword auth={auth}/></Protected>}/>
  <Route path="/owner" element={<Protected user={auth.user?.user} roles={['owner']}><OwnerDashboard auth={auth}/></Protected>}/>
    <Route path="*" element={<div>404</div>} />
  </Routes></Router>;
}
