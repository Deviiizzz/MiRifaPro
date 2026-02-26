import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LogOut, Plus, Trash2, Ticket, ShoppingCart, X, CheckCircle2, Loader2, CreditCard } from 'lucide-react';

// --- COMPONENTE DE LOGIN (Igual) ---
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Error: " + error.message);
    else onLogin(data.user);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
        <h2 className="text-4xl font-black text-center mb-8 text-slate-800 tracking-tighter">RIFAPRO</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Clave" className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-blue-600 transition-all">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "ENTRAR"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- COMPONENTE ADMIN (Igual al anterior) ---
const AdminPanel = () => {
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState(100);

  useEffect(() => { fetchRifas(); }, []);

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*').order('creado_en', { ascending: false });
    setRifas(data || []);
  };

  const crearRifaCompleta = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: rifaData, error: rifaError } = await supabase.from('rifas').insert([{ nombre, precio: parseFloat(precio), total_numeros: parseInt(cantidad) }]).select();
      if (rifaError) throw rifaError;
      const numeros = Array.from({ length: cantidad }, (_, i) => ({ id_rifa: rifaData[0].id_rifa, numero: i.toString().padStart(2, '0'), estado: 'disponible' }));
      await supabase.from('numeros').insert(numeros);
      alert("¡Rifa lista!");
      setShowModal(false);
      fetchRifas();
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black">Mis Sorteos</h1>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2"><Plus/> Nueva Rifa</button>
        </div>
        <div className="grid gap-4">
          {rifas.map(r => (
            <div key={r.id_rifa} className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
              <div><h3 className="font-bold text-xl">{r.nombre}</h3><p className="text-slate-500">${r.precio} | {r.total_numeros} números</p></div>
              <button className="text-blue-600 font-bold hover:underline">Ver Ventas</button>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4"><X/></button>
            <h2 className="text-2xl font-bold mb-6">Nueva Rifa</h2>
            <form onSubmit={crearRifaCompleta} className="space-y-4">
              <input type="text" placeholder="Nombre" className="w-full p-3 border rounded-xl" required onChange={e => setNombre(e.target.value)} />
              <input type="number" placeholder="Precio ($)" className="w-full p-3 border rounded-xl" required onChange={e => setPrecio(e.target.value)} />
              <input type="number" placeholder="Cantidad" className="w-full p-3 border rounded-xl" defaultValue={100} onChange={e => setCantidad(e.target.value)} />
              <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold">{loading ? "Creando..." : "PUBLICAR"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- VISTA CLIENTE (NUEVA Y POTENTE) ---
const ClienteView = () => {
  const [rifas, setRifas] = useState([]);
  const [rifaSeleccionada, setRifaSeleccionada] = useState(null);
  const [numeros, setNumeros] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);

  useEffect(() => { fetchRifas(); }, []);

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*').eq('estado', 'activa');
    setRifas(data || []);
  };

  const seleccionarRifa = async (rifa) => {
    setRifaSeleccionada(rifa);
    const { data } = await supabase.from('numeros').select('*').eq('id_rifa', rifa.id_rifa).order('numero', { ascending: true });
    setNumeros(data || []);
    setSeleccionados([]);
  };

  const toggleNumero = (num) => {
    if (num.estado !== 'disponible') return;
    setSeleccionados(prev => 
      prev.includes(num.numero) ? prev.filter(n => n !== num.numero) : [...prev, num.numero]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black text-slate-800">🎟️ RifaPro</h1>
          <button onClick={() => supabase.auth.signOut()} className="text-slate-400 hover:text-red-500"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {!rifaSeleccionada ? (
          <>
            <h2 className="text-xl font-bold mb-6">Sorteos Activos</h2>
            <div className="grid gap-6">
              {rifas.map(r => (
                <div key={r.id_rifa} onClick={() => seleccionarRifa(r)} className="bg-white p-6 rounded-3xl shadow-sm border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800">{r.nombre}</h3>
                      <p className="text-blue-600 font-bold">${r.precio} <span className="text-slate-400 font-normal">por ticket</span></p>
                    </div>
                    <div className="bg-slate-100 p-3 rounded-2xl text-slate-400"><Ticket/></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="animate-in fade-in duration-500">
            <button onClick={() => setRifaSeleccionada(null)} className="text-blue-600 font-bold mb-4 flex items-center gap-2"> ← Volver</button>
            <div className="bg-white p-6 rounded-3xl shadow-sm border mb-8">
              <h2 className="text-3xl font-black text-slate-800">{rifaSeleccionada.nombre}</h2>
              <p className="text-slate-500">Selecciona los números que deseas comprar:</p>
            </div>

            {/* Cuadrícula de Números */}
            
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-24">
              {numeros.map(n => (
                <button
                  key={n.id_numero}
                  onClick={() => toggleNumero(n)}
                  className={`
                    aspect-square rounded-xl font-bold text-sm transition-all border-2
                    ${n.estado !== 'disponible' ? 'bg-slate-100 text-slate-300 border-transparent cursor-not-allowed' : 
                      seleccionados.includes(n.numero) ? 'bg-blue-600 text-white border-blue-600 scale-95 shadow-inner' : 
                      'bg-white text-slate-600 border-slate-100 hover:border-blue-300'}
                  `}
                >
                  {n.numero}
                </button>
              ))}
            </div>

            {/* Barra de Pago (Sticky Bottom) */}
            {seleccionados.length > 0 && (
              <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-auto md:w-[896px]">
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl flex justify-between items-center border border-white/10 backdrop-blur-md">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-black">Total a Pagar</p>
                    <p className="text-2xl font-black text-blue-400">${(seleccionados.length * rifaSeleccionada.precio).toFixed(2)}</p>
                    <p className="text-xs">{seleccionados.length} tickets seleccionados</p>
                  </div>
                  <button className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all">
                    PAGAR AHORA <CreditCard size={20}/>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// --- CEREBRO DE LA APP ---
export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkRole(session.user.id);
      else setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkRole(session.user.id);
      else { setRole(null); setLoading(false); }
    });
  }, []);

  const checkRole = async (userId) => {
    const { data } = await supabase.from('usuarios').select('rol').eq('id_usuario', userId).single();
    setRole(data?.rol || 'cliente');
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  if (!session) return <Login onLogin={setSession} />;
  return role === 'admin' ? <AdminPanel /> : <ClienteView />;
}
