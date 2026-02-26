import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LogOut, Plus, Ticket, X, CheckCircle2, Loader2, CreditCard, ShieldCheck, User, Phone, Lock, ChevronLeft, Info } from 'lucide-react';

// --- COMPONENTE DE ACCESO (PULIDO) ---
const Auth = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', telefono: '', email: '', password: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Usamos el teléfono + nombre para asegurar un ID único en Supabase Auth
    // Esto evita errores si dos personas se llaman igual
    const uniqueId = `${formData.nombre.toLowerCase()}${formData.telefono.slice(-4)}`;
    const finalEmail = formData.email || `${uniqueId}@rifapro.com`;

    if (isRegistering) {
      const { data, error } = await supabase.auth.signUp({ email: finalEmail, password: formData.password });
      if (error) {
        alert("Error: " + error.message);
      } else {
        const { error: dbError } = await supabase.from('usuarios').insert([{
          id_usuario: data.user.id,
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono,
          email: formData.email,
          rol: 'cliente'
        }]);
        if (dbError) alert("Error en base de datos: " + dbError.message);
        else {
          alert("¡Cuenta creada exitosamente!");
          setIsRegistering(false);
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: finalEmail, password: formData.password });
      if (error) alert("Entrada fallida. Revisa tu nombre y contraseña.");
      else onLogin(data.user);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter">RIFAPRO</h2>
            <p className="text-slate-400 text-sm font-medium">{isRegistering ? 'Únete a los sorteos' : 'Bienvenido de nuevo'}</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Nombre" required className="p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              onChange={e => setFormData({...formData, nombre: e.target.value})} />
            <input type="text" placeholder="Apellido" required className="p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              onChange={e => setFormData({...formData, apellido: e.target.value})} />
          </div>

          {isRegistering && (
            <input type="tel" placeholder="Teléfono (WhatsApp)" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                onChange={e => setFormData({...formData, telefono: e.target.value})} />
          )}

          <input type="password" placeholder="Tu Contraseña" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            onChange={e => setFormData({...formData, password: e.target.value})} />

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 transition-all flex justify-center shadow-lg shadow-blue-200 uppercase text-xs tracking-widest mt-4">
            {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Crear mi cuenta' : 'Entrar al sistema')}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-500">
            {isRegistering ? '¿Ya tienes cuenta?' : '¿Eres nuevo?'} 
            <button onClick={() => setIsRegistering(!isRegistering)} className="ml-2 font-bold text-blue-600">
                {isRegistering ? 'Inicia Sesión' : 'Regístrate aquí'}
            </button>
        </p>
      </div>
    </div>
  );
};

// --- PANEL DE ADMINISTRADOR ---
const AdminPanel = () => {
    const [rifas, setRifas] = useState([]);
    const [pendientes, setPendientes] = useState([]);
    const [tab, setTab] = useState('rifas');
  
    useEffect(() => { fetchRifas(); fetchPagosPendientes(); }, []);
  
    const fetchRifas = async () => {
      const { data } = await supabase.from('rifas').select('*').order('creado_en', { ascending: false });
      setRifas(data || []);
    };
  
    const fetchPagosPendientes = async () => {
        const { data } = await supabase.from('numeros').select('*, rifas(nombre), usuarios(nombre, apellido, telefono)').eq('estado', 'apartado');
        setPendientes(data || []);
    };
  
    const confirmarPago = async (id_numero) => {
      await supabase.from('numeros').update({ estado: 'pagado' }).eq('id_numero', id_numero);
      fetchPagosPendientes();
    };
  
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
          <h1 className="text-xl font-black italic text-slate-900">RIFAPRO <span className="text-blue-600 font-medium not-italic text-sm">ADMIN</span></h1>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setTab('rifas')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${tab === 'rifas' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>RIFAS</button>
            <button onClick={() => setTab('pagos')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${tab === 'pagos' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>PAGOS ({pendientes.length})</button>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-slate-300 hover:text-red-500 transition-colors"><LogOut size={20}/></button>
        </nav>

        <main className="p-4 max-w-4xl mx-auto">
          {tab === 'rifas' ? (
             <div className="grid gap-4">
               {rifas.map(r => (
                 <div key={r.id_rifa} className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex justify-between items-center">
                   <div><h3 className="font-black text-slate-800 uppercase tracking-tight">{r.nombre}</h3><p className="text-blue-600 font-bold">${r.precio}</p></div>
                   <div className="flex gap-2"><span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">En curso</span></div>
                 </div>
               ))}
             </div>
          ) : (
            <div className="space-y-4">
                {pendientes.length === 0 && <div className="text-center py-20 text-slate-400 font-medium">No hay pagos por revisar ☕</div>}
                {pendientes.map(p => (
                  <div key={p.id_numero} className="bg-white p-6 rounded-[1.5rem] shadow-md border-l-4 border-l-blue-600">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.rifas?.nombre}</span>
                        <button onClick={() => confirmarPago(p.id_numero)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-blue-100 hover:scale-105 transition-transform">APROBAR TICKET</button>
                    </div>
                    <h4 className="text-3xl font-black mb-4">TICKET #{p.numero}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-slate-600">👤 <strong>Cliente:</strong> {p.usuarios?.nombre} {p.usuarios?.apellido}</p>
                        <p className="text-slate-600">📞 <strong>Teléfono:</strong> {p.usuarios?.telefono}</p>
                        <p className="text-slate-600">🏦 <strong>Banco:</strong> {p.banco_origen}</p>
                        <p className="text-slate-600">📑 <strong>Ref:</strong> {p.referencia_pago}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </main>
      </div>
    );
};

// --- VISTA CLIENTE PULIDA ---
const ClienteView = ({ userId }) => {
    const [rifas, setRifas] = useState([]);
    const [rifaSeleccionada, setRifaSeleccionada] = useState(null);
    const [numeros, setNumeros] = useState([]);
    const [seleccionados, setSeleccionados] = useState([]);
    const [mostrandoPago, setMostrandoPago] = useState(false);
    const [pago, setPago] = useState({ ref: '', banco: '' });

    useEffect(() => { fetchRifas(); }, []);

    const fetchRifas = async () => {
      const { data } = await supabase.from('rifas').select('*').eq('estado', 'activa');
      setRifas(data || []);
    };

    const seleccionarRifa = async (rifa) => {
      setRifaSeleccionada(rifa);
      const { data } = await supabase.from('numeros').select('*').eq('id_rifa', rifa.id_rifa).order('numero', { ascending: true });
      setNumeros(data || []);
    };

    const handleReporte = async () => {
        if(!pago.ref || !pago.banco) return alert("Por favor completa los datos del pago");
        const { error } = await supabase.from('numeros').update({
            estado: 'apartado',
            referencia_pago: pago.ref,
            banco_origen: pago.banco,
            comprador_id: userId
        }).in('numero', seleccionados).eq('id_rifa', rifaSeleccionada.id_rifa);

        if (!error) {
            alert("✅ ¡Pago reportado! Espera la confirmación del administrador.");
            setRifaSeleccionada(null);
            setMostrandoPago(false);
            setSeleccionados([]);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
             <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20">
                <h1 className="text-xl font-black italic tracking-tighter">RIFAPRO</h1>
                <button onClick={() => supabase.auth.signOut()} className="text-slate-300 hover:text-red-500"><LogOut size={20}/></button>
            </header>

            <main className="p-4 max-w-2xl mx-auto">
                {!rifaSeleccionada ? (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Ticket size={18}/> <h2 className="text-sm font-black uppercase tracking-widest">Sorteos Disponibles</h2>
                        </div>
                        {rifas.map(r => (
                            <div key={r.id_rifa} onClick={() => seleccionarRifa(r)} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50/50 cursor-pointer transition-all flex justify-between items-center group">
                                <div>
                                    <h3 className="text-2xl font-black uppercase text-slate-800 group-hover:text-blue-600 transition-colors">{r.nombre}</h3>
                                    <p className="text-slate-400 font-bold text-sm">Costo del ticket: <span className="text-blue-500">${r.precio}</span></p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-blue-50 transition-colors"><Plus className="text-slate-300 group-hover:text-blue-600"/></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-4">
                        <button onClick={() => setRifaSeleccionada(null)} className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-6 hover:text-blue-600 transition-colors"><ChevronLeft size={16}/> Volver a la lista</button>
                        
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 mb-8 shadow-sm">
                            <h2 className="text-3xl font-black uppercase leading-none mb-2">{rifaSeleccionada.nombre}</h2>
                            <div className="flex items-center gap-2 text-blue-600 font-bold"><CreditCard size={16}/> ${rifaSeleccionada.precio} USD</div>
                        </div>

                        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 mb-32">
                            {numeros.map(n => (
                                <button key={n.id_numero} disabled={n.estado !== 'disponible'}
                                    onClick={() => setSeleccionados(prev => prev.includes(n.numero) ? prev.filter(x => x !== n.numero) : [...prev, n.numero])}
                                    className={`aspect-square rounded-2xl font-black text-xs transition-all border-2
                                        ${n.estado === 'pagado' ? 'bg-slate-100 text-slate-300 border-transparent cursor-not-allowed' : 
                                          n.estado === 'apartado' ? 'bg-yellow-100 text-yellow-600 border-yellow-200 cursor-not-allowed' :
                                          seleccionados.includes(n.numero) ? 'bg-blue-600 text-white border-blue-600 scale-90 shadow-lg shadow-blue-200' : 'bg-white border-slate-100 hover:border-blue-200 text-slate-600'}`}
                                >{n.numero}</button>
                            ))}
                        </div>

                        {seleccionados.length > 0 && (
                            <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-auto md:w-[640px] bg-slate-900 text-white p-6 rounded-[2.5rem] flex justify-between items-center shadow-2xl animate-in slide-in-from-bottom duration-500">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{seleccionados.length} Tickets elegidos</p>
                                    <p className="text-3xl font-black text-blue-400 leading-none">${(seleccionados.length * rifaSeleccionada.precio).toFixed(2)}</p>
                                </div>
                                <button onClick={() => setMostrandoPago(true)} className="bg-blue-600 px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-blue-500 transition-colors">Comprar Ahora</button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* MODAL DE PAGO PULIDO */}
            {mostrandoPago && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Detalles del Pago</h3>
                            <button onClick={() => setMostrandoPago(false)} className="text-slate-300 hover:text-slate-600"><X/></button>
                        </div>

                        {/* DATOS DE TU PAGO MÓVIL AQUÍ */}
                        <div className="bg-blue-50 p-5 rounded-3xl mb-6 border border-blue-100">
                            <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Pagar a:</p>
                            <p className="text-sm font-bold text-blue-900 leading-tight">Banco: [TU BANCO]<br/>Tlf: [TU TELÉFONO]<br/>CI: [TU CÉDULA]</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">¿Desde qué banco pagaste?</label>
                                <input type="text" placeholder="Ej: Banesco, Mercantil..." className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold" 
                                    onChange={e => setPago({...pago, banco: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Últimos 4 de la referencia</label>
                                <input type="text" maxLength="4" placeholder="0000" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold" 
                                    onChange={e => setPago({...pago, ref: e.target.value})} />
                            </div>
                            <button onClick={handleReporte} className="w-full bg-slate-900 text-white p-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all mt-4">Confirmar Reporte</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={50}/></div>;
  if (!session) return <Auth onLogin={setSession} />;
  return role === 'admin' ? <AdminPanel /> : <ClienteView userId={session.user.id} />;
}
