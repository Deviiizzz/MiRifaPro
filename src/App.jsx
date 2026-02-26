import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LogOut, Plus, Ticket, X, CheckCircle2, Loader2, CreditCard, 
  User, Phone, ChevronLeft, Trash2, Download, Eye, FileText 
} from 'lucide-react';

// --- ESTILOS DE COLORES POR ESTADO ---
const ESTADOS = {
  disponible: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white', label: 'Libre' },
  apartado: { bg: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-yellow-900', label: 'Revision' },
  pagado: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white', label: 'Vendido' }
};

// --- COMPONENTE DE ACCESO ---
const Auth = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', telefono: '', password: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Generamos un email ficticio basado en el teléfono para Supabase Auth
    const finalEmail = `${formData.telefono}@rifapro.com`;

    if (isRegistering) {
      const { data, error } = await supabase.auth.signUp({ email: finalEmail, password: formData.password });
      if (error) alert(error.message);
      else {
        await supabase.from('usuarios').insert([{
          id_usuario: data.user.id,
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono,
          rol: 'cliente'
        }]);
        alert("Registro exitoso");
        setIsRegistering(false);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: finalEmail, password: formData.password });
      if (error) alert("Datos incorrectos");
      else onLogin(data.user);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-black text-center mb-6 italic">RIFAPRO</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Nombre" required className="p-3 bg-slate-50 rounded-xl outline-none border focus:border-blue-500" onChange={e => setFormData({...formData, nombre: e.target.value})} />
              <input type="text" placeholder="Apellido" required className="p-3 bg-slate-50 rounded-xl outline-none border focus:border-blue-500" onChange={e => setFormData({...formData, apellido: e.target.value})} />
            </div>
          )}
          <input type="tel" placeholder="Número de Teléfono" required className="w-full p-3 bg-slate-50 rounded-xl outline-none border focus:border-blue-500" onChange={e => setFormData({...formData, telefono: e.target.value})} />
          <input type="password" placeholder="Contraseña" required className="w-full p-3 bg-slate-50 rounded-xl outline-none border focus:border-blue-500" onChange={e => setFormData({...formData, password: e.target.value})} />
          <button className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (isRegistering ? 'Crear Cuenta' : 'Entrar')}
          </button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center mt-4 text-sm font-bold text-slate-500">
          {isRegistering ? '¿Ya tienes cuenta? Ingresa' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
};

// --- PANEL ADMINISTRADOR ---
const AdminPanel = () => {
  const [rifas, setRifas] = useState([]);
  const [view, setView] = useState('list'); // list, create, detail
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [numsRifa, setNumsRifa] = useState([]);
  const [newRifa, setNewRifa] = useState({ nombre: '', descripcion: '', cantidad: 100, precio: 0, fecha: '' });
  const [numDetail, setNumDetail] = useState(null);

  useEffect(() => { fetchRifas(); }, []);

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*').order('creado_en', { ascending: false });
    setRifas(data || []);
  };

  const crearRifa = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('rifas').insert([{
      nombre: newRifa.nombre,
      descripcion: newRifa.descripcion,
      precio: newRifa.precio,
      cantidad_numeros: newRifa.cantidad,
      fecha_fin: newRifa.fecha,
      estado: 'activa'
    }]).select();

    if (!error) {
      // Generar números automáticamente
      const numEntries = Array.from({ length: newRifa.cantidad }, (_, i) => ({
        id_rifa: data[0].id_rifa,
        numero: i + 1,
        estado: 'disponible'
      }));
      await supabase.from('numeros').insert(numEntries);
      alert("Rifa creada con éxito");
      setView('list');
      fetchRifas();
    }
  };

  const deleteRifa = async (id) => {
    if(window.confirm("¿Seguro que quieres borrar esta rifa y todos sus números?")) {
      await supabase.from('rifas').delete().eq('id_rifa', id);
      fetchRifas();
    }
  };

  const openRifaDetail = async (rifa) => {
    setSelectedRifa(rifa);
    const { data } = await supabase.from('numeros').select('*, usuarios(nombre, apellido, telefono)').eq('id_rifa', rifa.id_rifa).order('numero', { ascending: true });
    setNumsRifa(data || []);
    setView('detail');
  };

  const handleActionNumber = async (numId, nuevoEstado) => {
    const updateData = nuevoEstado === 'disponible' 
      ? { estado: 'disponible', comprador_id: null, referencia_pago: null } 
      : { estado: 'pagado' };
    
    await supabase.from('numeros').update(updateData).eq('id_numero', numId);
    openRifaDetail(selectedRifa);
    setNumDetail(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="font-black italic">RIFAPRO ADMIN</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-red-500"><LogOut size={20}/></button>
      </nav>

      <main className="p-4 max-w-4xl mx-auto">
        {view === 'list' && (
          <div className="space-y-4">
            <button onClick={() => setView('create')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"><Plus/> Crear Nueva Rifa</button>
            {rifas.map(r => (
              <div key={r.id_rifa} className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-center">
                <div onClick={() => openRifaDetail(r)} className="cursor-pointer flex-1">
                  <h3 className="font-bold uppercase">{r.nombre}</h3>
                  <p className="text-xs text-slate-400">Fin: {r.fecha_fin}</p>
                </div>
                <button onClick={() => deleteRifa(r.id_rifa)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        )}

        {view === 'create' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <button onClick={() => setView('list')} className="mb-4 flex items-center gap-1 text-sm font-bold text-slate-400"><ChevronLeft size={16}/> Volver</button>
            <h2 className="text-xl font-black mb-4">CONFIGURAR RIFA</h2>
            <form onSubmit={crearRifa} className="space-y-4">
              <input type="text" placeholder="Nombre de la Rifa" className="w-full p-3 bg-slate-50 rounded-xl border" required onChange={e => setNewRifa({...newRifa, nombre: e.target.value})} />
              <textarea placeholder="Descripción" className="w-full p-3 bg-slate-50 rounded-xl border" onChange={e => setNewRifa({...newRifa, descripcion: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 ml-2">CANT. NÚMEROS</label>
                  <input type="number" placeholder="100" className="w-full p-3 bg-slate-50 rounded-xl border" onChange={e => setNewRifa({...newRifa, cantidad: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 ml-2">PRECIO POR NÚMERO</label>
                  <input type="number" step="0.01" placeholder="5.00" className="w-full p-3 bg-slate-50 rounded-xl border" onChange={e => setNewRifa({...newRifa, precio: e.target.value})} />
                </div>
              </div>
              <input type="date" className="w-full p-3 bg-slate-50 rounded-xl border" required onChange={e => setNewRifa({...newRifa, fecha: e.target.value})} />
              <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase tracking-widest">Lanzar Rifa</button>
            </form>
          </div>
        )}

        {view === 'detail' && selectedRifa && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <button onClick={() => setView('list')} className="flex items-center gap-1 text-sm font-bold text-slate-400"><ChevronLeft size={16}/> Volver</button>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><Download size={14}/> Respaldar PDF</button>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border">
                <h2 className="text-3xl font-black uppercase">{selectedRifa.nombre}</h2>
                <p className="text-slate-500 text-sm">{selectedRifa.descripcion}</p>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
              {numsRifa.map(n => (
                <button 
                  key={n.id_numero} 
                  onClick={() => n.estado !== 'disponible' && setNumDetail(n)}
                  className={`aspect-square rounded-lg text-[10px] font-bold border-2 transition-all ${ESTADOS[n.estado].bg} ${ESTADOS[n.estado].border} ${ESTADOS[n.estado].text}`}
                >
                  {n.numero}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL DETALLE DE NÚMERO (ADMIN) */}
      {numDetail && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm">
            <div className="flex justify-between mb-4">
                <h3 className="text-2xl font-black italic">TICKET #{numDetail.numero}</h3>
                <button onClick={() => setNumDetail(null)}><X/></button>
            </div>
            <div className="space-y-3 mb-6">
                <p className="text-sm"><strong>Cliente:</strong> {numDetail.usuarios?.nombre} {numDetail.usuarios?.apellido}</p>
                <p className="text-sm"><strong>Teléfono:</strong> {numDetail.usuarios?.telefono}</p>
                <p className="text-sm"><strong>Ref. Pago:</strong> {numDetail.referencia_pago || 'No adjunta'}</p>
                <div className="p-3 bg-blue-50 rounded-xl text-blue-700 text-xs font-bold uppercase">Estado: {numDetail.estado}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleActionNumber(numDetail.id_numero, 'disponible')} className="bg-red-50 text-red-600 p-3 rounded-xl font-bold text-xs uppercase">Borrar / Error</button>
                {numDetail.estado === 'apartado' && (
                    <button onClick={() => handleActionNumber(numDetail.id_numero, 'pagado')} className="bg-green-600 text-white p-3 rounded-xl font-bold text-xs uppercase">Aprobar Pago</button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- VISTA CLIENTE ---
const ClienteView = ({ userId }) => {
  const [rifas, setRifas] = useState([]);
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [nums, setNums] = useState([]);
  const [cart, setCart] = useState([]);
  const [showPay, setShowPay] = useState(false);
  const [payData, setPayData] = useState({ ref: '' });

  useEffect(() => { fetchRifas(); }, []);

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*').eq('estado', 'activa');
    setRifas(data || []);
  };

  const selectRifa = async (rifa) => {
    setSelectedRifa(rifa);
    const { data } = await supabase.from('numeros').select('*').eq('id_rifa', rifa.id_rifa).order('numero', { ascending: true });
    setNums(data || []);
    setCart([]);
  };

  const toggleNum = (n) => {
    if(n.estado === 'pagado' || n.estado === 'apartado') return alert("Este número ya está vendido o en revisión");
    setCart(prev => prev.includes(n.id_numero) ? prev.filter(id => id !== n.id_numero) : [...prev, n.id_numero]);
  };

  const reportarPago = async () => {
    if(!payData.ref) return alert("Ingresa la referencia");
    const { error } = await supabase.from('numeros')
        .update({ estado: 'apartado', comprador_id: userId, referencia_pago: payData.ref })
        .in('id_numero', cart);
    
    if(!error) {
        alert("¡Reporte enviado! Tu ticket aparecerá en amarillo hasta que el admin lo apruebe.");
        setSelectedRifa(null);
        setShowPay(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20">
        <h1 className="font-black italic">RIFAPRO</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-slate-300 hover:text-red-500"><LogOut size={20}/></button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {!selectedRifa ? (
            <div className="space-y-4">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Sorteos Activos</h2>
                {rifas.map(r => (
                    <div key={r.id_rifa} onClick={() => selectRifa(r)} className="bg-white p-6 rounded-3xl border hover:border-blue-500 cursor-pointer transition-all">
                        <h3 className="text-xl font-black uppercase">{r.nombre}</h3>
                        <p className="text-sm text-slate-400 mb-2">{r.descripcion}</p>
                        <div className="text-blue-600 font-bold">${r.precio} <span className="text-[10px] uppercase text-slate-300 ml-2">por número</span></div>
                    </div>
                ))}
            </div>
        ) : (
            <div>
                <button onClick={() => setSelectedRifa(null)} className="mb-4 flex items-center gap-1 font-bold text-slate-400 text-sm"><ChevronLeft size={16}/> Volver</button>
                <div className="bg-white p-6 rounded-3xl border mb-6">
                    <h2 className="text-2xl font-black uppercase">{selectedRifa.nombre}</h2>
                    <p className="text-blue-600 font-bold">${selectedRifa.precio} USD</p>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-32">
                    {nums.map(n => (
                        <button 
                            key={n.id_numero} 
                            onClick={() => toggleNum(n)}
                            className={`aspect-square rounded-xl text-xs font-black border-2 transition-all
                                ${n.estado === 'pagado' ? 'bg-red-500 border-red-600 text-white' : 
                                  n.estado === 'apartado' ? 'bg-yellow-400 border-yellow-500 text-yellow-900' : 
                                  cart.includes(n.id_numero) ? 'bg-blue-600 border-blue-700 text-white scale-90' : 'bg-green-500 border-green-600 text-white'}`}
                        >
                            {n.numero}
                        </button>
                    ))}
                </div>

                {cart.length > 0 && (
                    <div className="fixed bottom-6 left-4 right-4 bg-slate-900 text-white p-6 rounded-[2rem] flex justify-between items-center shadow-2xl animate-in slide-in-from-bottom">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{cart.length} Tickets</p>
                            <p className="text-2xl font-black">${(cart.length * selectedRifa.precio).toFixed(2)}</p>
                        </div>
                        <button onClick={() => setShowPay(true)} className="bg-blue-600 px-6 py-3 rounded-xl font-black uppercase text-xs">Comprar</button>
                    </div>
                )}
            </div>
        )}
      </main>

      {/* MODAL PAGO CLIENTE */}
      {showPay && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm">
                <h3 className="text-xl font-black mb-4 uppercase">Completar Pago</h3>
                <div className="bg-blue-50 p-4 rounded-2xl mb-4 border border-blue-100 text-sm">
                    <p className="font-bold text-blue-800">Transferencia / Pago Móvil</p>
                    <p className="text-blue-600">Banco: [TU BANCO]<br/>Tlf: [TU TELÉFONO]<br/>CI: [TU CÉDULA]</p>
                </div>
                <input type="text" maxLength="4" placeholder="Últimos 4 de referencia" className="w-full p-4 bg-slate-50 border rounded-2xl mb-4 outline-none" 
                    onChange={e => setPayData({ref: e.target.value})} />
                <button onClick={reportarPago} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase text-xs">Enviar Comprobante</button>
                <button onClick={() => setShowPay(false)} className="w-full mt-2 text-slate-400 font-bold text-xs uppercase">Cancelar</button>
            </div>
        </div>
      )}
    </div>
  );
};

// --- APP COMPONENT ---
xport default function App() {
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;
  if (!session) return <Auth onLogin={setSession} />;
  return role === 'admin' ? <AdminPanel /> : <ClienteView userId={session.user.id} />;
}
