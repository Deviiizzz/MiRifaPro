import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LogOut, Plus, Trash2, Eye, Loader2, X, Ticket, ShoppingCart, ArrowRight } from 'lucide-react';

// --- COMPONENTE DE LOGIN ---
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Error de acceso: " + error.message);
    else onLogin(data.user);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
        <h2 className="text-4xl font-black text-center mb-2 text-slate-800 tracking-tighter">RIFAPRO</h2>
        <p className="text-center text-slate-500 mb-8">Gestión profesional de sorteos</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-600 ml-1">Email</label>
            <input type="email" placeholder="tu@correo.com" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-600 ml-1">Contraseña</label>
            <input type="password" placeholder="••••••••" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : "ENTRAR AL SISTEMA"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- COMPONENTE DE ADMINISTRADOR ---
const AdminPanel = () => {
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState(100);

  useEffect(() => { fetchRifas(); }, []);

  const fetchRifas = async () => {
    const { data, error } = await supabase.from('rifas').select('*').order('creado_en', { ascending: false });
    if (error) console.error("Error cargando rifas:", error);
    else setRifas(data || []);
  };

  const crearRifaCompleta = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Insertar la Rifa
      const { data: rifaData, error: rifaError } = await supabase
        .from('rifas')
        .insert([{ 
          nombre: nombre, 
          precio: parseFloat(precio), 
          total_numeros: parseInt(cantidad) 
        }])
        .select();

      if (rifaError) throw new Error(`Error en tabla RIFAS: ${rifaError.message}`);

      const rifaId = rifaData[0].id_rifa;

      // 2. Generar Números automáticamente (Ej: 00, 01, 02...)
      const numerosParaInsertar = Array.from({ length: cantidad }, (_, i) => ({
        id_rifa: rifaId,
        numero: i.toString().padStart(2, '0'),
        estado: 'disponible'
      }));

      const { error: numError } = await supabase.from('numeros').insert(numerosParaInsertar);

      if (numError) throw new Error(`Error en tabla NUMEROS: ${numError.message}`);

      alert("🎉 ¡Rifa y números creados correctamente!");
      setShowModal(false);
      fetchRifas();
      
    } catch (err) {
      alert("❌ " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h1 className="text-2xl font-black text-blue-400 mb-8 tracking-tighter">RIFAPRO ADMIN</h1>
        <nav className="flex-1 space-y-2">
          <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-3 cursor-pointer">
            <Ticket size={20} /> Mis Rifas
          </div>
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-slate-400 hover:text-white p-3 mt-auto">
          <LogOut size={18}/> Cerrar Sesión
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black text-slate-800">Panel de Control</h2>
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-blue-700 transition-all">
              <Plus size={20}/> Crear Nueva Rifa
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rifas.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                No tienes rifas activas. ¡Crea la primera!
              </div>
            ) : (
              rifas.map(r => (
                <div key={r.id_rifa} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Ticket size={24}/></div>
                    <span className="bg-green-100 text-green-700 text-xs font-black px-2 py-1 rounded-full">ACTIVA</span>
                  </div>
                  <h3 className="font-bold text-xl text-slate-800 mb-1">{r.nombre}</h3>
                  <p className="text-slate-500 font-medium mb-4">${r.precio} por número • {r.total_numeros} cupos</p>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">Detalles</button>
                    <button className="p-3 border border-red-100 text-red-400 rounded-xl hover:bg-red-50 transition-colors"><Trash2 size={20}/></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Crear Rifa */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X/></button>
              <h2 className="text-2xl font-black text-slate-800 mb-6">Configurar Rifa</h2>
              <form onSubmit={crearRifaCompleta} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase ml-1">Título del Sorteo</label>
                  <input type="text" placeholder="Ej: iPhone 15 Pro Max" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required onChange={e => setNombre(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Precio ($)</label>
                    <input type="number" step="0.01" placeholder="5.00" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required onChange={e => setPrecio(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Números</label>
                    <input type="number" placeholder="100" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required defaultValue={100} onChange={e => setCantidad(e.target.value)} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all flex justify-center mt-6">
                  {loading ? <Loader2 className="animate-spin"/> : "PUBLICAR RIFA"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- VISTA CLIENTE (Simplificada) ---
const ClienteView = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 max-w-sm">
      <div className="bg-yellow-100 text-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <ShoppingCart size={32} />
      </div>
      <h1 className="text-2xl font-black text-slate-800 mb-2">¡Próximamente!</h1>
      <p className="text-slate-500 mb-8">Estamos preparando los números para que puedas comprar tu ticket. Vuelve en unos minutos.</p>
      <button onClick={() => supabase.auth.signOut()} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
        Cerrar Sesión
      </button>
    </div>
  </div>
);

// --- COMPONENTE CEREBRO ---
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
      else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRole = async (userId) => {
    try {
      const { data, error } = await supabase.from('usuarios').select('rol').eq('id_usuario', userId).single();
      if (error) throw error;
      setRole(data?.rol || 'cliente');
    } catch (err) {
      console.error("Error verificando rol:", err);
      setRole('cliente');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  if (!session) return <Login onLogin={setSession} />;
  
  return role === 'admin' ? <AdminPanel /> : <ClienteView />;
}
