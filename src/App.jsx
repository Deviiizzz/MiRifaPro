import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LogOut, Plus, Ticket, X, CheckCircle2, Loader2, CreditCard, 
  User, Phone, ChevronLeft, Trash2, Download, Eye, EyeOff, FileText, 
  Image as ImageIcon, Edit3, Printer, Trophy, PartyPopper, Calendar, 
  Info, Building2, Smartphone, AlertCircle, Crown, Star
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './index.css'; 

const ESTADOS = {
  disponible: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white', label: 'Libre' },
  apartado: { bg: 'bg-red-600', border: 'border-red-700', text: 'text-white', label: 'Revision' },
  pagado: { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white', label: 'Vendido' }
};

// --- COMPONENTE DE ACCESO ---
const Auth = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', telefono: '', password: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const finalEmail = `${formData.telefono}@alexcars.com`;

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
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-3xl rotate-12 shadow-lg shadow-blue-200">
                <Trophy size={40} className="text-white"/>
            </div>
        </div>
        <h2 className="text-4xl font-black text-center mb-1 italic tracking-tighter text-blue-600 uppercase">AlexCars' Edition</h2>
        <p className="text-center text-slate-400 text-[10px] mb-8 font-black uppercase tracking-[0.2em]">Sistema Profesional de Sorteos</p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Nombre</label>
                <input type="text" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-blue-500 transition-all text-sm font-bold" onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Apellido</label>
                <input type="text" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-blue-500 transition-all text-sm font-bold" onChange={e => setFormData({...formData, apellido: e.target.value})} />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Teléfono</label>
            <div className="relative">
                <Smartphone className="absolute left-4 top-4 text-slate-300" size={18}/>
                <input type="tel" required className="w-full p-4 pl-12 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-blue-500 transition-all text-sm font-bold" onChange={e => setFormData({...formData, telefono: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Contraseña</label>
            <input type="password" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-blue-500 transition-all text-sm font-bold" onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          
          <button className="w-full bg-blue-600 text-white p-5 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>
        
        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center mt-8 text-[11px] font-black text-slate-400 uppercase tracking-tighter hover:text-blue-600 transition-all">
          {isRegistering ? '¿Ya tienes una cuenta? Entrar ahora' : '¿Eres nuevo? Regístrate aquí'}
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
  const [pendientesNotif, setPendientesNotif] = useState({});

  useEffect(() => { 
    fetchRifas(); 
    calculateStats();
  }, []);

  const calculateStats = async () => {
  const { data: nums, error } = await supabase
    .from('numeros')
    // Cambiamos 'rifas(precio)' por la relación específica del número
    .select(`
      estado,
      rifas!numeros_id_rifa_fkey (
        precio
      )
    `);

  if (error) {
    console.error("❌ Error detallado:", error);
    return;
  }

  let total = 0;
  let pagados = 0;
  let revision = 0;
  
  nums?.forEach(n => {
    // IMPORTANTE: Ahora el objeto se llamará 'rifas' pero debemos 
    // acceder con cuidado por si la respuesta cambia de estructura
    const precioTicket = n.rifas?.precio || 0;

    if (n.estado === 'pagado') { 
      total += precioTicket; 
      pagados++; 
    }
    if (n.estado === 'apartado') {
      revision++;
    }
  });

  setStats({ 
    recaudado: total.toLocaleString('en-US', { minimumFractionDigits: 2 }), 
    vendidos: pagados, 
    pendientes: revision 
  });
};
  
  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*').order('creado_en', { ascending: false });
    const rifasData = data || [];
    setRifas(rifasData);

    const notifs = {};
    for (const rifa of rifasData) {
        if(rifa.estado !== 'finalizada') {
            const { count } = await supabase.from('numeros').select('*', { count: 'exact', head: true }).eq('id_rifa', rifa.id_rifa).eq('estado', 'apartado');
            notifs[rifa.id_rifa] = count || 0;
        }
    }
    setPendientesNotif(notifs);
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

  const realizarSorteo = async () => {
    const pagados = numsRifa.filter(n => n.estado === 'pagado');
    if (pagados.length === 0) {
      alert("No puedes hacer el sorteo. Aún no hay tickets pagados confirmados.");
      return;
    }
    if (!window.confirm("¿Estás seguro de finalizar la rifa y realizar el sorteo? El sistema elegirá un ganador al azar entre los tickets VENDIDOS. Esta acción no se puede deshacer.")) return;

    setLoadingAction(true);
    const ganador = pagados[Math.floor(Math.random() * pagados.length)];

    const { error } = await supabase.from('rifas').update({
      estado: 'finalizada',
      id_ganador: ganador.id_numero
    }).eq('id_rifa', selectedRifa.id_rifa);

    if (!error) {
      alert(`¡SORTEO REALIZADO! 🎉 El ticket ganador es el #${ganador.numero}`);
      const updatedRifa = { ...selectedRifa, estado: 'finalizada', id_ganador: ganador.id_numero };
      setSelectedRifa(updatedRifa);
      setRifas(rifas.map(r => r.id_rifa === updatedRifa.id_rifa ? updatedRifa : r));
    } else {
      alert("Error al realizar el sorteo: " + error.message);
    }
    setLoadingAction(false);
  };

  const handleActionNumber = async (numId, nuevoEstado) => {
    setLoadingAction(true);
    const updateData = nuevoEstado === 'disponible' 
      ? { estado: 'disponible', comprador_id: null, referencia_pago: null } 
      : { estado: 'pagado' };
    
    await supabase.from('numeros').update(updateData).eq('id_numero', numId);
    await openRifaDetail(selectedRifa);
    setNumDetail(null);
    calculateStats();
    setLoadingAction(false);
  };

  const aprobarTodoElCliente = async (clienteId) => {
    if(!window.confirm("¿Confirmar todos los pagos pendientes de este cliente?")) return;
    setLoadingAction(true);
    const { error } = await supabase
      .from('numeros')
      .update({ estado: 'pagado' })
      .eq('id_rifa', selectedRifa.id_rifa)
      .eq('comprador_id', clienteId)
      .eq('estado', 'apartado');
    
    if(!error) openRifaDetail(selectedRifa);
    calculateStats();
    setLoadingAction(false);
  };

  const crearRifa = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    let publicUrl = null;

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('rifas_premios').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
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

      alert("Rifa creada exitosamente");
      setView('list');
      fetchRifas();
      calculateStats();
      setImageFile(null);
      setNewRifa({ nombre: '', descripcion: '', cantidad: 100, precio: 0, fecha: '' });
    } catch (err) { alert("Error: " + err.message); }
    finally { setLoadingAction(false); }
  };

  const handleEditRifa = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    let publicUrl = selectedRifa.imagen_url;

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('rifas_premios').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('rifas_premios').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('rifas').update({
        nombre: selectedRifa.nombre,
        descripcion: selectedRifa.descripcion,
        fecha_fin: selectedRifa.fecha_fin,
        imagen_url: publicUrl
      }).eq('id_rifa', selectedRifa.id_rifa);

      if (error) throw error;

      alert("Rifa actualizada");
      setView('list');
      fetchRifas();
      setImageFile(null);
    } catch (err) { alert("Error al editar: " + err.message); }
    finally { setLoadingAction(false); }
  };

  const handleManualAssignment = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const numerosArray = manualData.numeros.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      if (numerosArray.length === 0) throw new Error("Ingresa números válidos");
      
      let { data: usuario } = await supabase.from('usuarios').select('id_usuario').eq('telefono', manualData.telefono).maybeSingle();
      let clienteId = usuario?.id_usuario;
      
      if (!clienteId) {
        const { data: newUser, error: createError } = await supabase.from('usuarios').insert([{
          nombre: manualData.nombre, apellido: manualData.apellido,
          telefono: manualData.telefono, rol: 'cliente'
        }]).select().single();
        if (createError) throw createError;
        clienteId = newUser.id_usuario;
      }

      const { error: updateError } = await supabase.from('numeros').update({
        estado: manualData.estado, comprador_id: clienteId, referencia_pago: 'VENTA_INTERNA'
      }).eq('id_rifa', selectedRifa.id_rifa).in('numero', numerosArray);

      if (updateError) throw updateError;
      
      alert("Números asignados correctamente");
      setShowManualAssign(false);
      openRifaDetail(selectedRifa);
      calculateStats();
    } catch (err) { alert("Error: " + err.message); }
    finally { setLoadingAction(false); }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Participantes - ${selectedRifa.nombre}`, 14, 15);
    const tableData = numsRifa.filter(n => n.comprador_id).map(n => [
        `${n.usuarios?.nombre} ${n.usuarios?.apellido}`,
        n.usuarios?.telefono || 'N/A',
        n.numero,
        n.estado.toUpperCase()
      ]);
    autoTable(doc, { head: [['Nombre', 'Teléfono', 'Ticket #', 'Estado']], body: tableData, startY: 20 });
    doc.save(`Rifa_${selectedRifa.nombre}.pdf`);
  };

  const exportToExcel = () => {
    const data = numsRifa.filter(n => n.comprador_id).map(n => ({
        Nombre: `${n.usuarios?.nombre} ${n.usuarios?.apellido}`,
        Telefono: n.usuarios?.telefono,
        Ticket: n.numero,
        Estado: n.estado,
        Referencia: n.referencia_pago
      }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participantes");
    XLSX.writeFile(wb, `Reporte_${selectedRifa.nombre}.xlsx`);
  };

  const clientesAgrupados = numsRifa.reduce((acc, n) => {
    if (n.comprador_id) {
      const id = n.comprador_id;
      if (!acc[id]) { acc[id] = { info: n.usuarios, numeros: [], tienePendientes: false }; }
      acc[id].numeros.push(n);
      if (n.estado === 'apartado') acc[id].tienePendientes = true;
    }
    return acc;
  }, {});

  const ticketGanador = selectedRifa?.id_ganador ? numsRifa.find(n => n.id_numero === selectedRifa.id_ganador) : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
      <nav className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white"><Building2 size={18}/></div>
            <h1 className="font-black italic text-xl text-blue-600 tracking-tighter uppercase">AlexCars' Edition ADMIN</h1>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); }} className="text-red-500 p-2 bg-red-50 rounded-xl transition-all hover:bg-red-100 flex items-center gap-2 text-xs font-black">
          <LogOut size={18}/> SALIR
        </button>
      </nav>

      <main className="p-4 max-w-[1400px] mx-auto">
        {view === 'list' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-2xl text-green-600"><CreditCard/></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recaudado</p><p className="text-2xl font-black text-slate-900">${stats.recaudado}</p></div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><Ticket/></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendidos</p><p className="text-2xl font-black text-slate-900">{stats.vendidos}</p></div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-2xl text-red-600 animate-pulse"><AlertCircle/></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Revisión</p><p className="text-2xl font-black text-slate-900">{stats.pendientes}</p></div>
              </div>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-400">Tus Sorteos</h2>
                <button onClick={() => setView('create')} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase">
                    <Plus size={18}/> Crear Rifa
                </button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {rifas.map(r => (
                <div key={r.id_rifa} className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4 group transition-all hover:shadow-xl relative overflow-hidden">
                  {r.estado === 'finalizada' && <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[9px] font-black px-4 py-1 rounded-bl-xl z-10">FINALIZADA</div>}
                  {r.imagen_url ? (
                    <img src={r.imagen_url} className={`w-20 h-20 rounded-[1.8rem] object-cover bg-slate-100 shadow-md shadow-slate-100 ${r.estado === 'finalizada' ? 'grayscale opacity-80' : ''}`} />
                  ) : (
                    <div className="w-20 h-20 rounded-[1.8rem] bg-slate-50 flex items-center justify-center text-slate-200"><ImageIcon size={32}/></div>
                  )}
                  <div onClick={() => openRifaDetail(r)} className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-black uppercase text-sm leading-tight text-slate-700">{r.nombre}</h3>
                        {pendientesNotif[r.id_rifa] > 0 && (
                            <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-bounce">
                                {pendientesNotif[r.id_rifa]} PENDIENTES
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Finaliza: {r.fecha_fin}</p>
                    <p className="text-blue-600 font-black text-xs mt-1">${r.precio} USD</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setSelectedRifa(r); setView('edit'); }} className="text-blue-500 bg-blue-50 p-3 rounded-2xl hover:bg-blue-100 transition-all"><Edit3 size={18}/></button>
                    <button onClick={async () => { if(window.confirm("¿Seguro de borrar esta rifa? Todos los números se perderán.")) { await supabase.from('rifas').delete().eq('id_rifa', r.id_rifa); fetchRifas(); calculateStats(); } }} className="text-slate-300 hover:text-red-500 bg-slate-50 p-3 rounded-2xl transition-all"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'detail' && selectedRifa && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <button onClick={() => setView('list')} className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><ChevronLeft size={18}/> Volver al Listado</button>
                <div className="flex flex-wrap gap-2">
                    <button onClick={exportToPDF} className="bg-slate-900 text-white p-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2"><FileText size={16}/> PDF</button>
                    <button onClick={exportToExcel} className="bg-green-600 text-white p-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2"><Download size={16}/> EXCEL</button>
                    {selectedRifa.estado === 'activa' && (
                        <>
                            <button onClick={() => setShowManualAssign(true)} className="bg-blue-600 text-white p-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-blue-100"><Plus size={16}/> Venta Manual</button>
                            <button onClick={realizarSorteo} disabled={loadingAction} className="bg-yellow-500 text-white p-3 px-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-yellow-200 hover:bg-yellow-600 transition-all ml-4">
                                {loadingAction ? <Loader2 size={16} className="animate-spin"/> : <Crown size={18}/>} Realizar Sorteo
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-2/3 space-y-4">
                {selectedRifa.estado === 'finalizada' && ticketGanador && (
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-yellow-200 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden border-4 border-yellow-300">
                        <div className="bg-white/20 p-5 rounded-3xl backdrop-blur-sm animate-celebration relative z-10"><Crown size={56} className="text-white drop-shadow-md"/></div>
                        <div className="text-center md:text-left relative z-10">
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter drop-shadow-md">¡Tenemos un Ganador!</h3>
                            <p className="text-sm font-bold mt-2 uppercase tracking-widest opacity-90">Ticket de la suerte: <span className="bg-white text-yellow-600 px-2 py-1 rounded-md font-black">#{ticketGanador.numero}</span></p>
                            <div className="mt-4 bg-black/10 p-4 rounded-2xl inline-block backdrop-blur-md">
                                <p className="font-black text-lg">{ticketGanador.usuarios?.nombre} {ticketGanador.usuarios?.apellido}</p>
                                <p className="text-sm flex items-center gap-2 justify-center md:justify-start mt-1"><Phone size={14}/> {ticketGanador.usuarios?.telefono}</p>
                            </div>
                        </div>
                        <PartyPopper size={120} className="absolute -right-10 -bottom-10 text-white opacity-20 rotate-12"/>
                    </div>
                )}

                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex gap-6 items-center">
                    {selectedRifa.imagen_url && <img src={selectedRifa.imagen_url} className="w-24 h-24 rounded-3xl object-cover shadow-lg" />}
                    <div>
                        <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">{selectedRifa.nombre}</h2>
                        <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest">{selectedRifa.estado === 'activa' ? 'Control de tickets en tiempo real' : 'Sorteo Finalizado'}</p>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {numsRifa.map(n => {
                      let btnClass = `aspect-square rounded-xl text-[10px] font-black border-2 transition-all shadow-sm ${ESTADOS[n.estado].bg} ${ESTADOS[n.estado].border} ${ESTADOS[n.estado].text}`;
                      if (n.estado !== 'disponible') btnClass += ' scale-95';
                      else btnClass += ' hover:scale-105';
                      if (selectedRifa.estado === 'finalizada' && n.id_numero === selectedRifa.id_ganador) {
                          btnClass = 'aspect-square rounded-xl text-[10px] font-black border-4 bg-yellow-400 border-yellow-500 text-white shadow-lg shadow-yellow-200 scale-110 animate-pulse z-10';
                      }
                      return (
                        <button key={n.id_numero} onClick={() => n.estado !== 'disponible' && setNumDetail(n)} className={btnClass}>{n.numero}</button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-24 max-h-[80vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-[0.2em] flex items-center gap-2"><User size={14}/> Lista de Participantes</h3>
                  <div className="space-y-4">
                    {Object.values(clientesAgrupados).map((item) => {
                      const tieneGanador = item.numeros.some(n => n.id_numero === selectedRifa.id_ganador);
                      return (
                      <div key={item.info?.id_usuario} className={`p-5 rounded-3xl border-2 transition-all ${tieneGanador ? 'border-yellow-300 bg-yellow-50' : item.tienePendientes ? 'border-red-200 bg-red-50/50' : 'border-slate-50 bg-slate-50/30'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-black text-xs uppercase leading-tight text-slate-800 flex items-center gap-2">
                                {item.info?.nombre} {item.info?.apellido}
                                {tieneGanador && <Star size={12} className="text-yellow-500 fill-yellow-500"/>}
                            </p>
                            <p className="text-[10px] text-slate-500 font-black flex items-center gap-1 mt-1"><Phone size={10} className="text-blue-500"/> {item.info?.telefono}</p>
                          </div>
                          {item.tienePendientes && selectedRifa.estado === 'activa' && (
                            <button onClick={() => aprobarTodoElCliente(item.info?.id_usuario)} className="bg-red-600 text-white text-[9px] font-black px-3 py-1.5 rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 uppercase">Aprobar</button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.numeros.map(n => {
                            const esEsteGanador = n.id_numero === selectedRifa.id_ganador;
                            return (
                                <span key={n.id_numero} className={`text-[9px] font-black px-2 py-1 rounded-lg border ${esEsteGanador ? 'bg-yellow-400 text-white border-yellow-500 shadow-sm' : n.estado === 'apartado' ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-white text-slate-400 border-slate-100'}`}>
                                    {esEsteGanador && <Crown size={8} className="inline mr-1 -mt-0.5"/>}#{n.numero}
                                </span>
                            )
                          })}
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 max-w-2xl mx-auto">
            <button onClick={() => setView('list')} className="mb-6 flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><ChevronLeft size={18}/> Cancelar</button>
            <h2 className="text-3xl font-black mb-8 uppercase italic text-slate-900 tracking-tighter">{view === 'create' ? 'Nueva Rifa' : 'Editar Sorteo'}</h2>
            <form onSubmit={view === 'create' ? crearRifa : handleEditRifa} className="space-y-6">
              <div className="flex justify-center">
                <label className="group w-full flex flex-col items-center px-4 py-8 bg-slate-50 text-blue-500 rounded-[2rem] border-4 border-dashed border-slate-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all">
                  <div className="bg-white p-4 rounded-full shadow-md text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon size={40} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">{imageFile ? imageFile.name : 'Cargar Foto del Premio'}</span>
                  <input type='file' accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
                </label>
              </div>
              <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Nombre del Premio</label>
                    <input type="text" placeholder="Ej: iPhone 15 Pro Max" className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-100 outline-none focus:border-blue-500 font-bold" required 
                        value={view === 'edit' ? selectedRifa.nombre : newRifa.nombre}
                        onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, nombre: e.target.value}) : setNewRifa({...newRifa, nombre: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Descripción Detallada</label>
                    <textarea placeholder="Cuéntale a tus clientes sobre el sorteo..." className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-100 outline-none focus:border-blue-500 font-bold h-32" 
                        value={view === 'edit' ? selectedRifa.descripcion : newRifa.descripcion}
                        onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, descripcion: e.target.value}) : setNewRifa({...newRifa, descripcion: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Cant. Números</label>
                        <input type="number" disabled={view === 'edit'} className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-100 font-black text-lg text-blue-600" value={view === 'edit' ? selectedRifa.cantidad_numeros : newRifa.cantidad} onChange={e => setNewRifa({...newRifa, cantidad: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Precio x Ticket ($)</label>
                        <input type="number" step="0.01" disabled={view === 'edit'} className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-100 font-black text-lg text-green-600" value={view === 'edit' ? selectedRifa.precio : newRifa.precio} onChange={e => setNewRifa({...newRifa, precio: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-1 bg-blue-50 p-4 rounded-3xl border border-blue-100">
                    <label className="text-[10px] font-black text-blue-400 ml-2 uppercase flex items-center gap-2"><Calendar size={14}/> Fecha de Finalización</label>
                    <input type="date" className="w-full p-4 bg-white rounded-2xl border-none outline-none font-black text-blue-600 uppercase" value={view === 'edit' ? selectedRifa.fecha_fin : newRifa.fecha} onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, fecha_fin: e.target.value}) : setNewRifa({...newRifa, fecha: e.target.value})} />
                  </div>
              </div>
              <button disabled={loadingAction} className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                {loadingAction ? <Loader2 className="animate-spin" /> : 'Confirmar Sorteo'}
              </button>
            </form>
          </div>
        )}
      </main>

      {showManualAssign && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
           <div className="bg-white p-8 rounded-[3rem] w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase italic text-slate-900 tracking-tighter">Venta Directa</h3>
                <button onClick={() => setShowManualAssign(false)} className="text-slate-300 hover:text-slate-900"><X/></button>
            </div>
            <form onSubmit={handleManualAssignment} className="space-y-4">
              <input type="text" required placeholder="Tickets (Separar por comas)" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" onChange={e => setManualData({...manualData, numeros: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Nombre" required className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" onChange={e => setManualData({...manualData, nombre: e.target.value})} />
                <input type="text" placeholder="Apellido" required className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" onChange={e => setManualData({...manualData, apellido: e.target.value})} />
              </div>
              <input type="tel" placeholder="Teléfono" required className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" onChange={e => setManualData({...manualData, telefono: e.target.value})} />
              <select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-black uppercase text-xs" onChange={e => setManualData({...manualData, estado: e.target.value})}>
                <option value="apartado">🟡 PONER EN REVISIÓN</option>
                <option value="pagado">🔵 MARCAR COMO VENDIDO</option>
              </select>
              <button className="w-full bg-slate-900 text-white p-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200 mt-4">Confirmar Asignación</button>
            </form>
          </div>
        </div>
      )}

      {numDetail && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-2 ${ESTADOS[numDetail.estado].bg}`}></div>
            {selectedRifa?.estado === 'finalizada' && numDetail.id_numero === selectedRifa.id_ganador && (
                <div className="absolute top-0 left-0 right-0 h-8 bg-yellow-400 flex items-center justify-center text-yellow-900 text-[10px] font-black uppercase animate-pulse"><Crown size={12} className="mr-1"/> TICKET GANADOR</div>
            )}
            <div className={`flex justify-between items-center mb-6 ${selectedRifa?.estado === 'finalizada' && numDetail.id_numero === selectedRifa.id_ganador ? 'mt-6' : ''}`}>
                <h3 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Ticket #{numDetail.numero}</h3>
                <button onClick={() => setNumDetail(null)} className="text-slate-300 hover:text-slate-900"><X/></button>
            </div>
            <div className="space-y-4 mb-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl text-blue-600 shadow-sm"><User size={18}/></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase">Cliente</p><p className="text-sm font-black text-slate-800">{numDetail.usuarios?.nombre} {numDetail.usuarios?.apellido}</p></div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl text-green-600 shadow-sm"><Phone size={18}/></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase">Teléfono</p><p className="text-sm font-black text-slate-800">{numDetail.usuarios?.telefono}</p></div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl text-slate-600 shadow-sm"><CreditCard size={18}/></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase">Referencia</p><p className="text-sm font-black text-slate-800 tracking-widest">{numDetail.referencia_pago || 'SIN REF.'}</p></div>
                </div>
            </div>
            {selectedRifa.estado === 'activa' && (
                <div className="grid grid-cols-1 gap-3">
                    {numDetail.estado === 'apartado' && (
                        <button onClick={() => handleActionNumber(numDetail.id_numero, 'pagado')} className="bg-blue-600 text-white p-5 rounded-3xl font-black text-xs uppercase shadow-xl shadow-blue-100 flex items-center justify-center gap-2">
                            <CheckCircle2 size={18}/> Confirmar Pago
                        </button>
                    )}
                    <button onClick={() => handleActionNumber(numDetail.id_numero, 'disponible')} className="bg-red-50 text-red-600 p-5 rounded-3xl font-black text-xs uppercase hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                        <Trash2 size={18}/> Liberar Ticket
                    </button>
                </div>
            )}
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
  const [hideSold, setHideSold] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [misNumeros, setMisNumeros] = useState([]);

  useEffect(() => { 
    fetchRifas(); 
    fetchMisNumeros();
  }, [userId]);

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*').order('estado', { ascending: true }).order('creado_en', { ascending: false });
    setRifas(data || []);
  };

  const fetchMisNumeros = async () => {
    const { data } = await supabase.from('numeros').select('id_numero, id_rifa, numero').eq('comprador_id', userId);
    setMisNumeros(data || []);
  };

  const selectRifa = async (rifa) => {
    setSelectedRifa(rifa);
    const { data } = await supabase.from('numeros').select('*').eq('id_rifa', rifa.id_rifa).order('numero', { ascending: true });
    setNums(data || []);
    setCart([]);
  };

  const reportarPago = async () => {
    if(!payData.ref || payData.ref.length < 4) return alert("Ingresa los últimos 4 dígitos de la referencia");
    const { error } = await supabase.from('numeros').update({ 
        estado: 'apartado', comprador_id: userId, referencia_pago: payData.ref 
    }).in('id_numero', cart);
    if(!error) { 
        alert("¡Reporte de pago enviado! Tu ticket estará en revisión."); 
        setSelectedRifa(null); setShowPay(false); setPaymentMethod(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100"><Trophy size={20}/></div>
            <h1 className="font-black italic text-2xl tracking-tighter text-blue-600 uppercase">AlexCars' Edition</h1>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); }} className="p-3 text-slate-300 bg-slate-50 rounded-2xl hover:text-red-500 hover:bg-red-50 transition-all">
          <LogOut size={22}/>
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {!selectedRifa ? (
          <div className="space-y-6 mt-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] text-white shadow-2xl shadow-blue-100 relative overflow-hidden">
                <PartyPopper className="absolute -right-4 -bottom-4 opacity-20 rotate-12" size={140}/>
                <h2 className="text-3xl font-black italic uppercase leading-none mb-2">¡Mucha Suerte!</h2>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">Elige un sorteo y participa ahora</p>
            </div>
            <div className="flex items-center gap-4 px-2">
                <div className="h-px bg-slate-200 flex-1"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sorteos</h3>
                <div className="h-px bg-slate-200 flex-1"></div>
            </div>
            {rifas.map(r => {
              const isFinished = r.estado === 'finalizada';
              const iWon = isFinished && r.id_ganador && misNumeros.some(n => n.id_numero === r.id_ganador);
              const cardClasses = iWon ? "bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-400 shadow-md" : "bg-white border-slate-100 hover:border-blue-500 shadow-sm";
              return (
              <div key={r.id_rifa} onClick={() => selectRifa(r)} className={`p-5 rounded-[2.8rem] border flex gap-5 items-center transition-all group active:scale-95 cursor-pointer relative overflow-hidden ${cardClasses}`}>
                <img src={r.imagen_url || 'https://via.placeholder.com/150'} className={`w-24 h-24 rounded-[2rem] object-cover bg-slate-50 shadow-xl shadow-slate-200 group-hover:rotate-3 transition-transform ${isFinished && !iWon ? 'grayscale opacity-70' : ''}`} />
                <div className="flex-1 z-10">
                  <h3 className="text-xl font-black uppercase italic leading-none text-slate-800">{r.nombre}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-green-100 text-green-600 text-[10px] font-black px-2 py-1 rounded-lg">${r.precio} USD</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{r.cantidad_numeros} Números</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                      {isFinished ? (
                          iWon ? (<div className="text-yellow-600 font-black text-[10px] uppercase flex items-center gap-1 bg-yellow-100 px-3 py-1.5 rounded-full"><Crown size={14}/> ¡GANASTE! Ver Detalles</div>) : (<div className="text-slate-400 font-black text-[10px] uppercase bg-slate-100 px-3 py-1.5 rounded-full">Sorteo Finalizado</div>)
                      ) : (<div className="text-blue-600 font-black text-[10px] uppercase flex items-center gap-1">Participar <ChevronLeft size={14} className="rotate-180"/></div>)}
                  </div>
                </div>
                {iWon && <Star size={100} className="absolute -right-6 -bottom-6 text-yellow-200 opacity-50 rotate-45"/>}
              </div>
            )})}
          </div>
        ) : (
          <div className="pb-40">
            {(() => {
                const isFinished = selectedRifa.estado === 'finalizada';
                const elTicketGanador = isFinished ? nums.find(n => n.id_numero === selectedRifa.id_ganador) : null;
                const iWonThisRifa = elTicketGanador && elTicketGanador.comprador_id === userId;
                return (
                    <>
                        <div className="flex justify-between items-center mb-6 pt-2">
                          <button onClick={() => setSelectedRifa(null)} className="flex items-center gap-2 font-black text-slate-400 text-[10px] uppercase tracking-widest px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm"><ChevronLeft size={16}/> Atrás</button>
                          {!isFinished && (
                              <button onClick={() => setHideSold(!hideSold)} className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-md ${hideSold ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                {hideSold ? <Eye size={16}/> : <EyeOff size={16}/>} {hideSold ? 'Ver Todo' : 'Ver Libres'}
                              </button>
                          )}
                        </div>
                        {isFinished && iWonThisRifa && (
                            <div className="fireworks-bg bg-yellow-500 p-8 rounded-[3rem] text-white shadow-2xl shadow-yellow-200 mb-8 text-center border-4 border-yellow-300 relative overflow-hidden">
                                <div className="animate-celebration inline-block mb-4 bg-white/20 p-5 rounded-[2rem] backdrop-blur-md"><Crown size={64} className="text-yellow-100 drop-shadow-lg"/></div>
                                <h2 className="text-4xl font-black italic uppercase leading-none mb-2 drop-shadow-md">¡FELICIDADES!</h2>
                                <p className="text-yellow-100 text-sm font-bold uppercase tracking-widest drop-shadow-sm mb-6">Eres el afortunado ganador</p>
                                <div className="bg-white text-yellow-600 font-black text-3xl py-4 px-10 rounded-full inline-block shadow-lg border-2 border-yellow-100">TICKET #{elTicketGanador?.numero}</div>
                                <p className="text-[10px] text-yellow-100 mt-6 font-bold uppercase">Nos pondremos en contacto contigo pronto.</p>
                            </div>
                        )}
                        {isFinished && !iWonThisRifa && elTicketGanador && (
                            <div className="bg-slate-100 p-8 rounded-[3rem] text-slate-500 text-center mb-8 border border-slate-200">
                                <Trophy size={40} className="mx-auto mb-4 opacity-40"/><h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-600 mb-2">Sorteo Finalizado</h3>
                                <p className="text-xs font-bold">El ticket ganador fue el <span className="text-slate-800 font-black px-3 py-1 bg-white rounded-xl border border-slate-300 ml-1 text-sm">#{elTicketGanador.numero}</span></p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mt-4 tracking-widest">¡Suerte para la próxima!</p>
                            </div>
                        )}
                        {!isFinished && (
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 mb-8 shadow-sm relative overflow-hidden">
                              <div className="absolute top-6 right-8 bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-2xl shadow-lg shadow-blue-100">${selectedRifa.precio} USD</div>
                              <h2 className="text-3xl font-black uppercase italic leading-none text-slate-900 pr-20">{selectedRifa.nombre}</h2>
                              <div className="flex items-center gap-2 mt-4 text-slate-400 font-bold text-xs"><Calendar size={14} className="text-blue-500"/> Finaliza el: {selectedRifa.fecha_fin}</div>
                              <div className="mt-6 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-50"><p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-tight">{selectedRifa.descripcion}</p></div>
                            </div>
                        )}
                        <div className={`grid grid-cols-5 sm:grid-cols-8 gap-3 bg-white p-6 rounded-[3rem] shadow-inner ${isFinished ? 'opacity-70 pointer-events-none border border-slate-200' : 'border border-slate-100'}`}>
                          {nums.map(n => {
                            const isMine = n.comprador_id === userId;
                            const isSelected = cart.includes(n.id_numero);
                            let bgColor = 'bg-green-500 border-green-600';
                            if (n.estado === 'pagado') bgColor = 'bg-slate-200 border-slate-300 text-slate-400';
                            if (n.estado === 'apartado') bgColor = 'bg-red-600 border-red-700 text-white';
                            if (isMine) bgColor = 'bg-blue-600 border-blue-700 text-white shadow-xl shadow-blue-100 z-10';
                            if (isSelected) bgColor = 'bg-slate-900 border-black text-white scale-110 z-10';
                            if (isFinished && n.id_numero === selectedRifa.id_ganador) bgColor = 'bg-yellow-400 border-yellow-500 text-white shadow-lg shadow-yellow-200 scale-110 z-20 animate-pulse';
                            if (hideSold && n.estado !== 'disponible' && !isMine && !isFinished) return null;
                            return (
                              <button key={n.id_numero} disabled={(n.estado !== 'disponible' && !isMine) || isFinished} onClick={() => { if(n.estado === 'disponible' && !isFinished) setCart(prev => prev.includes(n.id_numero) ? prev.filter(id => id !== n.id_numero) : [...prev, n.id_numero]); }} className={`aspect-square rounded-[1.2rem] text-[10px] font-black border-2 transition-all relative flex items-center justify-center ${bgColor} ${!isFinished && isMine ? 'scale-105' : ''}`}>
                                {n.numero}{isMine && !isFinished && (<div className="absolute -top-2 -right-2 bg-white text-blue-600 rounded-full border-2 border-blue-600 p-0.5 shadow-md"><CheckCircle2 size={10} strokeWidth={4}/></div>)}
                              </button>
                            );
                          })}
                        </div>
                    </>
                )
            })()}
            {cart.length > 0 && selectedRifa.estado === 'activa' && (
              <div className="fixed bottom-8 left-4 right-4 bg-slate-900 text-white p-7 rounded-[3rem] flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-40 border border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-800 p-3 rounded-2xl text-blue-500 shadow-inner"><Ticket/></div>
                    <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{cart.length} Seleccionados</p><p className="text-3xl font-black italic tracking-tighter">${(cart.length * selectedRifa.precio).toFixed(2)}</p></div>
                </div>
                <button onClick={() => setShowPay(true)} className="bg-blue-600 px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-blue-500 transition-all active:scale-90 shadow-xl shadow-blue-900/20">Pagar Ahora</button>
              </div>
            )}
          </div>
        )}
      </main>

      {showPay && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
           <div className="bg-white p-8 rounded-[3.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600"></div>
            <h3 className="text-3xl font-black mb-2 uppercase italic text-slate-900 tracking-tighter">Completar Pago</h3>
            {!paymentMethod ? (
                <div className="space-y-3">
                    <button onClick={() => setPaymentMethod('pago_movil')} className="w-full p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                        <div className="bg-white p-3 rounded-2xl text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all"><Smartphone/></div>
                        <div className="text-left"><p className="font-black uppercase text-xs">Pago Móvil</p><p className="text-[9px] text-slate-400 font-bold uppercase">Transf. Inmediata</p></div>
                    </button>
                    <button onClick={() => setPaymentMethod('transferencia')} className="w-full p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                        <div className="bg-white p-3 rounded-2xl text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2/></div>
                        <div className="text-left"><p className="font-black uppercase text-xs">Zelle / Transferencia</p><p className="text-[9px] text-slate-400 font-bold uppercase">Bancos nacionales / USA</p></div>
                    </button>
                    <button onClick={() => setShowPay(false)} className="w-full mt-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-blue-600 p-6 rounded-[2.5rem] mb-6 text-white text-center shadow-xl shadow-blue-100"><p className="text-[10px] font-black uppercase opacity-70 mb-2">Datos para transferir</p><p className="text-sm font-black leading-relaxed">BANCO CENTRAL<br/>V-12.345.678<br/>0412-0000000</p></div>
                    <div className="space-y-2 mb-6">
                        <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Ref. de pago (4 últimos dígitos)</label>
                        <input type="text" maxLength="4" placeholder="Ej: 9821" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-center outline-none focus:border-blue-500 text-2xl tracking-[0.5em] shadow-inner" onChange={e => setPayData({ref: e.target.value})} />
                    </div>
                    <button onClick={reportarPago} className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black uppercase text-xs shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95">Confirmar Mi Reporte</button>
                    <button onClick={() => {setPaymentMethod(null);}} className="w-full mt-4 text-slate-400 font-black text-[10px] uppercase py-2">Volver Atrás</button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- APP PRINCIPAL ---
// --- APP PRINCIPAL ---
export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkRole = async (userId) => {
    try {
      const { data } = await supabase.from('usuarios').select('rol').eq('id_usuario', userId).single();
      setRole(data?.rol || 'cliente');
    } catch { 
      setRole('cliente'); 
    } finally { 
      setLoading(false); // Quitamos el loading SOLO cuando ya sabemos el rol
    }
  };

  useEffect(() => {
    // Revisión inicial al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); 
      if (session) checkRole(session.user.id); 
      else setLoading(false);
    });

    // Escuchador automático de Supabase (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); 
      if (s) {
        setLoading(true); // Ponemos a cargar mientras buscamos el rol del nuevo usuario
        checkRole(s.user.id); 
      } else { 
        setRole(null); 
        setLoading(false); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center border border-slate-100">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48}/>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] animate-pulse">Cargando AlexCars' Edition...</p>
        </div>
    </div>
  );

  // ¡Fíjate que quitamos el onLogin={setSession}!
  if (!session) return <Auth />; 
  
  return role === 'admin' ? <AdminPanel /> : <ClienteView userId={session.user.id} />;
}
