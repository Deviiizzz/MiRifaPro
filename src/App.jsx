import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LogOut, Plus, Trash2, Ticket, ShoppingCart, X, CheckCircle2, Loader2, CreditCard, ShieldCheck, Clock, User, UserPlus } from 'lucide-react';

// --- COMPONENTE DE ACCESO (LOGIN Y REGISTRO) ---
const Auth = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (isRegistering) {
      // PROCESO DE REGISTRO
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert("Error al registrar: " + error.message);
      } else {
        // Al registrarse, creamos automáticamente su perfil de cliente en la tabla usuarios
        const { error: dbError } = await supabase
          .from('usuarios')
          .insert([{ id_usuario: data.user.id, email: email, rol: 'cliente' }]);
        
        if (dbError) console.error("Error creando perfil:", dbError);
        alert("¡Registro exitoso! Ya puedes iniciar sesión.");
        setIsRegistering(false);
      }
    } else {
      // PROCESO DE LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Error: " + error.message);
      else onLogin(data.user);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
        <h2 className="text-4xl font-black text-center mb-2 text-slate-800 tracking-tighter italic">RIFAPRO</h2>
        <p className="text-center text-slate-500 mb-8">{isRegistering ? 'Crea tu cuenta de comprador' : 'Gestión profesional de sorteos'}</p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Correo Electrónico" className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña (mín. 6 caracteres)" className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-blue-600 transition-all flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? <><UserPlus size={20}/> REGISTRARME</> : 'ENTRAR')}
          </button>
        </form>

        <button 
          onClick={() => setIsRegistering(!isRegistering)} 
          className="w-full mt-6 text-sm font-bold text-blue-600 hover:underline text-center"
        >
          {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
        </button>
      </div>
    </div>
  );
};

// --- PANEL DE ADMINISTRADOR ---
const AdminPanel = () => {
  const [rifas, setRifas] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('rifas'); // 'rifas' o 'pagos'

  useEffect(() => { 
    fetchRifas();
    fetchPagosPendientes();
  }, []);

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*').order('creado_en', { ascending: false });
    setRifas(data || []);
  };

  const fetchPagosPendientes = async () => {
    const { data } = await supabase.from('numeros').select('*, rifas(nombre)').eq('estado', 'apartado');
    setPendientes(data || []);
  };

  const confirmarPago = async (id_numero) => {
    const { error } = await supabase.from('numeros').update({ estado: 'pagado' }).eq('id_numero', id_numero);
    if (!error) {
      alert("Pago confirmado con éxito");
      fetchPagosPendientes();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-black italic">RIFAPRO ADMIN</h1>
        <div className="flex gap-4">
          <button onClick={() => setTab('rifas')} className={`px-4 py-2 rounded-lg font-bold ${tab === 'rifas' ? 'bg-blue-600' : ''}`}>Mis Rifas</button>
          <button onClick={() => setTab('pagos')} className={`px-4 py-2 rounded-lg font-bold ${tab === 'pagos' ? 'bg-blue-600' : ''}`}>
            Pagos {pendientes.length > 0 && <span className="bg-red-500 px-2 rounded-full text-xs">{pendientes.length}</span>}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-slate-400 hover:text-white"><LogOut/></button>
        </div>
      </nav>

      <main className="p-6 max-w-6xl mx-auto">
        {tab === 'rifas' ? (
          <div className="grid gap-4">
            {rifas.map(r => (
              <div key={r.id_rifa} className="bg-white p-6 rounded-2xl border flex justify-between items-center shadow-sm">
                <div><h3 className="font-bold text-xl">{r.nombre}</h3><p className="text-slate-500">${r.precio} | {r.total_numeros} cupos</p></div>
                <div className="flex gap-2 text-sm font-bold text-blue-600">VENTAS ACTIVAS</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-black mb-6">Revisiones de Pago Móvil</h2>
            {pendientes.length === 0 && <p className="text-slate-400">No hay pagos pendientes de revisión.</p>}
            {pendientes.map(p => (
              <div key={p.id_numero} className="bg-white p-6 rounded-2xl border-l-4 border-l-yellow-400 shadow-md flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-blue-600 uppercase">{p.rifas.nombre}</p>
                  <p className="text-xl font-bold">Número: {p.numero}</p>
                  <div className="text-sm text-slate-500 mt-2">
                    <p>Referencia: <strong>{p.referencia_pago}</strong></p>
                    <p>Banco: {p.banco_origen}</p>
                    <p>Pagador: {p.comprador_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => confirmarPago(p.id_numero)} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"><ShieldCheck size={18}/> APROBAR PAGO</button>
                  <button className="text-red-500 font-bold p-2">Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// --- VISTA CLIENTE ---
const ClienteView = ({ userEmail }) => {
  const [rifas, setRifas] = useState([]);
  const [rifaSeleccionada, setRifaSeleccionada] = useState(null);
  const [numeros, setNumeros] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [mostrandoPago, setMostrandoPago] = useState(false);
  const [ref, setRef] = useState('');
  const [banco, setBanco] = useState('');

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

  const handlePago = async () => {
    if (!ref || !banco) return alert("Llena todos los datos");
    
    const { error } = await supabase
      .from('numeros')
      .update({
        estado: 'apartado',
        referencia_pago: ref,
        banco_origen: banco,
        comprador_email: userEmail
      })
      .in('numero', seleccionados)
      .eq('id_rifa', rifaSeleccionada.id_rifa);

    if (!error) {
      alert("¡Reporte enviado! Tu número aparecerá como reservado hasta que el admin confirme el pago.");
      setRifaSeleccionada(null);
      setMostrandoPago(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white p-4 border-b flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-black italic tracking-tighter">RIFAPRO</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-slate-400"><LogOut/></button>
      </header>

      <main className="p-4 max-w-4xl mx-auto mt-6">
        {!rifaSeleccionada ? (
          <div className="grid gap-4">
            <h2 className="text-xl font-bold">Sorteos Disponibles</h2>
            {rifas.map(r => (
              <div key={r.id_rifa} onClick={() => seleccionarRifa(r)} className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-blue-500 shadow-sm cursor-pointer transition-all flex justify-between items-center">
                <div><h3 className="text-xl font-black uppercase tracking-tight">{r.nombre}</h3><p className="text-blue-600 font-bold">${r.precio}</p></div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-full"><Plus/></div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button onClick={() => setRifaSeleccionada(null)} className="text-blue-600 font-bold mb-4">← Volver</button>
            <div className="bg-white p-6 rounded-3xl shadow-sm border mb-6">
              <h2 className="text-2xl font-black">{rifaSeleccionada.nombre}</h2>
              <p className="text-slate-500 text-sm italic">Costo: ${rifaSeleccionada.precio} por ticket</p>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-8">
              {numeros.map(n => (
                <button
                  key={n.id_numero}
                  disabled={n.estado !== 'disponible'}
                  onClick={() => setSeleccionados(prev => prev.includes(n.numero) ? prev.filter(x => x !== n.numero) : [...prev, n.numero])}
                  className={`aspect-square rounded-lg font-bold text-xs border-2 transition-all
                    ${n.estado === 'pagado' ? 'bg-red-100 text-red-400 border-red-100' : 
                      n.estado === 'apartado' ? 'bg-yellow-100 text-yellow-600 border-yellow-100' :
                      seleccionados.includes(n.numero) ? 'bg-blue-600 text-white border-blue-600 scale-90' : 'bg-white border-slate-100'}
                  `}
                >
                  {n.numero}
                </button>
              ))}
            </div>

            {seleccionados.length > 0 && (
              <div className="bg-slate-900 text-white p-6 rounded-3xl flex justify-between items-center shadow-2xl animate-in slide-in-from-bottom">
                <div>
                  <p className="text-2xl font-black text-blue-400">${(seleccionados.length * rifaSeleccionada.precio).toFixed(2)}</p>
                  <p className="text-xs uppercase font-bold tracking-widest">{seleccionados.length} tickets</p>
                </div>
                <button onClick={() => setMostrandoPago(true)} className="bg-blue-600 px-6 py-3 rounded-xl font-bold">REPORTAR PAGO</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Reporte Pago */}
      {mostrandoPago && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-2 uppercase">Reportar Pago Móvil</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Envía tu pago móvil y coloca los últimos 4 dígitos de la referencia abajo.</p>
            <div className="space-y-4">
              <input type="text" placeholder="Últimos 4 dígitos Referencia" className="w-full p-4 bg-slate-50 border rounded-xl" onChange={e => setRef(e.target.value)} />
              <input type="text" placeholder="Banco desde donde pagaste" className="w-full p-4 bg-slate-50 border rounded-xl" onChange={e => setBanco(e.target.value)} />
              <button onClick={handlePago} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2">ENVIAR REPORTE <CheckCircle2 size={18}/></button>
              <button onClick={() => setMostrandoPago(false)} className="w-full text-slate-400 font-bold text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CEREBRO ---
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkRole(session.user.id);
      else { setRole(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkRole = async (userId) => {
    const { data } = await supabase.from('usuarios').select('rol').eq('id_usuario', userId).single();
    setRole(data?.rol || 'cliente');
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={50}/></div>;
  if (!session) return <Auth onLogin={setSession} />; // <--- CAMBIADO AQUÍ
  return role === 'admin' ? <AdminPanel /> : <ClienteView userEmail={session.user.email} />;
}
