import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LogOut, Plus, Ticket, X, CheckCircle2, Loader2, CreditCard, 
  User, Phone, ChevronLeft, Trash2, Download, Eye, EyeOff, FileText, Image as ImageIcon, Edit3, Printer, Trophy, PartyPopper, Calendar, Info, Building2, Smartphone, AlertCircle
} from 'lucide-react';

// Librerías para documentos
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './index.css'; 

// --- NUEVA CONFIGURACIÓN DE COLORES SOLICITADA ---
const ESTADOS = {
  disponible: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white', label: 'Libre' },
  apartado: { bg: 'bg-red-600', border: 'border-red-700', text: 'text-white', label: 'Revision' }, // ROJO PARA REVISIÓN
  pagado: { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white', label: 'Vendido' }   // AZUL PARA VENDIDO (ADMIN)
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-3xl rotate-12 shadow-lg shadow-blue-200">
                <Trophy size={40} className="text-white"/>
            </div>
        </div>
        <h2 className="text-4xl font-black text-center mb-1 italic tracking-tighter text-blue-600">RIFAPRO</h2>
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

  // Notificaciones de pendientes
  const [pendientesNotif, setPendientesNotif] = useState({});

  useEffect(() => { 
    fetchRifas(); 
    calculateStats();
  }, []);

  const calculateStats = async () => {
    // Obtenemos todos los números con el precio de su rifa asociada
    const { data: nums } = await supabase.from('numeros').select('estado, rifas(precio)');
    let total = 0; let pagados = 0; let revision = 0;
    
    nums?.forEach(n => {
      if (n.estado === 'pagado') { 
        total += n.rifas?.precio || 0; 
        pagados++; 
      }
      if (n.estado === 'apartado') revision++;
    });
    setStats({ recaudado: total.toFixed(2), vendidos: pagados, pendientes: revision });
  };

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*').order('creado_en', { ascending: false });
    const rifasData = data || [];
    setRifas(rifasData);

    // Revisar pendientes por cada rifa para las notificaciones
    const notifs = {};
    for (const rifa of rifasData) {
        const { count } = await supabase.from('numeros').select('*', { count: 'exact', head: true }).eq('id_rifa', rifa.id_rifa).eq('estado', 'apartado');
        notifs[rifa.id_rifa] = count || 0;
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

  // --- REPORTES ---
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Participantes - ${selectedRifa.nombre}`, 14, 15);
    
    const tableData = numsRifa
      .filter(n => n.comprador_id)
      .map(n => [
        `${n.usuarios?.nombre} ${n.usuarios?.apellido}`,
        n.usuarios?.telefono || 'N/A', // TELÉFONO AGREGADO
        n.numero,
        n.estado.toUpperCase() // ESTADO AGREGADO
      ]);

    autoTable(doc, {
      head: [['Nombre', 'Teléfono', 'Ticket #', 'Estado']],
      body: tableData,
      startY: 20
    });
    doc.save(`Rifa_${selectedRifa.nombre}.pdf`);
  };

  const exportToExcel = () => {
    const data = numsRifa
      .filter(n => n.comprador_id)
      .map(n => ({
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
      if (!acc[id]) {
        acc[id] = { info: n.usuarios, numeros: [], tienePendientes: false };
      }
      acc[id].numeros.push(n);
      if (n.estado === 'apartado') acc[id].tienePendientes = true;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
      <nav className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white"><Building2 size={18}/></div>
            <h1 className="font-black italic text-xl text-blue-600 tracking-tighter">RIFAPRO ADMIN</h1>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); }} className="text-red-500 p-2 bg-red-50 rounded-xl transition-all hover:bg-red-100 flex items-center gap-2 text-xs font-black">
          <LogOut size={18}/> SALIR
        </button>
      </nav>

      <main className="p-4 max-w-[1400px] mx-auto">
        {view === 'list' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* ESTADÍSTICAS REPARADAS */}
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
                <div key={r.id_rifa} className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4 group transition-all hover:shadow-xl">
                  {r.imagen_url ? (
                    <img src={r.imagen_url} className="w-20 h-20 rounded-[1.8rem] object-cover bg-slate-100 shadow-md shadow-slate-100" />
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
                <div className="flex gap-2">
                    <button onClick={exportToPDF} className="bg-slate-900 text-white p-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2"><FileText size={16}/> PDF</button>
                    <button onClick={exportToExcel} className="bg-green-600 text-white p-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2"><Download size={16}/> EXCEL</button>
                    <button onClick={() => setShowManualAssign(true)} className="bg-blue-600 text-white p-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-blue-100"><Plus size={16}/> Venta Manual</button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-2/3 space-y-4">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex gap-6 items-center">
                    {selectedRifa.imagen_url && <img src={selectedRifa.imagen_url} className="w-24 h-24 rounded-3xl object-cover shadow-lg" />}
                    <div>
                        <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">{selectedRifa.nombre}</h2>
                        <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest">Control de tickets en tiempo real</p>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {numsRifa.map(n => (
                      <button key={n.id_numero} onClick={() => n.estado !== 'disponible' && setNumDetail(n)}
                        className={`aspect-square rounded-xl text-[10px] font-black border-2 transition-all shadow-sm ${ESTADOS[n.estado].bg} ${ESTADOS[n.estado].border} ${ESTADOS[n.estado].text} ${n.estado !== 'disponible' ? 'scale-95' : 'hover:scale-105'}`}>
                        {n.numero}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-24 max-h-[80vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-[0.2em] flex items-center gap-2"><User size={14}/> Lista de Participantes</h3>
                  <div className="space-y-4">
                    {Object.values(clientesAgrupados).map((item) => (
                      <div key={item.info?.id_usuario} className={`p-5 rounded-3xl border-2 transition-all ${item.tienePendientes ? 'border-red-200 bg-red-50/50' : 'border-slate-50 bg-slate-50/30'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-black text-xs uppercase leading-tight text-slate-800">{item.info?.nombre} {item.info?.apellido}</p>
                            <p className="text-[10px] text-slate-500 font-black flex items-center gap-1 mt-1"><Phone size={10} className="text-blue-500"/> {item.info?.telefono}</p>
                          </div>
                          {item.tienePendientes && (
                            <button onClick={() => aprobarTodoElCliente(item.info?.id_usuario)} className="bg-red-600 text-white text-[9px] font-black px-3 py-1.5 rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 uppercase">Aprobar Pagos</button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.numeros.map(n => (
                            <span key={n.id_numero} className={`text-[9px] font-black px-2 py-1 rounded-lg border ${n.estado === 'apartado' ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-white text-slate-400 border-slate-100'}`}>
                                #{n.numero}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.values(clientesAgrupados).length === 0 && (
                        <div className="text-center py-10">
                            <Ticket size={40} className="mx-auto text-slate-100 mb-2"/>
                            <p className="text-[10px] font-black text-slate-300 uppercase">No hay participantes aún</p>
                        </div>
                    )}
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
              {/* ESTILO MEJORADO PARA SUBIDA DE IMAGEN */}
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
                    <label className="text-[10px] font-black text-blue-400 ml-2 uppercase flex items-center gap-2">
                        <Calendar size={14}/> Fecha de Finalización de la Rifa
                    </label>
                    <p className="text-[9px] text-blue-300 ml-2 mb-2 font-bold">* Indica cuándo se cerrará la venta de tickets automáticamente.</p>
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

      {/* Modal Venta Manual */}
      {showManualAssign && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase italic text-slate-900 tracking-tighter">Venta Directa</h3>
                <button onClick={() => setShowManualAssign(false)} className="text-slate-300 hover:text-slate-900"><X/></button>
            </div>
            <form onSubmit={handleManualAssignment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Tickets (Separar por comas)</label>
                <input type="text" required placeholder="Ej: 1, 5, 20" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" onChange={e => setManualData({...manualData, numeros: e.target.value})} />
              </div>
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

      {/* Detalle Ticket Individual (Modal Admin) - ACTUALIZADO CON TELÉFONO */}
      {numDetail && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-2 ${ESTADOS[numDetail.estado].bg}`}></div>
            <div className="flex justify-between items-center mb-6">
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

  useEffect(() => { 
    fetchRifas(); 
  }, [userId]);

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

  const reportarPago = async () => {
    if(!payData.ref || payData.ref.length < 4) return alert("Ingresa los últimos 4 dígitos de la referencia");
    const { error } = await supabase.from('numeros').update({ 
        estado: 'apartado', 
        comprador_id: userId, 
        referencia_pago: payData.ref 
    }).in('id_numero', cart);
    
    if(!error) { 
        alert("¡Reporte de pago enviado! Tu ticket estará en revisión."); 
        setSelectedRifa(null); 
        setShowPay(false); 
        setPaymentMethod(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100"><Trophy size={20}/></div>
            <h1 className="font-black italic text-2xl tracking-tighter text-blue-600">RIFAPRO</h1>
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
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sorteos Activos</h3>
                <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            {rifas.map(r => (
              <div key={r.id_rifa} onClick={() => selectRifa(r)} className="bg-white p-5 rounded-[2.8rem] border border-slate-100 hover:border-blue-500 cursor-pointer shadow-sm flex gap-5 items-center transition-all group active:scale-95">
                <img src={r.imagen_url || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-[2rem] object-cover bg-slate-50 shadow-xl shadow-slate-200 group-hover:rotate-3 transition-transform" />
                <div className="flex-1">
                  <h3 className="text-xl font-black uppercase italic leading-none text-slate-800">{r.nombre}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-green-100 text-green-600 text-[10px] font-black px-2 py-1 rounded-lg">${r.precio} USD</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{r.cantidad_numeros} Números</span>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-blue-600 font-black text-[10px] uppercase">
                    Participar <ChevronLeft size={14} className="rotate-180"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pb-40">
            <div className="flex justify-between items-center mb-6 pt-2">
              <button onClick={() => setSelectedRifa(null)} className="flex items-center gap-2 font-black text-slate-400 text-[10px] uppercase tracking-widest px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm"><ChevronLeft size={16}/> Atrás</button>
              <button 
                onClick={() => setHideSold(!hideSold)} 
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-md ${hideSold ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-500 border border-slate-200'}`}>
                {hideSold ? <Eye size={16}/> : <EyeOff size={16}/>} {hideSold ? 'Ver Todo' : 'Ver Libres'}
              </button>
            </div>
            
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 mb-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-6 right-8 bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-2xl shadow-lg shadow-blue-100">${selectedRifa.precio} USD</div>
              <h2 className="text-3xl font-black uppercase italic leading-none text-slate-900 pr-20">{selectedRifa.nombre}</h2>
              <div className="flex items-center gap-2 mt-4 text-slate-400 font-bold text-xs">
                <Calendar size={14} className="text-blue-500"/> Finaliza el: {selectedRifa.fecha_fin}
              </div>
              <div className="mt-6 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-50">
                <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-tight">{selectedRifa.descripcion}</p>
              </div>
            </div>

            {/* GRILLA DE NÚMEROS CLIENTE */}
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-3 bg-white p-6 rounded-[3rem] border border-slate-100 shadow-inner">
              {nums.map(n => {
                const isMine = n.comprador_id === userId;
                const isSelected = cart.includes(n.id_numero);
                
                // Esquema de colores para el cliente solicitado:
                // Pagado: Gris | Apartado: Rojo | Mío: Azul | Seleccionado: Negro
                let bgColor = 'bg-green-500 border-green-600';
                if (n.estado === 'pagado') bgColor = 'bg-slate-200 border-slate-300 text-slate-400'; // GRIS
                if (n.estado === 'apartado') bgColor = 'bg-red-600 border-red-700 text-white';     // ROJO
                if (isMine) bgColor = 'bg-blue-600 border-blue-700 text-white shadow-xl shadow-blue-100 scale-105 z-10'; // AZUL CON CHECK
                if (isSelected) bgColor = 'bg-slate-900 border-black text-white scale-110 z-10';

                if (hideSold && n.estado !== 'disponible' && !isMine) return null;

                return (
                  <button key={n.id_numero} 
                    disabled={n.estado !== 'disponible' && !isMine} 
                    onClick={() => { 
                        if(n.estado === 'disponible') {
                            setCart(prev => prev.includes(n.id_numero) ? prev.filter(id => id !== n.id_numero) : [...prev, n.id_numero]);
                        }
                    }}
                    className={`aspect-square rounded-[1.2rem] text-[10px] font-black border-2 transition-all relative ${bgColor} flex items-center justify-center`}>
                    {n.numero}
                    {isMine && (
                        <div className="absolute -top-2 -right-2 bg-white text-blue-600 rounded-full border-2 border-blue-600 p-0.5 shadow-md">
                            <CheckCircle2 size={10} strokeWidth={4}/>
                        </div>
                    )}
                  </button>
                );
              })}
            </div>

            {cart.length > 0 && (
              <div className="fixed bottom-8 left-4 right-4 bg-slate-900 text-white p-7 rounded-[3rem] flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-40 border border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-800 p-3 rounded-2xl text-blue-500 shadow-inner"><Ticket/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{cart.length} Seleccionados</p>
                        <p className="text-3xl font-black italic tracking-tighter">${(cart.length * selectedRifa.precio).toFixed(2)}</p>
                    </div>
                </div>
                <button onClick={() => setShowPay(true)} className="bg-blue-600 px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-blue-500 transition-all active:scale-90 shadow-xl shadow-blue-900/20">
                    Pagar Ahora
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL PAGO CLIENTE */}
      {showPay && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600"></div>
            <h3 className="text-3xl font-black mb-2 uppercase italic text-slate-900 tracking-tighter">Completar Pago</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Sigue las instrucciones de transferencia</p>
            
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
                    <div className="bg-blue-600 p-6 rounded-[2.5rem] mb-6 text-white text-center shadow-xl shadow-blue-100">
                        <p className="text-[10px] font-black uppercase opacity-70 mb-2">Datos para transferir</p>
                        <p className="text-sm font-black leading-relaxed">
                            BANCO CENTRAL<br/>
                            V-12.345.678<br/>
                            0412-0000000
                        </p>
                    </div>
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

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center border border-slate-100">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48}/>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] animate-pulse">Cargando Rifapro...</p>
        </div>
    </div>
  );

  if (!session) return <Auth onLogin={setSession} />;
  
  return role === 'admin' ? <AdminPanel /> : <ClienteView userId={session.user.id} />;
}
