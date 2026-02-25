import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LogOut, Ticket, ShieldCheck, User, Plus, Eye, Trash2, Check, X, Download, CreditCard, ShoppingCart, ArrowRight } from 'lucide-react';

// --- COMPONENTE DE LOGIN ---
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
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-slate-800">🎟️ RifaPro Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Correo electrónico" className="w-full p-3 border rounded-lg" onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña" className="w-full p-3 border rounded-lg" onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">Entrar</button>
        </form>
      </div>
    </div>
  );
};

// --- COMPONENTE DE ADMINISTRADOR ---
const AdminPanel = ({ user }) => {
  const [rifas, setRifas] = useState([
    { id: 1, nombre: "iPhone 15 Pro Max", total: 100, precio: 5, fecha: "2026-05-10" }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <h1 className="text-xl font-black text-yellow-500 mb-8 tracking-tighter">ADMIN PANEL</h1>
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-red-400 mt-auto"><LogOut size={18}/> Cerrar Sesión</button>
      </div>
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800">Mis Rifas</h2>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"><Plus size={20}/> Crear Rifa</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rifas.map(r => (
            <div key={r.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-xl">{r.nombre}</h3>
              <p className="text-gray-500 text-sm">Precio: ${r.precio} | Números: {r.total}</p>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-slate-800 text-white py-2 rounded flex items-center justify-center gap-2"><Eye size={18}/> Ver Números</button>
                <button className="p-2 border border-red-200 text-red-500 rounded hover:bg-red-50"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// --- COMPONENTE DE CLIENTE ---
const ClienteView = ({ user }) => {
  const [seleccionados, setSeleccionados] = useState([]);
  const [numeros] = useState(Array.from({ length: 100 }, (_, i) => ({
    id: i + 1, n: (i + 1).toString().padStart(3, '0'), estado: 'disponible'
  })));

  const toggleNum = (num) => {
    if (seleccionados.find(n => n.id === num.id)) setSeleccionados(seleccionados.filter(n => n.id !== num.id));
    else setSeleccionados([...seleccionados, num]);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white p-4 shadow-sm flex justify-between items-center">
        <h1 className="font-black text-xl text-slate-800 tracking-tighter">🎟️ COMPRA TU RIFA</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-gray-500"><LogOut/></button>
      </header>

      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-blue-600 text-white p-6 rounded-2xl mb-6 shadow-lg">
          <h2 className="text-2xl font-bold">Rifa iPhone 15 Pro</h2>
          <p className="opacity-80">Selecciona los números que deseas comprar</p>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {numeros.map(n => (
            <button
              key={n.id}
              onClick={() => toggleNum(n)}
              className={`h-12 rounded-lg font-bold border-2 transition-all ${
                seleccionados.find(s => s.id === n.id) 
                ? 'bg-slate-900 text-white border-slate-900 scale-110 shadow-lg' 
                : 'bg-white text-green-600 border-green-100 hover:border-green-400'
              }`}
            >
              {n.n}
            </button>
          ))}
        </div>
      </div>

      {seleccionados.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white p-4 rounded-2xl shadow-2xl flex justify-between items-center border border-gray-100">
          <div>
            <p className="text-xs font-bold text-gray-400">TOTAL A PAGAR</p>
            <p className="text-2xl font-black text-blue-600">${seleccionados.length * 5}</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition">
            PAGAR <ArrowRight size={20}/>
          </button>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL (EL CEREBRO) ---
export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Escuchar cambios de sesión (login/logout)
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
    // Aquí buscamos en tu tabla 'Usuarios' el rol del que acaba de entrar
    const { data } = await supabase.from('usuarios').select('rol').eq('id_usuario', userId).single();
    setRole(data?.rol || 'cliente');
  };

  if (!session) return <Login onLogin={setSession} />;
  
  return role === 'admin' ? <AdminPanel user={session.user} /> : <ClienteView user={session.user} />;
}
