import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LogOut, Plus, Trash2, Eye, Loader2, X } from 'lucide-react';

// --- LOGIN (Se mantiene igual) ---
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Error: " + error.message);
    else onLogin(data.user);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-3xl font-bold text-center mb-6">🎟️ RifaPro Login</h2>
        <input type="email" placeholder="Correo" className="w-full p-3 border rounded-lg" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Clave" className="w-full p-3 border rounded-lg" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold">Entrar</button>
      </form>
    </div>
  );
};

// --- PANEL DE ADMINISTRADOR (ACTUALIZADO CON CREACIÓN REAL) ---
const AdminPanel = () => {
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Datos del formulario
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState(100);

  useEffect(() => { fetchRifas(); }, []);

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*');
    setRifas(data || []);
  };

  const crearRifaCompleta = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Crear la Rifa
    const { data: rifaData, error: rifaError } = await supabase
      .from('rifas')
      .insert([{ nombre, precio: parseFloat(precio), total_numeros: cantidad }])
      .select();

    if (rifaError) {
      alert("Error creando rifa");
      setLoading(false);
      return;
    }

    const rifaId = rifaData[0].id_rifa;

    // 2. Generar Números automáticamente (Ej: 00 al 99)
    const numerosParaInsertar = Array.from({ length: cantidad }, (_, i) => ({
      id_rifa: rifaId,
      numero: i.toString().padStart(2, '0'),
      estado: 'disponible'
    }));

    const { error: numError } = await supabase.from('numeros').insert(numerosParaInsertar);

    if (numError) alert("Error generando números");
    else {
      alert("¡Rifa y números creados con éxito!");
      setShowModal(false);
      fetchRifas();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black">Panel Admin</h1>
          <button onClick={() => setShowModal(true)} className="bg-green-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2">
            <Plus size={20}/> Nueva Rifa
          </button>
        </div>

        <div className="grid gap-4">
          {rifas.map(r => (
            <div key={r.id_rifa} className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl">{r.nombre}</h3>
                <p className="text-gray-500">${r.precio} | {r.total_numeros} números</p>
              </div>
              <button className="text-blue-600 font-bold">Ver Detalles</button>
            </div>
          ))}
        </div>

        {/* Modal para Crear Rifa */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl w-full max-w-md relative">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4"><X/></button>
              <h2 className="text-2xl font-bold mb-4">Nueva Rifa</h2>
              <form onSubmit={crearRifaCompleta} className="space-y-4">
                <input type="text" placeholder="Nombre (Ej: iPhone 15)" className="w-full p-3 border rounded-lg" required onChange={e => setNombre(e.target.value)} />
                <input type="number" placeholder="Precio ($)" className="w-full p-3 border rounded-lg" required onChange={e => setPrecio(e.target.value)} />
                <input type="number" placeholder="Cantidad de números (Ej: 100)" className="w-full p-3 border rounded-lg" required defaultValue={100} onChange={e => setCantidad(e.target.value)} />
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold flex justify-center">
                  {loading ? <Loader2 className="animate-spin"/> : "CREAR AHORA"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- VISTA CLIENTE (Se simplifica para esta prueba) ---
const ClienteView = () => (
  <div className="p-10 text-center">
    <h1 className="text-2xl font-bold">¡Bienvenido!</h1>
    <p>Pronto verás las rifas disponibles aquí.</p>
    <button onClick={() => supabase.auth.signOut()} className="mt-4 text-red-500">Salir</button>
  </div>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkRole(session.user.id);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkRole(session.user.id);
      else setRole(null);
    });
  }, []);

  const checkRole = async (userId) => {
    const { data } = await supabase.from('usuarios').select('rol').eq('id_usuario', userId).single();
    setRole(data?.rol || 'cliente');
  };

  if (!session) return <Login onLogin={setSession} />;
  return role === 'admin' ? <AdminPanel /> : <ClienteView />;
}
