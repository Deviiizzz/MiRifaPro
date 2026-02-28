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
import logo from './logo.png';

// --- COLORES ESPECÍFICOS PARA EL ADMIN ---
const ESTADOS = {
  disponible: { bg: 'bg-slate-200', border: 'border-slate-300', text: 'text-slate-400', label: 'Libre' },
  apartado: { bg: 'bg-red-600 animate-pulse', border: 'border-red-700', text: 'text-white', label: 'Revision' },
  pagado: { bg: 'bg-black', border: 'border-zinc-800', text: 'text-white', label: 'Vendido' }
};

// --- COMPONENTE DE ACCESO ---
const Auth = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', telefono: '', password: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Creamos un email ficticio usando el teléfono para el sistema de Auth
    const finalEmail = `${formData.telefono}@alexcars.com`;

    if (isRegistering) {
      // REGISTRO
      const { data, error } = await supabase.auth.signUp({
        email: finalEmail,
        password: formData.password,
        options: {
          // ESTA PARTE ES LA MÁS IMPORTANTE PARA EL TRIGGER
          data: {
            nombre: formData.nombre,
            apellido: formData.apellido,
            telefono: formData.telefono
          }
        }
      });

      if (error) {
        alert("Error al registrar: " + error.message);
      } else {
        alert("¡Registro exitoso! Ya puedes iniciar sesión.");
        setIsRegistering(false);
      }
    } else {
      // INICIO DE SESIÓN
      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: formData.password
      });

      if (error) {
        alert("Datos incorrectos. Verifica tu teléfono y contraseña.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-4 font-sans">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-700 via-red-500 to-black"></div>
        <div className="flex justify-center mb-4 mt-2">
    <img 
      src={logo} 
      alt="Logo" 
      className="w-40 h-auto object-contain" 
    />
</div>
        <h2 className="text-4xl font-black text-center mb-1 italic tracking-tighter text-black uppercase">AlexCars' Edition</h2>
        <p className="text-center text-red-600 text-[10px] mb-8 font-black uppercase tracking-[0.2em]">Sistema Profesional de Sorteos</p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Nombre</label>
                <input type="text" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-red-600 transition-all text-sm font-bold" onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Apellido</label>
                <input type="text" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-red-600 transition-all text-sm font-bold" onChange={e => setFormData({...formData, apellido: e.target.value})} />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Teléfono</label>
            <div className="relative">
                <Smartphone className="absolute left-4 top-4 text-slate-300" size={18}/>
                <input type="tel" required className="w-full p-4 pl-12 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-red-600 transition-all text-sm font-bold" onChange={e => setFormData({...formData, telefono: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Contraseña</label>
            <input type="password" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-red-600 transition-all text-sm font-bold" onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          
          <button className="w-full bg-red-600 text-white p-5 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2 border border-red-800">
            {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>
        
        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center mt-8 text-[11px] font-black text-slate-400 uppercase tracking-tighter hover:text-red-600 transition-all">
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
    .select(`estado, rifas!numeros_id_rifa_fkey (precio)`);

  if (error) { console.error("❌ Error detallado:", error); return; }

  let total = 0; let pagados = 0; let revision = 0;
  
  nums?.forEach(n => {
    const precioTicket = n.rifas?.precio || 0;
    if (n.estado === 'pagado') { total += precioTicket; pagados++; }
    if (n.estado === 'apartado') { revision++; }
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
    } else { alert("Error al realizar el sorteo: " + error.message); }
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
      <nav className="bg-white border-b border-red-100 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-xl text-white shadow-md border border-red-800"><Building2 size={18}/></div>
            <h1 className="font-black italic text-xl text-slate-900 tracking-tighter uppercase">AlexCars' Edition <span className="text-red-600">ADMIN</span></h1>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); }} className="text-red-600 p-2 bg-red-50 rounded-xl transition-all hover:bg-red-100 flex items-center gap-2 text-xs font-black">
          <LogOut size={18}/> SALIR
        </button>
      </nav>

      <main className="p-4 max-w-[1400px] mx-auto">
        {view === 'list' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-2xl text-green-600"><CreditCard/></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recaudado</p><p className="text-2xl font-black text-slate-900">${stats.recaudado}</p></div>
              </div>
              <div className="bg-black p-6 rounded-[2rem] shadow-md flex items-center gap-4 border border-zinc-800">
                <div className="bg-zinc-800 p-3 rounded-2xl text-white"><Ticket/></div>
                <div><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vendidos</p><p className="text-2xl font-black text-white">{stats.vendidos}</p></div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-red-200 shadow-sm flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-2xl text-red-600 animate-pulse"><AlertCircle/></div>
                <div><p className="text-[10px] font-black text-red-400 uppercase tracking-widest">En Revisión</p><p className="text-2xl font-black text-red-600">{stats.pendientes}</p></div>
              </div>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-400">Tus Sorteos</h2>
                <button onClick={() => setView('create')} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 text-xs uppercase">
                    <Plus size={18}/> Crear Rifa
                </button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {rifas.map(r => (
                <div key={r.id_rifa} className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-200 flex items-center gap-4 group transition-all hover:shadow-xl hover:border-red-200 relative overflow-hidden">
                  {r.estado === 'finalizada' && <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[9px] font-black px-4 py-1 rounded-bl-xl z-10">FINALIZADA</div>}
                  {r.imagen_url ? (
                    <img src={r.imagen_url} className={`w-20 h-20 rounded-[1.8rem] object-cover bg-slate-100 shadow-md shadow-slate-200 ${r.estado === 'finalizada' ? 'grayscale opacity-80' : ''}`} />
                  ) : (
                    <div className="w-20 h-20 rounded-[1.8rem] bg-slate-50 flex items-center justify-center text-slate-300"><ImageIcon size={32}/></div>
                  )}
                  <div onClick={() => openRifaDetail(r)} className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-black uppercase text-sm leading-tight text-slate-900">{r.nombre}</h3>
                        {pendientesNotif[r.id_rifa] > 0 && (
                            <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-bounce shadow-md">
                                {pendientesNotif[r.id_rifa]} PENDIENTES
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Finaliza: {r.fecha_fin}</p>
                    <p className="text-red-600 font-black text-xs mt-1">${r.precio} USD</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setSelectedRifa(r); setView('edit'); }} className="text-slate-600 bg-slate-100 p-3 rounded-2xl hover:bg-slate-200 transition-all"><Edit3 size={18}/></button>
                    <button onClick={async () => { if(window.confirm("¿Seguro de borrar esta rifa? Todos los números se perderán.")) { await supabase.from('rifas').delete().eq('id_rifa', r.id_rifa); fetchRifas(); calculateStats(); } }} className="text-red-400 hover:text-red-600 bg-red-50 p-3 rounded-2xl transition-all"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'detail' && selectedRifa && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <button onClick={() => setView('list')} className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-black"><ChevronLeft size={18}/> Volver</button>
                <div className="flex flex-wrap gap-2">
                    <button onClick={exportToPDF} className="bg-slate-900 text-white p-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-black"><FileText size={16}/> PDF</button>
                    <button onClick={exportToExcel} className="bg-green-600 text-white p-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-green-700"><Download size={16}/> EXCEL</button>
                    {selectedRifa.estado === 'activa' && (
                        <>
                            <button onClick={() => setShowManualAssign(true)} className="bg-black text-white p-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-zinc-300 hover:bg-zinc-800"><Plus size={16}/> Venta Manual</button>
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

                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex gap-6 items-center">
                    {selectedRifa.imagen_url && <img src={selectedRifa.imagen_url} className="w-24 h-24 rounded-3xl object-cover shadow-lg" />}
                    <div>
                        <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">{selectedRifa.nombre}</h2>
                        <p className="text-xs text-red-600 font-bold mt-2 uppercase tracking-widest">{selectedRifa.estado === 'activa' ? 'Control de tickets en tiempo real' : 'Sorteo Finalizado'}</p>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {numsRifa.map(n => {
                      let btnClass = `aspect-square rounded-xl text-[10px] font-black border-2 transition-all shadow-sm ${ESTADOS[n.estado].bg} ${ESTADOS[n.estado].border} ${ESTADOS[n.estado].text}`;
                      if (n.estado !== 'disponible') btnClass += ' scale-95';
                      else btnClass += ' hover:scale-105 hover:bg-slate-300';
                      
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
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm sticky top-24 max-h-[80vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-[0.2em] flex items-center gap-2"><User size={14}/> Lista de Participantes</h3>
                  <div className="space-y-4">
                    {Object.values(clientesAgrupados).map((item) => {
                      const tieneGanador = item.numeros.some(n => n.id_numero === selectedRifa.id_ganador);
                      return (
                      <div key={item.info?.id_usuario} className={`p-5 rounded-3xl border-2 transition-all ${tieneGanador ? 'border-yellow-300 bg-yellow-50' : item.tienePendientes ? 'border-red-200 bg-red-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-black text-xs uppercase leading-tight text-slate-900 flex items-center gap-2">
                                {item.info?.nombre} {item.info?.apellido}
                                {tieneGanador && <Star size={12} className="text-yellow-500 fill-yellow-500"/>}
                            </p>
                            <p className="text-[10px] text-slate-500 font-black flex items-center gap-1 mt-1"><Phone size={10} className="text-slate-400"/> {item.info?.telefono}</p>
                          </div>
                          {item.tienePendientes && selectedRifa.estado === 'activa' && (
                            <button onClick={() => aprobarTodoElCliente(item.info?.id_usuario)} className="bg-red-600 text-white text-[9px] font-black px-3 py-1.5 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 uppercase">Aprobar</button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.numeros.map(n => {
                            const esEsteGanador = n.id_numero === selectedRifa.id_ganador;
                            return (
                                <span key={n.id_numero} className={`text-[9px] font-black px-2 py-1 rounded-lg border ${esEsteGanador ? 'bg-yellow-400 text-white border-yellow-500 shadow-sm' : n.estado === 'apartado' ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-black text-white border-zinc-800'}`}>
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
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-200 max-w-2xl mx-auto">
            <button onClick={() => setView('list')} className="mb-6 flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><ChevronLeft size={18}/> Cancelar</button>
            <h2 className="text-3xl font-black mb-8 uppercase italic text-black tracking-tighter">{view === 'create' ? 'Nueva Rifa' : 'Editar Sorteo'}</h2>
            <form onSubmit={view === 'create' ? crearRifa : handleEditRifa} className="space-y-6">
              <div className="flex justify-center">
                <label className="group w-full flex flex-col items-center px-4 py-8 bg-slate-50 text-red-600 rounded-[2rem] border-4 border-dashed border-slate-200 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-all">
                  <div className="bg-white p-4 rounded-full shadow-md text-red-600 mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon size={40} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">{imageFile ? imageFile.name : 'Cargar Foto del Premio'}</span>
                  <input type='file' accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
                </label>
              </div>
              <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Nombre del Premio</label>
                    <input type="text" placeholder="Ej: Pintura General Sedan" className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-200 outline-none focus:border-red-500 font-bold text-slate-900" required 
                        value={view === 'edit' ? selectedRifa.nombre : newRifa.nombre}
                        onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, nombre: e.target.value}) : setNewRifa({...newRifa, nombre: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Descripción Detallada</label>
                    <textarea placeholder="Cuéntale a tus clientes sobre el sorteo..." className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-200 outline-none focus:border-red-500 font-bold h-32 text-slate-900" 
                        value={view === 'edit' ? selectedRifa.descripcion : newRifa.descripcion}
                        onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, descripcion: e.target.value}) : setNewRifa({...newRifa, descripcion: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Cant. Números</label>
                        <input type="number" disabled={view === 'edit'} className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-200 font-black text-lg text-black" value={view === 'edit' ? selectedRifa.cantidad_numeros : newRifa.cantidad} onChange={e => setNewRifa({...newRifa, cantidad: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Precio x Ticket ($)</label>
                        <input type="number" step="0.01" disabled={view === 'edit'} className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-200 font-black text-lg text-red-600" value={view === 'edit' ? selectedRifa.precio : newRifa.precio} onChange={e => setNewRifa({...newRifa, precio: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-1 bg-zinc-900 p-4 rounded-3xl border border-zinc-800">
                    <label className="text-[10px] font-black text-red-500 ml-2 uppercase flex items-center gap-2"><Calendar size={14}/> Fecha de Finalización</label>
                    <input type="date" className="w-full p-4 bg-zinc-800 text-white rounded-2xl border-none outline-none font-black uppercase" value={view === 'edit' ? selectedRifa.fecha_fin : newRifa.fecha} onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, fecha_fin: e.target.value}) : setNewRifa({...newRifa, fecha: e.target.value})} />
                  </div>
              </div>
              <button disabled={loadingAction} className="w-full bg-red-600 text-white p-6 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 border border-red-800">
                {loadingAction ? <Loader2 className="animate-spin" /> : 'Confirmar Sorteo'}
              </button>
            </form>
          </div>
        )}
      </main>

      {showManualAssign && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
           <div className="bg-white p-8 rounded-[3rem] w-full max-w-md shadow-2xl border-2 border-red-600">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase italic text-black tracking-tighter">Venta Directa</h3>
                <button onClick={() => setShowManualAssign(false)} className="text-slate-300 hover:text-red-600"><X/></button>
            </div>
            <form onSubmit={handleManualAssignment} className="space-y-4">
              <input type="text" required placeholder="Tickets (Separar por comas)" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:border-red-500" onChange={e => setManualData({...manualData, numeros: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Nombre" required className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:border-red-500" onChange={e => setManualData({...manualData, nombre: e.target.value})} />
                <input type="text" placeholder="Apellido" required className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:border-red-500" onChange={e => setManualData({...manualData, apellido: e.target.value})} />
              </div>
              <input type="tel" placeholder="Teléfono" required className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:border-red-500" onChange={e => setManualData({...manualData, telefono: e.target.value})} />
              <select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-black uppercase text-xs outline-none focus:border-red-500" onChange={e => setManualData({...manualData, estado: e.target.value})}>
                <option value="apartado">🔴 PONER EN REVISIÓN</option>
                <option value="pagado">⚫ MARCAR COMO VENDIDO</option>
              </select>
              <button className="w-full bg-black text-white p-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-300 mt-4 hover:bg-zinc-800">Confirmar Asignación</button>
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
                <h3 className="text-3xl font-black italic uppercase text-black tracking-tighter">Ticket #{numDetail.numero}</h3>
                <button onClick={() => setNumDetail(null)} className="text-slate-300 hover:text-slate-900"><X/></button>
            </div>
            <div className="space-y-4 mb-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl text-black shadow-sm"><User size={18}/></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase">Cliente</p><p className="text-sm font-black text-slate-800">{numDetail.usuarios?.nombre} {numDetail.usuarios?.apellido}</p></div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl text-red-600 shadow-sm"><Phone size={18}/></div>
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
                        <button onClick={() => handleActionNumber(numDetail.id_numero, 'pagado')} className="bg-black text-white p-5 rounded-3xl font-black text-xs uppercase shadow-xl flex items-center justify-center gap-2 hover:bg-zinc-800">
                            <CheckCircle2 size={18}/> Confirmar Pago
                        </button>
                    )}
                    <button onClick={() => handleActionNumber(numDetail.id_numero, 'disponible')} className="bg-red-50 text-red-600 p-5 rounded-3xl font-black text-xs uppercase hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100">
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
const ClientePanel = ({ userId, onLogout }) => {
  const [rifas, setRifas] = useState([]);
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [nums, setNums] = useState([]);
  const [cart, setCart] = useState([]);
  const [showPay, setShowPay] = useState(false);
  const [refPago, setRefPago] = useState('');
  const [loading, setLoading] = useState(false);
  const [hideSold, setHideSold] = useState(false);

  useEffect(() => {
    fetchRifas();
  }, []);

  useEffect(() => {
    if (selectedRifa) {
      const sub = supabase
        .channel(`public:numeros:${selectedRifa.id_rifa}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'numeros' }, () => fetchNumeros(selectedRifa.id_rifa))
        .subscribe();
      fetchNumeros(selectedRifa.id_rifa);
      return () => { supabase.removeChannel(sub); };
    }
  }, [selectedRifa]);

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*').order('created_at', { ascending: false });
    setRifas(data || []);
  };

  const fetchNumeros = async (id) => {
    const { data } = await supabase.from('numeros').select('*').eq('rifa_id', id).order('numero', { ascending: true });
    setNums(data || []);
  };

  // --- NUEVA FUNCIÓN: SELECCIÓN AUTOMÁTICA ---
  const handleQuickSelect = () => {
    const cantidadStr = prompt("¿Cuántos números deseas comprar al azar?");
    const cantidad = parseInt(cantidadStr);

    if (isNaN(cantidad) || cantidad <= 0) return;

    const disponibles = nums.filter(n => n.estado === 'disponible');

    if (cantidad > disponibles.length) {
      alert(`Lo sentimos, solo quedan ${disponibles.length} números disponibles.`);
      return;
    }

    const seleccionados = [...disponibles]
      .sort(() => 0.5 - Math.random())
      .slice(0, cantidad)
      .map(n => n.id_numero);

    setCart(seleccionados);
    setShowPay(true); // Redirige directamente al pago
  };

  // --- NUEVA FUNCIÓN: DESCARGAR COMPROBANTE PDF ---
  const descargarComprobanteTickets = () => {
    const doc = new jsPDF();
    const misTickets = nums.filter(n => n.comprador_id === userId);
    
    doc.setFontSize(22);
    doc.setTextColor(220, 38, 38);
    doc.text("ALEXCARS - COMPROBANTE", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Rifa: ${selectedRifa.nombre}`, 14, 30);
    doc.text(`Fecha de descarga: ${new Date().toLocaleString()}`, 14, 37);

    const tableData = misTickets.map(n => [
      `#${n.numero}`,
      n.estado === 'pagado' ? 'CONFIRMADO' : 'PENDIENTE DE APROBACIÓN',
      n.referencia_pago || 'Sin referencia'
    ]);

    autoTable(doc, {
      head: [['Ticket', 'Estado de Pago', 'Referencia']],
      body: tableData,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] }
    });

    doc.save(`Mis_Tickets_AlexCars.pdf`);
  };

  const handleBuy = async () => {
    if (!refPago) return alert("Pon la referencia del comprobante");
    setLoading(true);
    const { error } = await supabase.from('numeros').update({
      estado: 'apartado',
      comprador_id: userId,
      referencia_pago: refPago
    }).in('id_numero', cart);

    if (!error) {
      alert("¡Listo! Espera a que el administrador apruebe tu pago.");
      setCart([]);
      setRefPago('');
      setShowPay(false);
    }
    setLoading(false);
  };

  if (!selectedRifa) {
    return (
      <div className="min-h-screen bg-zinc-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">Alex<span className="text-red-600">Cars'</span></h1>
            <button onClick={onLogout} className="bg-white p-3 rounded-2xl shadow-sm text-red-600"><LogOut size={20}/></button>
          </div>
          <div className="grid gap-6">
            {rifas.map(r => (
              <div key={r.id_rifa} onClick={() => setSelectedRifa(r)} className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-red-600 transition-all cursor-pointer group">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black uppercase mb-1">{r.nombre}</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{r.descripcion}</p>
                  </div>
                  <ChevronLeft className="rotate-180 text-slate-300 group-hover:text-red-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isFinished = selectedRifa.estado === 'finalizado';
  const elTicketGanador = nums.find(n => n.numero === selectedRifa.numero_ganador);

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => { setSelectedRifa(null); setCart([]); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft/></button>
          <h1 className="text-lg font-black uppercase tracking-tight">{selectedRifa.nombre}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {isFinished && elTicketGanador && (
          <div className="bg-black text-white p-8 rounded-[3rem] mb-8 text-center border-4 border-yellow-500 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <PartyPopper size={200} className="absolute -bottom-10 -right-10 rotate-12" />
             </div>
             <Trophy className="mx-auto mb-4 text-yellow-500" size={48}/>
             <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-2 text-yellow-500">¡Sorteo Finalizado!</h2>
             <div className="text-6xl font-black mb-4">#{elTicketGanador.numero}</div>
             <p className="text-[10px] uppercase font-bold text-zinc-400">Ganador: {elTicketGanador.nombre_comprador || 'Sorteo Cerrado'}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8">
            <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6">{selectedRifa.descripcion}</p>
            
            {/* BOTONES DE ACCIÓN PERFIL CLIENTE */}
            {!isFinished && (
              <div className="flex flex-wrap gap-3 mb-2">
                <button 
                  onClick={handleQuickSelect}
                  className="flex-1 bg-zinc-900 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border-2 border-zinc-800 hover:bg-black transition-all"
                >
                  <Star size={16} className="text-yellow-400 fill-yellow-400"/> Selección Automática
                </button>
                
                {nums.some(n => n.comprador_id === userId) && (
                  <button 
                    onClick={descargarComprobanteTickets}
                    className="flex-1 bg-white text-black p-4 rounded-2xl font-black uppercase text-[10px] border-2 border-slate-200 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download size={16}/> Descargar Mis Tickets (PDF)
                  </button>
                )}
              </div>
            )}
        </div>

        <div className="flex justify-between items-end mb-6">
            <h3 className="font-black uppercase text-[11px] tracking-widest text-slate-400 flex items-center gap-2">
                <Ticket size={14}/> Selecciona tus números
            </h3>
            <button onClick={() => setHideSold(!hideSold)} className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                {hideSold ? 'Mostrar todos' : 'Ocultar vendidos'}
            </button>
        </div>

        {/* CUADRÍCULA DE NÚMEROS MODIFICADA */}
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
          {nums.map(n => {
            const isMine = n.comprador_id === userId;
            const isSelected = cart.includes(n.id_numero);
            const isPending = isMine && n.estado === 'apartado';
            const isApproved = isMine && n.estado === 'pagado';

            let bgColor = 'bg-red-600 border-red-700 text-white hover:bg-red-500 shadow-sm';
            
            if ((n.estado === 'pagado' || n.estado === 'apartado') && !isMine) {
              bgColor = 'bg-slate-200 border-slate-300 text-slate-400 opacity-60';
            }
            
            if (isMine) {
              // Si está pendiente de aprobación por admin, parpadea
              bgColor = `bg-black border-zinc-800 text-white shadow-xl ${isPending ? 'animate-pulse' : ''}`;
            }
            
            if (isSelected) {
              bgColor = 'bg-zinc-800 border-black text-white scale-110 z-10';
            }

            if (hideSold && n.estado !== 'disponible' && !isMine) return null;

            return (
              <button 
                key={n.id_numero} 
                disabled={(n.estado !== 'disponible' && !isMine) || isFinished}
                onClick={() => {
                  if(n.estado === 'disponible') {
                    setCart(prev => prev.includes(n.id_numero) ? prev.filter(id => id !== n.id_numero) : [...prev, n.id_numero]);
                  }
                }}
                className={`aspect-square rounded-2xl text-[11px] font-black border-2 transition-all relative flex items-center justify-center ${bgColor}`}
              >
                {n.numero}
                {/* CHECK SÓLO CUANDO EL ADMIN APRUEBA */}
                {isApproved && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full border-2 border-white p-0.5 shadow-md">
                    <CheckCircle2 size={10} strokeWidth={4}/>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* BARRA DE PAGO FLOTANTE */}
      {cart.length > 0 && !showPay && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-black text-white p-5 rounded-[2.5rem] shadow-2xl flex items-center justify-between z-50 animate-bounce-subtle">
           <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Seleccionados</p>
              <p className="text-xl font-black">{cart.length} Números</p>
           </div>
           <button onClick={() => setShowPay(true)} className="bg-red-600 px-8 py-3 rounded-2xl font-black uppercase text-xs hover:bg-red-500 transition-colors">Comprar Ahora</button>
        </div>
      )}

      {/* MODAL DE PAGO */}
      {showPay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden animate-slide-up">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase">Confirmar Pago</h3>
                <button onClick={() => setShowPay(false)} className="bg-slate-100 p-2 rounded-full"><X/></button>
              </div>
              
              <div className="bg-zinc-50 p-6 rounded-3xl mb-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 text-red-600 p-2 rounded-xl"><CreditCard size={20}/></div>
                  <span className="font-bold text-sm uppercase tracking-widest text-slate-500">Datos de transferencia</span>
                </div>
                <p className="font-black text-lg mb-1">{selectedRifa.metodo_pago}</p>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Referencia del comprobante</label>
                <input 
                  type="text" 
                  value={refPago} 
                  onChange={(e) => setRefPago(e.target.value)}
                  placeholder="Ej: 123456789"
                  className="w-full bg-slate-100 border-2 border-transparent focus:border-red-600 p-5 rounded-3xl outline-none font-bold transition-all"
                />
              </div>

              <button 
                onClick={handleBuy}
                disabled={loading || !refPago}
                className="w-full bg-black text-white p-6 rounded-[2rem] font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin"/> : 'Enviar Reporte de Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- APP PRINCIPAL ---
const App = () => {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkRole = async (userId) => {
    try {
      // Intentamos obtener el rol, controlando errores de Supabase explícitamente
      const { data, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id_usuario', userId)
        .single();
      
      if (error) {
        console.error("Error al obtener rol:", error.message);
        setRole('cliente');
      } else {
        setRole(data?.rol || 'cliente');
      }
    } catch (err) { 
      console.error("Excepción en checkRole:", err);
      setRole('cliente'); 
    } finally { 
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session); 
        if (session) {
          checkRole(session.user.id); 
        } else {
          setLoading(false);
        }
      }
    });

    // Escuchar cambios (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (isMounted) {
        setSession(s); 
        if (s) {
          setLoading(true);
          checkRole(s.user.id); 
        } else { 
          setRole(null); 
          setLoading(false); 
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900">
        <div className="bg-black p-10 rounded-[3rem] shadow-2xl flex flex-col items-center border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
            <Loader2 className="animate-spin text-red-600 mb-4" size={48}/>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em] animate-pulse">Cargando AlexCars' Edition...</p>
        </div>
    </div>
  );

  if (!session) return <Auth />; 
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {role === 'admin' ? <AdminPanel /> : <ClientePanel session={session} />}
    </div>
  );
};

export default App;
