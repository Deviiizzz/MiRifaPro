import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LogOut, Plus, Trash2, Ticket, ShoppingCart, X, CheckCircle2, Loader2, CreditCard, ShieldCheck, User, Phone, Lock } from 'lucide-react';

// --- COMPONENTE DE ACCESO (LOGIN Y REGISTRO PERSONALIZADO) ---
const Auth = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Campos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    password: ''
  });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Generamos un "email falso" basado en nombre y apellido para Supabase Auth
    // Ejemplo: juan.perez@rifapro.com
    const fakeEmail = `${formData.nombre.toLowerCase()}.${formData.apellido.toLowerCase()}@rifapro.com`;
    const finalEmail = formData.email || fakeEmail;

    if (isRegistering) {
      // REGISTRO
      const { data, error } = await supabase.auth.signUp({ 
        email: finalEmail, 
        password: formData.password 
      });

      if (error) {
        alert("Error: " + error.message);
      } else {
        // Guardamos los datos reales en nuestra tabla de usuarios
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
          alert("¡Cuenta creada! Ya puedes iniciar sesión con tu nombre.");
          setIsRegistering(false);
        }
      }
    } else {
      // LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: finalEmail, 
        password: formData.password 
      });
      if (error) alert("Credenciales incorrectas. Verifica tu nombre y clave.");
      else onLogin(data.user);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
        <h2 className="text-4xl font-black text-center mb-6 text-slate-800 italic">RIFAPRO</h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Nombre" required className="p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              onChange={e => setFormData({...formData, nombre: e.target.value})} />
            <input type="text" placeholder="Apellido" required className="p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              onChange={e => setFormData({...formData, apellido: e.target.value})} />
          </div>

          {isRegistering && (
            <>
              <input type="tel" placeholder="Nro de Teléfono" required className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                onChange={e => setFormData({...formData, telefono: e.target.value})} />
              <input type="email" placeholder="Correo (Opcional)" className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                onChange={e => setFormData({...formData, email: e.target.value})} />
            </>
          )}

          <input type="password" placeholder="Contraseña" required className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
            onChange={e => setFormData({...formData, password: e.target.value})} />

          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-blue-600 transition-all flex justify-center uppercase tracking-widest">
            {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Crear Cuenta' : 'Entrar')}
          </button>
        </form>

        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-sm font-bold text-blue-600 text-center">
          {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
        </button>
      </div>
    </div>
  );
};

// --- EL RESTO DEL CÓDIGO (AdminPanel y ClienteView) ---
// (He actualizado ClienteView para que use el ID del cliente en lugar del email)

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
        // Obtenemos los números apartados y los datos del usuario que los apartó
        const { data } = await supabase.from('numeros').select('*, rifas(nombre), usuarios(nombre, apellido, telefono)').eq('estado', 'apartado');
        setPendientes(data || []);
    };
  
    const confirmarPago = async (id_numero) => {
      await supabase.from('numeros').update({ estado: 'pagado' }).eq('id_numero', id_numero);
      fetchPagosPendientes();
    };
  
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg">
          <h1 className="text-xl font-black italic tracking-tighter text-blue-400">RIFAPRO ADMIN</h1>
          <div className="flex gap-2">
            <button onClick={() => setTab('rifas')} className={`px-4 py-2 rounded-lg text-sm font-bold ${tab === 'rifas' ? 'bg-blue-600' : 'text-slate-400'}`}>Rifas</button>
            <button onClick={() => setTab('pagos')} className={`px-4 py-2 rounded-lg text-sm font-bold ${tab === 'pagos' ? 'bg-blue-600' : 'text-slate-400'}`}>Pagos</button>
            <button onClick={() => supabase.auth.signOut()} className="ml-2 text-slate-500"><LogOut size={20}/></button>
          </div>
        </nav>
        <main className="p-4 max-w-4xl mx-auto">
          {tab === 'rifas' ? (
             <div className="grid gap-4">
               {rifas.map(r => (
                 <div key={r.id_rifa} className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-center">
                   <div><h3 className="font-black text-slate-800 uppercase">{r.nombre}</h3><p className="text-slate-500 text-sm">${r.precio}</p></div>
                   <div className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase">Activa</div>
                 </div>
               ))}
             </div>
          ) : (
            <div className="space-y-4">
                {pendientes.map(p => (
                  <div key={p.id_numero} className="bg-white p-6 rounded-2xl border-l-4 border-blue-500 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-black text-blue-500">{p.rifas?.nombre}</p>
                            <h4 className="text-2xl font-black">NÚMERO: {p.numero}</h4>
                        </div>
                        <button onClick={() => confirmarPago(p.id_numero)} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm">APROBAR</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-3 rounded-xl">
                        <p><strong>Cliente:</strong> {p.usuarios?.nombre} {p.usuarios?.apellido}</p>
                        <p><strong>Teléfono:</strong> {p.usuarios?.telefono}</p>
                        <p><strong>Banco:</strong> {p.banco_origen}</p>
                        <p><strong>Ref:</strong> {p.referencia_pago}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </main>
      </div>
    );
};

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
        const { error } = await supabase.from('numeros').update({
            estado: 'apartado',
            referencia_pago: pago.ref,
            banco_origen: pago.banco,
            comprador_id: userId
        }).in('numero', seleccionados).eq('id_rifa', rifaSeleccionada.id_rifa);

        if (!error) {
            alert("Reporte enviado con éxito.");
            setRifaSeleccionada(null);
            setMostrandoPago(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
             <header className="bg-white p-4 border-b flex justify-between items-center">
                <h1 className="text-xl font-black italic">RIFAPRO</h1>
                <button onClick={() => supabase.auth.signOut()} className="text-slate-400"><LogOut size={20}/></button>
            </header>
            <main className="p-4 max-w-4xl mx-auto">
                {!rifaSeleccionada ? (
                    <div className="space-y-4">
                        <h2 className="font-bold text-slate-700">Elige un sorteo:</h2>
                        {rifas.map(r => (
                            <div key={r.id_rifa} onClick={() => seleccionarRifa(r)} className="bg-white p-6 rounded-2xl shadow-sm border hover:border-blue-500 cursor-pointer transition-all flex justify-between items-center">
                                <h3 className="text-xl font-black uppercase">{r.nombre}</h3>
                                <div className="text-blue-600 font-bold">${r.precio}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        <button onClick={() => setRifaSeleccionada(null)} className="text-blue-600 font-bold mb-4">← Volver</button>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-20">
                            {numeros.map(n => (
                                <button key={n.id_numero} disabled={n.estado !== 'disponible'}
                                    onClick={() => setSeleccionados(prev => prev.includes(n.numero) ? prev.filter(x => x !== n.numero) : [...prev, n.numero])}
                                    className={`aspect-square rounded-lg font-bold text-xs border-2 
                                        ${n.estado === 'pagado' ? 'bg-red-500 text-white border-red-500' : 
                                          n.estado === 'apartado' ? 'bg-yellow-400 text-white border-yellow-400' :
                                          seleccionados.includes(n.numero) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200'}`}
                                >{n.numero}</button>
                            ))}
                        </div>
                        {seleccionados.length > 0 && (
                            <div className="fixed bottom-4 left-4 right-4 bg-slate-900 text-white p-6 rounded-3xl flex justify-between items-center shadow-2xl">
                                <div><p className="text-2xl font-black text-blue-400">${(seleccionados.length * rifaSeleccionada.precio).toFixed(2)}</p></div>
                                <button onClick={() => setMostrandoPago(true)} className="bg-blue-600 px-6 py-3 rounded-xl font-bold uppercase text-xs">Reportar Pago</button>
                            </div>
                        )}
                    </div>
                )}
            </main>
            {mostrandoPago && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-sm">
                        <h3 className="text-xl font-black mb-4 uppercase">Datos del Pago</h3>
                        <input type="text" placeholder="Banco" className="w-full p-4 bg-slate-50 border rounded-xl mb-3" onChange={e => setPago({...pago, banco: e.target.value})} />
                        <input type="text" placeholder="Referencia (4 dígitos)" className="w-full p-4 bg-slate-50 border rounded-xl mb-4" onChange={e => setPago({...pago, ref: e.target.value})} />
                        <button onClick={handleReporte} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold">ENVIAR</button>
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
