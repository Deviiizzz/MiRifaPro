import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LogOut, Plus, Ticket, X, CheckCircle2, Loader2, CreditCard, 
  User, Phone, ChevronLeft, Trash2, Download, Eye, EyeOff, FileText, Image as ImageIcon, Edit3, Printer, Trophy, PartyPopper
} from 'lucide-react';

// Librerías para documentos
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './index.css'; // Conexión con los fuegos artificiales

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
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200">
        <h2 className="text-4xl font-black text-center mb-2 italic tracking-tighter text-blue-600">RIFAPRO</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Nombre" required className="p-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-500" onChange={e => setFormData({...formData, nombre: e.target.value})} />
              <input type="text" placeholder="Apellido" required className="p-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-500" onChange={e => setFormData({...formData, apellido: e.target.value})} />
            </div>
          )}
          <input type="tel" placeholder="Teléfono" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-500" onChange={e => setFormData({...formData, telefono: e.target.value})} />
          <input type="password" placeholder="Contraseña" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-500" onChange={e => setFormData({...formData, password: e.target.value})} />
          <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (isRegistering ? 'Crear Cuenta' : 'Entrar')}
          </button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center mt-6 text-xs font-black text-slate-400 uppercase">
          {isRegistering ? '¿Ya tienes cuenta? Ingresa' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
};

// --- PANEL ADMINISTRADOR ---
const AdminPanel = () => {
  const [rifas, setRifas] = useState([]);
  const [view, setView] = useState('list');
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [numsRifa, setNumsRifa] = useState([]);
  const [newRifa, setNewRifa] = useState({ nombre: '', descripcion: '', cantidad: 100, precio: 0, fecha: '' });
  const [imageFile, setImageFile] = useState(null);
  const [numDetail, setNumDetail] = useState(null);
  const [stats, setStats] = useState({ recaudado: 0, vendidos: 0, pendientes: 0 });
  const [loadingAction, setLoadingAction] = useState(false);
  const [showManualAssign, setShowManualAssign] = useState(false);
  const [manualData, setManualData] = useState({ numeros: '', nombre: '', apellido: '', telefono: '', estado: 'apartado' });

  useEffect(() => { 
    fetchRifas(); 
    calculateStats();
  }, []);

  const calculateStats = async () => {
    const { data: nums } = await supabase.from('numeros').select('estado, rifas(precio)');
    let total = 0; let pagados = 0; let revision = 0;
    nums?.forEach(n => {
      if (n.estado === 'pagado') { total += n.rifas.precio; pagados++; }
      if (n.estado === 'apartado') revision++;
    });
    setStats({ recaudado: total, vendidos: pagados, pendientes: revision });
  };

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*').order('creado_en', { ascending: false });
    setRifas(data || []);
  };

  const openRifaDetail = async (rifa) => {
    setSelectedRifa(rifa);
    const { data } = await supabase.from('numeros')
      .select('*, usuarios(id_usuario, nombre, apellido, telefono)')
      .eq('id_rifa', rifa.id_rifa)
      .order('numero', { ascending: true });
    setNumsRifa(data || []);
    setView('detail');
  };

  // --- LÓGICA DE SORTEO ---
  const realizarSorteo = async () => {
    const pagados = numsRifa.filter(n => n.estado === 'pagado');
    if (pagados.length === 0) return alert("No hay números pagados para realizar el sorteo.");
    if (!window.confirm(`Se elegirá un ganador entre ${pagados.length} números pagados. ¿Continuar?`)) return;

    setLoadingAction(true);
    const ganadorAleatorio = pagados[Math.floor(Math.random() * pagados.length)];

    const { error } = await supabase.from('rifas')
      .update({ id_ganador: ganadorAleatorio.id_numero, estado: 'finalizada' })
      .eq('id_rifa', selectedRifa.id_rifa);

    if (!error) {
      alert(`¡SORTEO COMPLETADO! Ganador: #${ganadorAleatorio.numero}`);
      fetchRifas();
      setView('list');
    } else {
      alert("Error al guardar ganador: " + error.message);
    }
    setLoadingAction(false);
  };

  const clientesAgrupados = numsRifa.reduce((acc, n) => {
    if (n.comprador_id) {
      const id = n.comprador_id;
      if (!acc[id]) {
        acc[id] = { info: n.usuarios, numeros: [], tienePendientes: false };
      }
      acc[id].numeros.push(n);
      if (n.estado === 'apartado') acc[id].tienePendientes = true;
    }
    return acc;
  }, {});

  const exportarExcel = () => {
    const dataParaExcel = [];
    Object.values(clientesAgrupados).forEach(cliente => {
      cliente.numeros.forEach(num => {
        dataParaExcel.push({
          Rifa: selectedRifa.nombre,
          Nombre: cliente.info?.nombre,
          Apellido: cliente.info?.apellido,
          Telefono: cliente.info?.telefono,
          Ticket: num.numero,
          Estado: num.estado,
          Ref: num.referencia_pago
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participantes");
    XLSX.writeFile(wb, `Reporte_${selectedRifa.nombre}.xlsx`);
  };

  const aprobarTodoElCliente = async (clienteId) => {
    if(!window.confirm("¿Aprobar todos los números pendientes?")) return;
    setLoadingAction(true);
    const { error } = await supabase.from('numeros').update({ estado: 'pagado' })
      .eq('id_rifa', selectedRifa.id_rifa).eq('comprador_id', clienteId).eq('estado', 'apartado');
    if(!error) openRifaDetail(selectedRifa);
    setLoadingAction(false);
  };

  const crearRifa = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    let publicUrl = null;
    try {
      if (imageFile) {
        const fileName = `${Math.random()}.${imageFile.name.split('.').pop()}`;
        await supabase.storage.from('rifas_premios').upload(fileName, imageFile);
        const { data: urlData } = supabase.storage.from('rifas_premios').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      }
      const { data, error } = await supabase.from('rifas').insert([{
        nombre: newRifa.nombre, descripcion: newRifa.descripcion,
        precio: newRifa.precio, cantidad_numeros: newRifa.cantidad,
        fecha_fin: newRifa.fecha, estado: 'activa', imagen_url: publicUrl
      }]).select();
      if (error) throw error;
      const numEntries = Array.from({ length: newRifa.cantidad }, (_, i) => ({
        id_rifa: data[0].id_rifa, numero: i + 1, estado: 'disponible'
      }));
      await supabase.from('numeros').insert(numEntries);
      setView('list'); fetchRifas(); calculateStats();
    } catch (err) { alert(err.message); }
    finally { setLoadingAction(false); }
  };

  const handleEditRifa = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    let publicUrl = selectedRifa.imagen_url;
    try {
      if (imageFile) {
        const fileName = `${Math.random()}.${imageFile.name.split('.').pop()}`;
        await supabase.storage.from('rifas_premios').upload(fileName, imageFile);
        const { data: urlData } = supabase.storage.from('rifas_premios').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      }
      await supabase.from('rifas').update({
        nombre: selectedRifa.nombre, descripcion: selectedRifa.descripcion,
        fecha_fin: selectedRifa.fecha_fin, imagen_url: publicUrl
      }).eq('id_rifa', selectedRifa.id_rifa);
      setView('list'); fetchRifas();
    } catch (err) { alert(err.message); }
    finally { setLoadingAction(false); }
  };

  const handleActionNumber = async (numId, nuevoEstado) => {
    const updateData = nuevoEstado === 'disponible' 
      ? { estado: 'disponible', comprador_id: null, referencia_pago: null } 
      : { estado: 'pagado' };
    await supabase.from('numeros').update(updateData).eq('id_numero', numId);
    openRifaDetail(selectedRifa);
    setNumDetail(null);
  };

  const handleManualAssignment = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const numsArr = manualData.numeros.split(',').map(n => parseInt(n.trim()));
      let { data: usuario } = await supabase.from('usuarios').select('id_usuario').eq('telefono', manualData.telefono).maybeSingle();
      let clienteId = usuario?.id_usuario;
      if (!clienteId) {
        const { data: newUser } = await supabase.from('usuarios').insert([{
          nombre: manualData.nombre, apellido: manualData.apellido,
          telefono: manualData.telefono, rol: 'cliente'
        }]).select().single();
        clienteId = newUser.id_usuario;
      }
      await supabase.from('numeros').update({
        estado: manualData.estado, comprador_id: clienteId, referencia_pago: 'VENTA_MANUAL'
      }).eq('id_rifa', selectedRifa.id_rifa).in('numero', numsArr);
      setShowManualAssign(false); openRifaDetail(selectedRifa); calculateStats();
    } catch (err) { alert(err.message); }
    finally { setLoadingAction(false); }
  };

  // Datos del ganador para el Admin
  const ticketGanador = selectedRifa?.id_ganador ? numsRifa.find(n => n.id_numero === selectedRifa.id_ganador) : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800">
      <nav className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <h1 className="font-black italic text-xl text-blue-600 tracking-tighter">RIFAPRO ADMIN</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-red-500 p-2"><LogOut size={22}/></button>
      </nav>

      <main className="p-4 max-w-[1400px] mx-auto">
        {view === 'list' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-[9px] font-bold text-slate-400 uppercase">Recaudado</p><p className="text-xl font-black text-green-600">${stats.recaudado}</p></div>
              <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-[9px] font-bold text-slate-400 uppercase">Vendidos</p><p className="text-xl font-black text-blue-600">{stats.vendidos}</p></div>
              <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-[9px] font-bold text-slate-400 uppercase">En Revisión</p><p className="text-xl font-black text-yellow-500">{stats.pendientes}</p></div>
            </div>
            <button onClick={() => setView('create')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all"><Plus/> Nueva Rifa</button>
            <div className="grid gap-4">
              {rifas.map(r => (
                <div key={r.id_rifa} className="bg-white p-4 rounded-3xl shadow-sm border flex items-center gap-4">
                  <div onClick={() => openRifaDetail(r)} className="cursor-pointer flex-1 flex items-center gap-4">
                    <img src={r.imagen_url || 'https://via.placeholder.com/150'} className={`w-16 h-16 rounded-2xl object-cover ${r.estado === 'finalizada' ? 'grayscale opacity-50' : ''}`} />
                    <div>
                      <h3 className="font-bold uppercase text-sm">{r.nombre}</h3>
                      <p className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${r.estado === 'finalizada' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{r.estado}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedRifa(r); setView('edit'); }} className="text-blue-500 p-2"><Edit3 size={18}/></button>
                    <button onClick={async () => { if(window.confirm("¿Borrar?")) { await supabase.from('rifas').delete().eq('id_rifa', r.id_rifa); fetchRifas(); } }} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'detail' && selectedRifa && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <button onClick={() => setView('list')} className="text-sm font-bold text-slate-400 flex items-center"><ChevronLeft size={16}/> Volver</button>
                <div className="flex gap-2">
                  <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"><FileText size={14}/> Excel</button>
                  <button onClick={() => setShowManualAssign(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"><Plus size={14}/> Venta Manual</button>
                  {selectedRifa.estado !== 'finalizada' && (
                    <button onClick={realizarSorteo} className="bg-yellow-500 text-yellow-900 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-md hover:bg-yellow-400">
                      <Trophy size={14}/> REALIZAR SORTEO
                    </button>
                  )}
                </div>
            </div>

            {/* INFORMACIÓN DEL GANADOR PARA EL ADMIN */}
            {ticketGanador && (
              <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-6 rounded-[2.5rem] border-4 border-yellow-500 shadow-xl text-white">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-500 p-3 rounded-2xl text-slate-900">
                    <Trophy size={32}/>
                  </div>
                  <div>
                    <h3 className="text-yellow-500 font-black uppercase italic text-xs tracking-widest">Ganador Oficial del Sorteo</h3>
                    <p className="text-2xl font-black uppercase">{ticketGanador.usuarios?.nombre} {ticketGanador.usuarios?.apellido}</p>
                    <div className="flex gap-4 mt-1">
                      <p className="flex items-center gap-1 text-sm font-bold text-blue-200"><Phone size={14}/> {ticketGanador.usuarios?.telefono}</p>
                      <p className="flex items-center gap-1 text-sm font-black text-yellow-400"><Ticket size={14}/> TICKET #{ticketGanador.numero}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-2/3 space-y-4">
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
                    {numsRifa.map(n => (
                      <button key={n.id_numero} onClick={() => n.estado !== 'disponible' && setNumDetail(n)}
                        className={`aspect-square rounded-lg text-[10px] font-bold border-2 transition-all ${selectedRifa.id_ganador === n.id_numero ? 'bg-yellow-400 border-yellow-600 text-yellow-900 scale-110' : ESTADOS[n.estado].bg + ' ' + ESTADOS[n.estado].border + ' ' + ESTADOS[n.estado].text}`}>
                        {n.numero}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3">
                <div className="bg-white p-6 rounded-3xl border shadow-sm sticky top-24 max-h-[70vh] overflow-y-auto">
                  <h3 className="text-xs font-black uppercase text-slate-400 mb-4">Participantes</h3>
                  {Object.values(clientesAgrupados).map(c => (
                    <div key={c.info?.id_usuario} className={`p-4 rounded-2xl border mb-3 ${c.tienePendientes ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50'}`}>
                      <p className="font-bold text-xs uppercase">{c.info?.nombre} {c.info?.apellido}</p>
                      <p className="text-[10px] text-slate-500">{c.info?.telefono}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.numeros.map(n => <span key={n.id_numero} className={`text-[9px] font-bold px-2 py-0.5 rounded border ${selectedRifa.id_ganador === n.id_numero ? 'bg-yellow-400 text-yellow-900' : 'bg-white'}`}>#{n.numero}</span>)}
                      </div>
                      {c.tienePendientes && <button onClick={() => aprobarTodoElCliente(c.info?.id_usuario)} className="w-full mt-2 bg-green-600 text-white text-[9px] font-black py-1 rounded">Aprobar Todo</button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border max-w-2xl mx-auto">
            <button onClick={() => setView('list')} className="mb-4 text-sm font-bold text-slate-400"><ChevronLeft size={16}/> Volver</button>
            <h2 className="text-xl font-black mb-4 uppercase italic">{view === 'create' ? 'Nueva Rifa' : 'Editar Rifa'}</h2>
            <form onSubmit={view === 'create' ? crearRifa : handleEditRifa} className="space-y-4">
              <input type='file' accept="image/*" className="w-full p-3 bg-slate-50 rounded-xl border text-xs" onChange={(e) => setImageFile(e.target.files[0])} />
              <input type="text" placeholder="Nombre" className="w-full p-3 bg-slate-50 rounded-xl border" required value={view === 'edit' ? selectedRifa.nombre : newRifa.nombre} onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, nombre: e.target.value}) : setNewRifa({...newRifa, nombre: e.target.value})} />
              <textarea placeholder="Descripción" className="w-full p-3 bg-slate-50 rounded-xl border" value={view === 'edit' ? selectedRifa.descripcion : newRifa.descripcion} onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, descripcion: e.target.value}) : setNewRifa({...newRifa, descripcion: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" disabled={view === 'edit'} placeholder="Cantidad" className="w-full p-3 bg-slate-50 rounded-xl border" value={view === 'edit' ? selectedRifa.cantidad_numeros : newRifa.cantidad} onChange={e => setNewRifa({...newRifa, cantidad: e.target.value})} />
                <input type="number" step="0.01" disabled={view === 'edit'} placeholder="Precio" className="w-full p-3 bg-slate-50 rounded-xl border" value={view === 'edit' ? selectedRifa.precio : newRifa.precio} onChange={e => setNewRifa({...newRifa, precio: parseFloat(e.target.value)})} />
              </div>
              <input type="date" className="w-full p-3 bg-slate-50 rounded-xl border" value={view === 'edit' ? selectedRifa.fecha_fin : newRifa.fecha} onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, fecha_fin: e.target.value}) : setNewRifa({...newRifa, fecha: e.target.value})} />
              <button disabled={loadingAction} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase">{loadingAction ? <Loader2 className="animate-spin" /> : 'Confirmar'}</button>
            </form>
          </div>
        )}
      </main>

      {/* Modales Manual y Detalle (Mantenidos) */}
      {showManualAssign && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-[2.5rem] w-full max-w-md">
            <h3 className="text-xl font-black mb-6 uppercase italic">Venta Manual</h3>
            <form onSubmit={handleManualAssignment} className="space-y-4">
              <input type="text" placeholder="Números (Ej: 1, 2, 3)" className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setManualData({...manualData, numeros: e.target.value})} />
              <div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Nombre" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setManualData({...manualData, nombre: e.target.value})} /><input type="text" placeholder="Apellido" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setManualData({...manualData, apellido: e.target.value})} /></div>
              <input type="tel" placeholder="Teléfono" className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setManualData({...manualData, telefono: e.target.value})} />
              <select className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setManualData({...manualData, estado: e.target.value})}><option value="apartado">Revisión</option><option value="pagado">Pagado</option></select>
              <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase">Confirmar</button>
              <button type="button" onClick={() => setShowManualAssign(false)} className="w-full text-slate-400 text-xs font-bold uppercase">Cerrar</button>
            </form>
          </div>
        </div>
      )}

      {numDetail && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm">
            <h3 className="text-2xl font-black italic uppercase mb-4">Ticket #{numDetail.numero}</h3>
            <p className="text-sm"><strong>Cliente:</strong> {numDetail.usuarios?.nombre} {numDetail.usuarios?.apellido}</p>
            <p className="text-sm mb-6"><strong>Ref:</strong> {numDetail.referencia_pago || 'Manual'}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleActionNumber(numDetail.id_numero, 'disponible')} className="bg-red-50 text-red-600 p-3 rounded-xl font-bold uppercase text-[10px]">Liberar</button>
              {numDetail.estado === 'apartado' && <button onClick={() => handleActionNumber(numDetail.id_numero, 'pagado')} className="bg-green-600 text-white p-3 rounded-xl font-bold uppercase text-[10px]">Confirmar</button>}
            </div>
            <button onClick={() => setNumDetail(null)} className="w-full mt-4 text-slate-300 font-bold uppercase text-[10px]">Cerrar</button>
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
    const { data } = await supabase.from('rifas').select('*').order('creado_en', { ascending: false });
    setRifas(data || []);
  };

  const selectRifa = async (rifa) => {
    setSelectedRifa(rifa);
    const { data } = await supabase.from('numeros').select('*').eq('id_rifa', rifa.id_rifa).order('numero', { ascending: true });
    setNums(data || []);
  };

  const descargarComprobante = () => {
    const misNums = nums.filter(n => n.comprador_id === userId);
    const doc = new jsPDF();
    doc.text("COMPROBANTE RIFAPRO", 105, 20, { align: 'center' });
    autoTable(doc, { startY: 30, head: [['Ticket', 'Estado']], body: misNums.map(n => [`#${n.numero}`, n.estado.toUpperCase()]) });
    doc.save("Tickets.pdf");
  };

  const esGanador = selectedRifa?.id_ganador && nums.find(n => n.id_numero === selectedRifa.id_ganador)?.comprador_id === userId;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h1 className="font-black italic text-xl text-blue-600">RIFAPRO</h1>
        <button onClick={() => supabase.auth.signOut()} className="p-2 text-slate-300"><LogOut size={20}/></button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {!selectedRifa ? (
          <div className="space-y-4">
            {rifas.map(r => (
              <div key={r.id_rifa} onClick={() => selectRifa(r)} className="bg-white p-4 rounded-[2.5rem] shadow-sm flex gap-4 items-center cursor-pointer border-2 border-transparent hover:border-blue-600 relative overflow-hidden">
                {r.estado === 'finalizada' && <div className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full z-10">CERRADA</div>}
                <img src={r.imagen_url || 'https://via.placeholder.com/150'} className={`w-20 h-20 rounded-3xl object-cover ${r.estado === 'finalizada' && 'grayscale opacity-50'}`} />
                <div>
                  <h3 className="text-lg font-black uppercase italic">{r.nombre}</h3>
                  <p className="text-blue-600 font-black">${r.precio} USD</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pb-32">
            <button onClick={() => setSelectedRifa(null)} className="mb-4 text-sm font-bold text-slate-400 flex items-center"><ChevronLeft size={16}/> Volver</button>
            
            {/* CELEBRACIÓN DEL CLIENTE */}
            {selectedRifa.id_ganador && (
              <div className={`relative overflow-hidden p-8 rounded-[3rem] mb-6 text-center shadow-2xl border-4 ${esGanador ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-200' : 'bg-slate-900 border-slate-700'}`}>
                <div className="absolute inset-0 opacity-20 pointer-events-none fireworks-bg"></div>
                <Trophy className={`mx-auto mb-4 ${esGanador ? 'text-white animate-bounce' : 'text-yellow-500'}`} size={64}/>
                <h2 className={`text-2xl font-black uppercase italic ${esGanador ? 'text-white' : 'text-yellow-400'}`}>
                   {esGanador ? "¡FELICIDADES, GANASTE!" : "SORTEO FINALIZADO"}
                </h2>
                <div className="mt-4 inline-block bg-white text-slate-900 px-8 py-3 rounded-full text-4xl font-black shadow-lg">
                  #{nums.find(n => n.id_numero === selectedRifa.id_ganador)?.numero}
                </div>
                {esGanador && <div className="mt-4 text-white font-black animate-pulse uppercase tracking-widest text-xs">Premio adjudicado 🥳</div>}
              </div>
            )}

            <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm mb-6">
              <h2 className="text-2xl font-black uppercase italic">{selectedRifa.nombre}</h2>
              {nums.some(n => n.comprador_id === userId) && (
                <button onClick={descargarComprobante} className="mt-4 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase border px-4 py-2 rounded-full"><Download size={14}/> Mis Tickets</button>
              )}
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 bg-white p-6 rounded-[2.5rem] border shadow-inner">
              {nums.map(n => {
                const isMine = n.comprador_id === userId;
                const isWinner = selectedRifa.id_ganador === n.id_numero;
                return (
                  <button key={n.id_numero} disabled={selectedRifa.estado === 'finalizada' || (n.estado !== 'disponible' && !isMine)} onClick={() => { if(n.estado === 'disponible') setCart(prev => prev.includes(n.id_numero) ? prev.filter(id => id !== n.id_numero) : [...prev, n.id_numero]); }}
                    className={`aspect-square rounded-2xl text-[10px] font-black border-2 transition-all relative ${isWinner ? 'bg-yellow-400 border-yellow-600 text-yellow-900 scale-110' : isMine ? 'bg-blue-600 border-blue-800 text-white' : n.estado === 'pagado' ? 'bg-red-500 opacity-20 grayscale' : cart.includes(n.id_numero) ? 'bg-slate-900 text-white' : 'bg-green-500 text-white'}`}>
                    {n.numero}
                    {isWinner && <PartyPopper className="absolute -top-2 -right-2 text-orange-600" size={14}/>}
                  </button>
                );
              })}
            </div>

            {cart.length > 0 && selectedRifa.estado !== 'finalizada' && (
              <div className="fixed bottom-6 left-4 right-4 bg-slate-900 text-white p-6 rounded-[2.5rem] flex justify-between items-center shadow-2xl">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cart.length} Tickets</p><p className="text-2xl font-black">${(cart.length * selectedRifa.precio).toFixed(2)}</p></div>
                <button onClick={() => setShowPay(true)} className="bg-blue-600 px-8 py-4 rounded-2xl font-black uppercase text-xs">Pagar</button>
              </div>
            )}
          </div>
        )}
      </main>

      {showPay && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-sm">
            <h3 className="text-2xl font-black mb-4 uppercase italic text-blue-600 text-center tracking-tighter">Reportar Pago</h3>
            <input type="text" maxLength="4" placeholder="Últimos 4 Dígitos Ref." className="w-full p-5 bg-slate-50 border-2 rounded-2xl mb-5 font-black text-center text-lg outline-none focus:border-blue-500" onChange={e => setPayData({ref: e.target.value})} />
            <button onClick={async () => { if(!payData.ref) return alert("Referencia necesaria"); await supabase.from('numeros').update({ estado: 'apartado', comprador_id: userId, referencia_pago: payData.ref }).in('id_numero', cart); setSelectedRifa(null); setShowPay(false); }} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg shadow-blue-200">Confirmar</button>
            <button onClick={() => setShowPay(false)} className="w-full mt-3 text-slate-400 font-black text-[10px] uppercase py-2">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkRole = async (userId) => {
    try {
      const { data } = await supabase.from('usuarios').select('rol').eq('id_usuario', userId).single();
      setRole(data?.rol || 'cliente');
    } catch { setRole('cliente'); } finally { setLoading(false); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); if (session) checkRole(session.user.id); else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); if (s) checkRole(s.user.id); else { setRole(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 mb-2" size={32}/><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Iniciando Rifapro...</p></div>;
  if (!session) return <Auth onLogin={setSession} />;
  return role === 'admin' ? <AdminPanel /> : <ClienteView userId={session.user.id} />;
}
