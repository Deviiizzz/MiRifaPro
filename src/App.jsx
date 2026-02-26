import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LogOut, Plus, Ticket, X, CheckCircle2, Loader2, CreditCard, 
  User, Phone, ChevronLeft, Trash2, Download, Eye, EyeOff, FileText, Image as ImageIcon, Edit3, Printer, Trophy, PartyPopper, Calendar, Info, Building2, Smartphone, AlertCircle, Star, Gift, Crown
} from 'lucide-center';

// Librerías para documentos
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './index.css'; 

// --- CONFIGURACIÓN DE COLORES Y ESTADOS ---
const ESTADOS = {
  disponible: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white', label: 'Libre' },
  apartado: { bg: 'bg-red-600', border: 'border-red-700', text: 'text-white', label: 'Revision' }, // ROJO PARA REVISIÓN
  pagado: { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white', label: 'Vendido' },   // AZUL PARA VENDIDO (ADMIN)
  ganador: { bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-amber-950', label: '¡GANADOR!' } // DORADO PREMIADO
};

// --- COMPONENTE DE ACCESO (AUTH) ---
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
        alert("¡Registro exitoso! Ya puedes entrar.");
        setIsRegistering(false);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: finalEmail, password: formData.password });
      if (error) alert("Credenciales incorrectas o usuario no existe.");
      else onLogin(data.user);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
        <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-5 rounded-[2rem] rotate-12 shadow-xl shadow-blue-200">
                <Trophy size={42} className="text-white"/>
            </div>
        </div>
        <h2 className="text-5xl font-black text-center mb-1 italic tracking-tighter text-blue-600">RIFAPRO</h2>
        <p className="text-center text-slate-400 text-[10px] mb-10 font-black uppercase tracking-[0.3em]">Premium Sweepstakes System</p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <input type="text" placeholder="Nombre" required className="w-full p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 outline-none focus:border-blue-500 font-bold text-sm transition-all" onChange={e => setFormData({...formData, nombre: e.target.value})} />
              <input type="text" placeholder="Apellido" required className="w-full p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 outline-none focus:border-blue-500 font-bold text-sm transition-all" onChange={e => setFormData({...formData, apellido: e.target.value})} />
            </div>
          )}
          <div className="relative">
            <Smartphone className="absolute left-5 top-5 text-slate-300" size={20}/>
            <input type="tel" placeholder="Teléfono (Usuario)" required className="w-full p-5 pl-14 bg-slate-50 rounded-[1.5rem] border border-slate-100 outline-none focus:border-blue-500 font-bold text-sm transition-all" onChange={e => setFormData({...formData, telefono: e.target.value})} />
          </div>
          <input type="password" placeholder="Contraseña" required className="w-full p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 outline-none focus:border-blue-500 font-bold text-sm transition-all" onChange={e => setFormData({...formData, password: e.target.value})} />
          
          <button disabled={loading} className="w-full bg-blue-600 text-white p-6 rounded-[1.8rem] font-black uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4 text-sm">
            {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Crear mi Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>

        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center mt-10 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-all">
          {isRegistering ? '¿Ya eres miembro? Entrar' : '¿No tienes cuenta? Regístrate gratis'}
        </button>
      </div>
    </div>
  );
};

// --- PANEL ADMINISTRADOR (FULL) ---
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
  const [manualData, setManualData] = useState({ numeros: '', nombre: '', apellido: '', telefono: '', estado: 'pagado' });
  const [pendientesNotif, setPendientesNotif] = useState({});

  useEffect(() => { 
    fetchRifas(); 
    calculateStats();
  }, []);

  const calculateStats = async () => {
    const { data: nums } = await supabase.from('numeros').select('estado, rifas(precio)');
    let total = 0; let pagados = 0; let revision = 0;
    nums?.forEach(n => {
      if (n.estado === 'pagado') { total += n.rifas?.precio || 0; pagados++; }
      if (n.estado === 'apartado') revision++;
    });
    setStats({ recaudado: total.toLocaleString(), vendidos: pagados, pendientes: revision });
  };

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*, usuarios!rifas_ganador_id_fkey(nombre, apellido, telefono)').order('creado_en', { ascending: false });
    const rifasData = data || [];
    setRifas(rifasData);
    
    // Contar pendientes para badges
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

  // --- LÓGICA DE SORTEO ---
  const realizarSorteo = async () => {
    const pagados = numsRifa.filter(n => n.estado === 'pagado');
    if (pagados.length === 0) return alert("Error: No existen tickets vendidos (pagados) para sortear.");
    
    if (!window.confirm("¿FINALIZAR SORTEO? Se elegirá un ganador al azar y se cerrará la venta permanentemente.")) return;

    setLoadingAction(true);
    const ganador = pagados[Math.floor(Math.random() * pagados.length)];

    const { error } = await supabase.from('rifas').update({
        estado: 'finalizada',
        ganador_id: ganador.comprador_id,
        numero_ganador: ganador.numero
    }).eq('id_rifa', selectedRifa.id_rifa);

    if (!error) {
        alert(`¡SORTEO COMPLETADO! El número ganador es el ${ganador.numero}`);
        await fetchRifas();
        setView('list');
    }
    setLoadingAction(false);
  };

  const handleActionNumber = async (numId, nuevoEstado) => {
    setLoadingAction(true);
    const updateData = nuevoEstado === 'disponible' ? { estado: 'disponible', comprador_id: null, referencia_pago: null } : { estado: 'pagado' };
    await supabase.from('numeros').update(updateData).eq('id_numero', numId);
    await openRifaDetail(selectedRifa);
    setNumDetail(null);
    calculateStats();
    setLoadingAction(false);
  };

  const aprobarTodoElCliente = async (clienteId) => {
    if(!window.confirm("¿Aprobar todos los tickets pendientes de este cliente?")) return;
    setLoadingAction(true);
    await supabase.from('numeros').update({ estado: 'pagado' }).eq('id_rifa', selectedRifa.id_rifa).eq('comprador_id', clienteId).eq('estado', 'apartado');
    await openRifaDetail(selectedRifa);
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
        await supabase.storage.from('rifas_premios').upload(fileName, imageFile);
        const { data: urlData } = supabase.storage.from('rifas_premios').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase.from('rifas').insert([{
        nombre: newRifa.nombre,
        descripcion: newRifa.descripcion,
        precio: newRifa.precio,
        cantidad_numeros: newRifa.cantidad,
        fecha_fin: newRifa.fecha,
        estado: 'activa',
        imagen_url: publicUrl
      }]).select();

      if (error) throw error;

      const numEntries = Array.from({ length: newRifa.cantidad }, (_, i) => ({
        id_rifa: data[0].id_rifa,
        numero: i + 1,
        estado: 'disponible'
      }));

      await supabase.from('numeros').insert(numEntries);
      setView('list');
      fetchRifas();
      calculateStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditRifa = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    let publicUrl = selectedRifa.imagen_url;

    if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        await supabase.storage.from('rifas_premios').upload(fileName, imageFile);
        const { data: urlData } = supabase.storage.from('rifas_premios').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('rifas').update({
        nombre: selectedRifa.nombre,
        descripcion: selectedRifa.descripcion,
        fecha_fin: selectedRifa.fecha_fin,
        imagen_url: publicUrl
    }).eq('id_rifa', selectedRifa.id_rifa);

    if (!error) {
        setView('list');
        fetchRifas();
    }
    setLoadingAction(false);
  };

  const venderManual = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    const numsArray = manualData.numeros.split(',').map(n => parseInt(n.trim()));
    
    // 1. Crear usuario temporal si no existe o usar uno genérico para venta física
    const tempId = "00000000-0000-0000-0000-000000000000"; // ID Reservado para Venta Manual

    const { error } = await supabase.from('numeros')
        .update({ 
            estado: manualData.estado, 
            comprador_id: null, // Opcional: podrías guardar el nombre en una nota o referencia
            referencia_pago: `MANUAL: ${manualData.nombre} ${manualData.telefono}` 
        })
        .eq('id_rifa', selectedRifa.id_rifa)
        .in('numero', numsArray);

    if (error) alert("Error en venta manual: " + error.message);
    else {
        alert("Tickets asignados correctamente.");
        setShowManualAssign(false);
        openRifaDetail(selectedRifa);
    }
    setLoadingAction(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Lista de Participantes: ${selectedRifa.nombre}`, 14, 20);
    
    const tableData = numsRifa
      .filter(n => n.comprador_id || n.referencia_pago)
      .map(n => [
        n.numero,
        n.usuarios ? `${n.usuarios.nombre} ${n.usuarios.apellido}` : 'VENTA MANUAL',
        n.usuarios?.telefono || 'N/A',
        n.estado.toUpperCase(),
        n.referencia_pago || '-'
      ]);

    autoTable(doc, {
      head: [['N°', 'Cliente', 'Teléfono', 'Estado', 'Referencia']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    doc.save(`Rifa_${selectedRifa.nombre}_Participantes.pdf`);
  };

  const exportToExcel = () => {
    const data = numsRifa.map(n => ({
        Numero: n.numero,
        Cliente: n.usuarios ? `${n.usuarios.nombre} ${n.usuarios.apellido}` : 'MANUAL',
        Telefono: n.usuarios?.telefono || '',
        Estado: n.estado,
        Referencia: n.referencia_pago
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participantes");
    XLSX.writeFile(wb, `Reporte_${selectedRifa.nombre}.xlsx`);
  };

  const clientesAgrupados = numsRifa.reduce((acc, n) => {
    if (n.comprador_id || n.referencia_pago) {
      const key = n.comprador_id || n.referencia_pago;
      if (!acc[key]) acc[key] = { info: n.usuarios, manualName: n.referencia_pago, numeros: [], tienePendientes: false };
      acc[key].numeros.push(n);
      if (n.estado === 'apartado') acc[key].tienePendientes = true;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-800">
      {/* Navbar Admin */}
      <nav className="bg-white border-b p-5 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-[1.2rem] text-white shadow-lg"><Building2 size={20}/></div>
            <h1 className="font-black italic text-2xl text-blue-600 tracking-tighter">RIFAPRO ADMIN</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase">Administrador</p>
                <p className="text-xs font-bold">Control Central</p>
            </div>
            <button onClick={async () => await supabase.auth.signOut()} className="text-red-500 p-3 bg-red-50 rounded-2xl font-black text-xs hover:bg-red-100 transition-all flex items-center gap-2">
                <LogOut size={20}/> <span className="hidden sm:inline">SALIR</span>
            </button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-[1400px] mx-auto">
        {view === 'list' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                <div className="bg-green-100 p-5 rounded-[1.8rem] text-green-600 group-hover:scale-110 transition-transform"><CreditCard size={32}/></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Recaudado</p><p className="text-3xl font-black text-slate-900">${stats.recaudado}</p></div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                <div className="bg-blue-100 p-5 rounded-[1.8rem] text-blue-600 group-hover:scale-110 transition-transform"><Ticket size={32}/></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tickets Vendidos</p><p className="text-3xl font-black text-slate-900">{stats.vendidos}</p></div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                <div className="bg-red-100 p-5 rounded-[1.8rem] text-red-600 animate-pulse"><AlertCircle size={32}/></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Por Revisar</p><p className="text-3xl font-black text-slate-900">{stats.pendientes}</p></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-black italic uppercase text-slate-400 tracking-tighter">Gestión de Sorteos</h2>
                <button onClick={() => setView('create')} className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-[1.8rem] font-black text-xs uppercase shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    <Plus size={20}/> Crear Nueva Rifa
                </button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rifas.map(r => (
                <div key={r.id_rifa} className={`group bg-white p-5 rounded-[3rem] shadow-sm border transition-all hover:shadow-2xl flex flex-col ${r.estado === 'finalizada' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'}`}>
                  <div className="relative mb-5">
                    {r.imagen_url ? (
                        <img src={r.imagen_url} className="w-full h-48 rounded-[2.2rem] object-cover shadow-md" />
                    ) : (
                        <div className="w-full h-48 rounded-[2.2rem] bg-slate-50 flex items-center justify-center text-slate-200 border-2 border-dashed"><ImageIcon size={48}/></div>
                    )}
                    {pendientesNotif[r.id_rifa] > 0 && r.estado === 'activa' && (
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shadow-lg border-4 border-white animate-bounce">
                            {pendientesNotif[r.id_rifa]}
                        </div>
                    )}
                    {r.estado === 'finalizada' && (
                        <div className="absolute top-4 left-4 bg-amber-400 text-amber-950 px-4 py-2 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg">
                            <Crown size={14}/> Finalizada
                        </div>
                    )}
                  </div>

                  <div className="flex-1 px-2">
                    <h3 className="font-black uppercase text-lg leading-tight text-slate-800 mb-1">{r.nombre}</h3>
                    {r.estado === 'finalizada' ? (
                        <p className="text-[10px] text-amber-600 font-black uppercase tracking-tight">Ganador: {r.usuarios?.nombre} (Ticket #{r.numero_ganador})</p>
                    ) : (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1"><Calendar size={12}/> Termina: {r.fecha_fin}</p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button onClick={() => openRifaDetail(r)} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all">Gestionar</button>
                    <button onClick={() => { setSelectedRifa(r); setView('edit'); }} className="bg-blue-50 text-blue-600 p-4 rounded-2xl hover:bg-blue-100 transition-all"><Edit3 size={18}/></button>
                    <button onClick={async () => { if(window.confirm("¿Eliminar sorteo permanentemente?")) { await supabase.from('rifas').delete().eq('id_rifa', r.id_rifa); fetchRifas(); calculateStats(); } }} className="bg-red-50 text-red-500 p-4 rounded-2xl hover:bg-red-100 transition-all"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'detail' && selectedRifa && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            {/* Header Detalle */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded-[2.5rem] border shadow-sm">
                <button onClick={() => setView('list')} className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-4 py-2 hover:text-blue-600 transition-all"><ChevronLeft size={20}/> Volver al Panel</button>
                <div className="flex flex-wrap gap-3">
                    {selectedRifa.estado === 'activa' && (
                        <>
                            <button onClick={realizarSorteo} className="bg-amber-400 text-amber-900 px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-amber-100 hover:bg-amber-500 transition-all">
                                <Star size={18}/> Realizar Sorteo
                            </button>
                            <button onClick={() => setShowManualAssign(true)} className="bg-blue-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                                <Plus size={18}/> Venta Manual
                            </button>
                        </>
                    )}
                    <button onClick={exportToPDF} className="bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-black transition-all"><FileText size={18}/> PDF</button>
                    <button onClick={exportToExcel} className="bg-green-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-green-700 transition-all"><Download size={18}/> EXCEL</button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Columna Izquierda: Grid de Números */}
              <div className="lg:w-2/3 space-y-6">
                <div className={`p-8 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row gap-8 items-center ${selectedRifa.estado === 'finalizada' ? 'bg-amber-400 border-amber-500' : 'bg-white border-slate-100'}`}>
                    {selectedRifa.imagen_url && <img src={selectedRifa.imagen_url} className="w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white" />}
                    <div className="flex-1 text-center md:text-left">
                        <h2 className={`text-4xl font-black uppercase italic leading-none tracking-tighter ${selectedRifa.estado === 'finalizada' ? 'text-amber-950' : 'text-slate-900'}`}>{selectedRifa.nombre}</h2>
                        {selectedRifa.estado === 'finalizada' ? (
                            <div className="mt-4 flex items-center justify-center md:justify-start gap-3 bg-white/40 p-4 rounded-3xl border border-white/50 animate-in zoom-in">
                                <Crown className="text-amber-900" size={32}/>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-amber-900">Ganador del Sorteo</p>
                                    <p className="text-xl font-black uppercase leading-tight text-amber-950">{selectedRifa.usuarios?.nombre} {selectedRifa.usuarios?.apellido}</p>
                                    <p className="text-sm font-bold text-amber-800">Ticket Premiado: #{selectedRifa.numero_ganador}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                                <div className="bg-slate-50 px-4 py-2 rounded-xl border"><p className="text-[9px] font-black text-slate-400 uppercase">Precio</p><p className="font-black text-blue-600">${selectedRifa.precio}</p></div>
                                <div className="bg-slate-50 px-4 py-2 rounded-xl border"><p className="text-[9px] font-black text-slate-400 uppercase">Capacidad</p><p className="font-black">{selectedRifa.cantidad_numeros} Núms</p></div>
                                <div className="bg-slate-50 px-4 py-2 rounded-xl border"><p className="text-[9px] font-black text-slate-400 uppercase">Estado</p><p className="font-black text-green-500">VENTA ACTIVA</p></div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Grid Visual */}
                <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm">
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                    {numsRifa.map(n => {
                      const isWinnerNum = selectedRifa.estado === 'finalizada' && n.numero === selectedRifa.numero_ganador;
                      return (
                        <button key={n.id_numero} 
                          onClick={() => n.estado !== 'disponible' && setNumDetail(n)}
                          className={`aspect-square rounded-2xl text-[11px] font-black border-2 transition-all relative flex items-center justify-center 
                          ${isWinnerNum ? ESTADOS.ganador.bg : ESTADOS[n.estado].bg} 
                          ${isWinnerNum ? ESTADOS.ganador.border : ESTADOS[n.estado].border} 
                          ${isWinnerNum ? ESTADOS.ganador.text : ESTADOS[n.estado].text} 
                          ${isWinnerNum ? 'scale-110 shadow-2xl z-10 animate-pulse' : 'hover:scale-105 shadow-sm active:scale-90'}
                          ${n.estado === 'disponible' ? 'cursor-default opacity-40' : 'cursor-pointer'}`}>
                          {n.numero}
                          {isWinnerNum && <Crown size={14} className="absolute -top-3 text-amber-600 drop-shadow-md"/>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Participantes Agrupados */}
              <div className="lg:w-1/3">
                <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm sticky top-28 max-h-[75vh] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-8">
                    <User className="text-blue-600" size={24}/>
                    <h3 className="text-[12px] font-black uppercase text-slate-400 tracking-[0.2em]">Participantes</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.values(clientesAgrupados).length === 0 ? (
                        <div className="text-center py-10 text-slate-300 font-bold uppercase text-[10px] border-2 border-dashed rounded-[2rem]">Sin ventas registradas</div>
                    ) : (
                        Object.values(clientesAgrupados).map((item, idx) => (
                        <div key={idx} className={`p-6 rounded-[2.2rem] border-2 transition-all ${item.tienePendientes ? 'border-red-200 bg-red-50/50' : 'border-slate-50 hover:border-blue-100'}`}>
                            <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <p className="font-black text-sm uppercase text-slate-800 leading-tight">
                                    {item.info ? `${item.info.nombre} ${item.info.apellido}` : (item.manualName || "Venta Directa")}
                                </p>
                                <p className="text-[10px] text-slate-500 font-black mt-1 flex items-center gap-1">
                                    <Phone size={12}/> {item.info?.telefono || "Sin Teléfono"}
                                </p>
                            </div>
                            {item.tienePendientes && selectedRifa.estado === 'activa' && (
                                <button onClick={() => aprobarTodoElCliente(item.info?.id_usuario)} className="bg-red-600 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase shadow-lg shadow-red-200 hover:scale-105 active:scale-95">APROBAR</button>
                            )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                            {item.numeros.map(n => (
                                <span key={n.id_numero} 
                                    className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all
                                    ${n.numero === selectedRifa.numero_ganador ? 'bg-amber-400 text-amber-950 border-amber-500 scale-110' : 
                                      n.estado === 'apartado' ? 'bg-red-600 text-white border-red-700' : 'bg-blue-600 text-white border-blue-700 opacity-60'}`}>
                                    #{n.numero}
                                </span>
                            ))}
                            </div>
                        </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-2xl border border-slate-100 max-w-3xl mx-auto animate-in zoom-in duration-300">
            <button onClick={() => setView('list')} className="mb-10 flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-all"><ChevronLeft size={20}/> Cancelar Proceso</button>
            <h2 className="text-4xl font-black mb-10 uppercase italic text-slate-900 tracking-tighter">{view === 'create' ? 'Crear Nuevo Sorteo' : 'Actualizar Información'}</h2>
            
            <form onSubmit={view === 'create' ? crearRifa : handleEditRifa} className="space-y-8">
              {/* Carga de Imagen Optimizada */}
              <label className="group w-full flex flex-col items-center px-6 py-12 bg-slate-50 text-blue-500 rounded-[3rem] border-4 border-dashed border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all relative overflow-hidden">
                  <div className="bg-white p-6 rounded-[2.5rem] shadow-xl group-hover:scale-110 transition-transform mb-4">
                    <ImageIcon size={48} className="text-blue-600" />
                  </div>
                  <span className="text-xs font-black uppercase text-slate-500 tracking-widest">{imageFile ? imageFile.name : 'Subir Fotografía del Premio'}</span>
                  <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">Formatos: JPG, PNG, WEBP</p>
                  <input type='file' accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
                  {imageFile && <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full"><CheckCircle2 size={20}/></div>}
              </label>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-4">Nombre del Premio Principal</label>
                <input type="text" placeholder="Ej: iPhone 15 Pro Max" className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 outline-none focus:border-blue-500 font-bold text-lg" required 
                    value={view === 'edit' ? selectedRifa.nombre : newRifa.nombre}
                    onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, nombre: e.target.value}) : setNewRifa({...newRifa, nombre: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-4">Descripción Detallada</label>
                <textarea placeholder="Describe las condiciones, entrega y detalles..." className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 outline-none focus:border-blue-500 font-bold h-40 resize-none" 
                    value={view === 'edit' ? selectedRifa.descripcion : newRifa.descripcion}
                    onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, descripcion: e.target.value}) : setNewRifa({...newRifa, descripcion: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-4">Capacidad de Números</label>
                    <input type="number" placeholder="Cantidad (100-1000)" disabled={view === 'edit'} className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 font-black text-lg outline-none focus:border-blue-500" value={view === 'edit' ? selectedRifa.cantidad_numeros : newRifa.cantidad} onChange={e => setNewRifa({...newRifa, cantidad: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-4">Precio del Ticket ($)</label>
                    <input type="number" step="0.01" placeholder="Costo Unitario" disabled={view === 'edit'} className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 font-black text-lg text-green-600 outline-none focus:border-blue-500" value={view === 'edit' ? selectedRifa.precio : newRifa.precio} onChange={e => setNewRifa({...newRifa, precio: parseFloat(e.target.value)})} />
                  </div>
              </div>

              <div className="bg-blue-50 p-8 rounded-[3rem] border border-blue-100">
                <label className="text-[11px] font-black text-blue-500 uppercase flex items-center gap-3 mb-4 tracking-[0.2em]"><Calendar size={20}/> Fecha Límite de Sorteo</label>
                <input type="date" className="w-full p-5 bg-white rounded-2xl border-none outline-none font-black text-blue-600 uppercase shadow-inner" value={view === 'edit' ? selectedRifa.fecha_fin : newRifa.fecha} onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, fecha_fin: e.target.value}) : setNewRifa({...newRifa, fecha: e.target.value})} />
              </div>

              <button disabled={loadingAction} className="w-full bg-blue-600 text-white p-8 rounded-[2.5rem] font-black uppercase text-sm shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95">
                {loadingAction ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24}/> {view === 'create' ? 'Publicar Sorteo Ahora' : 'Guardar Cambios'}</>}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Modal Detalle de Ticket Individual (ADMIN) */}
      {numDetail && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[4rem] w-full max-w-md shadow-2xl relative overflow-hidden text-center">
            <div className={`absolute top-0 left-0 right-0 h-3 ${selectedRifa.numero_ganador === numDetail.numero ? 'bg-amber-400' : ESTADOS[numDetail.estado].bg}`}></div>
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                <Ticket size={40} className="text-slate-400"/>
            </div>
            <h3 className="text-4xl font-black italic uppercase text-slate-900 mb-8 tracking-tighter">Ticket #{numDetail.numero}</h3>
            
            <div className="space-y-4 mb-10 bg-slate-50 p-8 rounded-[2.5rem] text-left border border-slate-100">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dueño Actual</p>
                    <p className="font-black text-slate-800 text-xl leading-none uppercase">
                        {numDetail.usuarios ? `${numDetail.usuarios.nombre} ${numDetail.usuarios.apellido}` : 'PENDIENTE / MANUAL'}
                    </p>
                </div>
                <div className="pt-4 border-t border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contacto Registrado</p>
                    <p className="font-black text-blue-600 text-lg">{numDetail.usuarios?.telefono || 'No disponible'}</p>
                </div>
                <div className="pt-4 border-t border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Referencia de Pago</p>
                    <p className="font-black text-slate-700 text-sm tracking-widest break-all">{numDetail.referencia_pago || '---'}</p>
                </div>
            </div>

            <div className="grid gap-4">
                {numDetail.estado === 'apartado' && selectedRifa.estado === 'activa' && (
                    <button onClick={() => handleActionNumber(numDetail.id_numero, 'pagado')} className="bg-blue-600 text-white p-6 rounded-[1.8rem] font-black text-xs uppercase shadow-xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all">
                        <CheckCircle2 size={22}/> Aprobar Pago
                    </button>
                )}
                {selectedRifa.estado === 'activa' && (
                    <button onClick={() => handleActionNumber(numDetail.id_numero, 'disponible')} className="bg-red-50 text-red-600 p-6 rounded-[1.8rem] font-black text-xs uppercase flex items-center justify-center gap-3 hover:bg-red-100 transition-all">
                        <Trash2 size={22}/> Liberar Ticket
                    </button>
                )}
                <button onClick={() => setNumDetail(null)} className="text-slate-400 font-black text-[10px] uppercase py-4 tracking-widest hover:text-slate-600 transition-all">Cerrar Ventana</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Venta Manual */}
      {showManualAssign && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in zoom-in duration-300">
          <div className="bg-white p-10 md:p-14 rounded-[4rem] w-full max-w-2xl shadow-2xl relative">
            <h3 className="text-4xl font-black mb-10 uppercase italic text-slate-900 tracking-tighter">Venta Directa / Manual</h3>
            <form onSubmit={venderManual} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-4">Números (Separados por coma)</label>
                    <input type="text" placeholder="Ej: 5, 23, 88" className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 font-black text-2xl text-blue-600" required onChange={e => setManualData({...manualData, numeros: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Nombre del Comprador" className="p-5 bg-slate-50 rounded-[1.5rem] border font-bold" required onChange={e => setManualData({...manualData, nombre: e.target.value})} />
                    <input type="tel" placeholder="Teléfono" className="p-5 bg-slate-50 rounded-[1.5rem] border font-bold" required onChange={e => setManualData({...manualData, telefono: e.target.value})} />
                </div>
                <div className="flex gap-4 p-2 bg-slate-50 rounded-[2rem]">
                    <button type="button" onClick={() => setManualData({...manualData, estado: 'pagado'})} className={`flex-1 p-4 rounded-[1.5rem] font-black text-xs uppercase transition-all ${manualData.estado === 'pagado' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>Ya Pagó</button>
                    <button type="button" onClick={() => setManualData({...manualData, estado: 'apartado'})} className={`flex-1 p-4 rounded-[1.5rem] font-black text-xs uppercase transition-all ${manualData.estado === 'apartado' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>Pendiente</button>
                </div>
                <div className="flex gap-4 pt-6">
                    <button type="submit" className="flex-1 bg-slate-900 text-white p-7 rounded-[2rem] font-black uppercase text-xs shadow-2xl hover:bg-black transition-all">Registrar Venta</button>
                    <button type="button" onClick={() => setShowManualAssign(false)} className="px-10 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase text-xs">Cerrar</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- VISTA CLIENTE (PREMIUM) ---
const ClienteView = ({ userId }) => {
  const [rifas, setRifas] = useState([]);
  const [selectedRifa, setSelectedRifa] = useState(null);
  const [nums, setNums] = useState([]);
  const [cart, setCart] = useState([]);
  const [showPay, setShowPay] = useState(false);
  const [payData, setPayData] = useState({ ref: '' });
  const [hideSold, setHideSold] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => { 
    fetchRifas(); 
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('usuarios').select('*').eq('id_usuario', userId).single();
    setUserProfile(data);
  };

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*').order('estado', { ascending: true });
    setRifas(data || []);
  };

  const selectRifa = async (rifa) => {
    setSelectedRifa(rifa);
    const { data } = await supabase.from('numeros').select('*').eq('id_rifa', rifa.id_rifa).order('numero', { ascending: true });
    setNums(data || []);
    setCart([]);
  };

  const reportarPago = async () => {
    if(!payData.ref || payData.ref.length < 4) return alert("Por favor, ingresa los últimos 4 dígitos de la referencia bancaria.");
    
    const { error } = await supabase.from('numeros')
        .update({ 
            estado: 'apartado', 
            comprador_id: userId, 
            referencia_pago: `REF-${payData.ref}` 
        })
        .in('id_numero', cart);

    if(!error) { 
        alert("¡Recibido! Tu pago está en revisión por un administrador."); 
        setSelectedRifa(null); 
        setShowPay(false); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-10">
      <header className="bg-white p-6 border-b flex justify-between items-center sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-[1.2rem] text-white shadow-xl shadow-blue-200"><Trophy size={24}/></div>
            <h1 className="font-black italic text-3xl tracking-tighter text-blue-600">RIFAPRO</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Bienvenido</p>
                <p className="text-xs font-black uppercase text-slate-800">{userProfile?.nombre}</p>
            </div>
            <button onClick={async () => await supabase.auth.signOut()} className="p-4 text-slate-300 bg-slate-50 rounded-[1.5rem] hover:text-red-500 hover:bg-red-50 transition-all active:scale-90">
                <LogOut size={24}/>
            </button>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-4xl mx-auto">
        {!selectedRifa ? (
          <div className="space-y-8 mt-4 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-10 md:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy size={200}/></div>
                <PartyPopper className="absolute -right-8 -bottom-8 opacity-20 rotate-12" size={180}/>
                <h2 className="text-4xl md:text-5xl font-black italic uppercase leading-none mb-4 tracking-tighter">Sorteos Activos</h2>
                <p className="text-blue-100 text-[11px] font-black uppercase tracking-[0.4em] opacity-80">Elige tu número de la suerte y gana hoy</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {rifas.map(r => {
                    const soyGanador = r.ganador_id === userId;
                    return (
                        <div key={r.id_rifa} 
                            onClick={() => selectRifa(r)} 
                            className={`p-6 rounded-[3.5rem] border flex flex-col transition-all cursor-pointer group active:scale-95 relative overflow-hidden
                            ${soyGanador ? 'bg-amber-400 border-amber-500 shadow-2xl shadow-amber-200' : 'bg-white border-slate-100 hover:shadow-xl hover:border-blue-200'}`}>
                            
                            <div className="flex gap-6 items-center">
                                <img src={r.imagen_url || 'https://via.placeholder.com/300'} className="w-28 h-28 rounded-[2.2rem] object-cover shadow-2xl group-hover:rotate-3 transition-transform" />
                                <div className="flex-1">
                                    <h3 className={`text-2xl font-black uppercase italic leading-tight tracking-tighter ${soyGanador ? 'text-amber-950' : 'text-slate-800'}`}>{r.nombre}</h3>
                                    {soyGanador ? (
                                        <div className="mt-3 flex items-center gap-2 bg-white/40 p-3 rounded-2xl text-amber-900 font-black text-[10px] uppercase shadow-sm">
                                            <Crown size={14} className="animate-bounce"/> ¡ERES EL GANADOR!
                                        </div>
                                    ) : r.estado === 'finalizada' ? (
                                        <div className="mt-3 flex items-center gap-2 bg-slate-100 p-2 rounded-xl text-slate-400 font-black text-[9px] uppercase">
                                            <LogOut size={12}/> Sorteo Finalizado
                                        </div>
                                    ) : (
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="bg-green-100 text-green-600 text-[11px] font-black px-4 py-2 rounded-xl shadow-sm tracking-widest">${r.precio} USD</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {soyGanador && <div className="absolute -bottom-4 -right-4 opacity-10 text-amber-900"><Trophy size={100}/></div>}
                        </div>
                    );
                })}
            </div>
          </div>
        ) : (
          <div className="pb-40 animate-in slide-in-from-bottom duration-500">
            <button onClick={() => setSelectedRifa(null)} className="mb-8 flex items-center gap-3 font-black text-slate-400 text-[11px] uppercase px-6 py-3 bg-white rounded-full border shadow-sm hover:text-blue-600 transition-all"><ChevronLeft size={20}/> Regresar al Listado</button>
            
            {/* ESTADO DE GANADOR (VISTA CLIENTE) */}
            {selectedRifa.estado === 'finalizada' && (
                <div className={`mb-10 p-10 md:p-14 rounded-[4rem] text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95
                    ${selectedRifa.ganador_id === userId ? 'bg-amber-400 text-amber-950 ring-8 ring-amber-300' : 'bg-slate-900 text-white'}`}>
                    {selectedRifa.ganador_id === userId ? (
                        <>
                            <div className="bg-white/40 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
                                <Crown size={50} className="text-amber-900"/>
                            </div>
                            <h2 className="text-5xl md:text-6xl font-black italic uppercase leading-none mb-4 tracking-tighter">¡LO LOGRASTE!</h2>
                            <p className="text-lg font-black uppercase mb-6 tracking-widest opacity-80 leading-tight">Ganaste el premio con el ticket #{selectedRifa.numero_ganador}</p>
                            <div className="bg-white/30 p-5 rounded-[2.5rem] border border-white/50 text-xs font-black uppercase tracking-widest shadow-inner inline-block px-10">Revisamos tus datos para contactarte</div>
                        </>
                    ) : (
                        <>
                            <Trophy className="mx-auto mb-6 opacity-30" size={60}/>
                            <h2 className="text-3xl font-black italic uppercase leading-none mb-3 tracking-tighter">Resultados del Sorteo</h2>
                            <p className="text-xs font-black uppercase opacity-60 mb-6 tracking-[0.3em]">El número premiado ha sido el:</p>
                            <div className="text-7xl font-black italic my-6 tracking-tighter drop-shadow-2xl">#{selectedRifa.numero_ganador}</div>
                            <p className="text-[10px] font-bold uppercase opacity-40 border-t border-white/10 pt-6 mt-6">Sigue participando en nuestras próximas rifas</p>
                        </>
                    )}
                </div>
            )}

            <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 mb-10 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                    <div className="flex-1">
                        <h2 className="text-4xl md:text-5xl font-black uppercase italic leading-none text-slate-900 tracking-tighter mb-4">{selectedRifa.nombre}</h2>
                        <div className="flex gap-3">
                            <span className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">${selectedRifa.precio} USD</span>
                            <span className="bg-slate-50 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{selectedRifa.cantidad_numeros} Números</span>
                        </div>
                    </div>
                    {selectedRifa.estado === 'activa' && (
                        <button onClick={() => setHideSold(!hideSold)} className={`p-5 rounded-3xl transition-all shadow-lg ${hideSold ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border'}`}>
                            {hideSold ? <Eye size={24}/> : <EyeOff size={24}/>}
                        </button>
                    )}
                </div>
                <div className="mt-10 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative">
                    <Info className="absolute -top-3 -left-3 text-blue-500 bg-white rounded-full shadow-md" size={32}/>
                    <p className="text-[12px] text-slate-500 font-bold uppercase leading-relaxed tracking-wide italic">{selectedRifa.descripcion}</p>
                </div>
            </div>

            {/* TABLERO DE JUEGO */}
            <div className="bg-white p-8 md:p-12 rounded-[4rem] border border-slate-100 shadow-inner">
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                  {nums.map(n => {
                    const isMine = n.comprador_id === userId;
                    const isWinnerNum = selectedRifa.estado === 'finalizada' && n.numero === selectedRifa.numero_ganador;
                    const isSelected = cart.includes(n.id_numero);
                    
                    let style = 'bg-green-500 border-green-600 text-white';
                    if (n.estado === 'pagado') style = 'bg-slate-100 border-slate-200 text-slate-300 opacity-50 cursor-not-allowed';
                    if (n.estado === 'apartado') style = 'bg-red-600 border-red-700 text-white animate-pulse opacity-80';
                    if (isMine) style = 'bg-blue-600 border-blue-700 text-white shadow-xl scale-105 z-10 ring-4 ring-blue-100';
                    if (isWinnerNum) style = 'bg-amber-400 border-amber-500 text-amber-950 scale-125 z-20 animate-pulse shadow-2xl ring-4 ring-amber-200';
                    if (isSelected) style = 'bg-slate-900 border-black text-white shadow-2xl scale-110 rotate-3 z-10';

                    if (hideSold && n.estado !== 'disponible' && !isMine && !isWinnerNum) return null;

                    return (
                      <button key={n.id_numero} 
                        disabled={(n.estado !== 'disponible' && !isMine) || selectedRifa.estado === 'finalizada'} 
                        onClick={() => { if(n.estado === 'disponible') setCart(prev => prev.includes(n.id_numero) ? prev.filter(id => id !== n.id_numero) : [...prev, n.id_numero]); }}
                        className={`aspect-square rounded-[1.2rem] text-[11px] font-black border-2 transition-all relative flex items-center justify-center ${style}`}>
                        {n.numero}
                        {isWinnerNum && <Crown className="absolute -top-4 text-amber-600" size={18}/>}
                        {isMine && !isWinnerNum && <div className="absolute -bottom-2 -right-2 bg-white text-blue-600 rounded-full border-2 border-blue-600 p-0.5 shadow-md"><CheckCircle2 size={12} strokeWidth={4}/></div>}
                      </button>
                    );
                  })}
                </div>
            </div>

            {/* BARRA DE COMPRA FLOTANTE */}
            {cart.length > 0 && selectedRifa.estado === 'activa' && (
              <div className="fixed bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl bg-slate-900 text-white p-8 rounded-[3.5rem] flex justify-between items-center shadow-2xl z-40 border border-slate-800 animate-in slide-in-from-bottom-10">
                <div className="flex items-center gap-6 px-2">
                    <div className="bg-slate-800 p-4 rounded-[1.8rem] text-blue-500 shadow-inner"><Ticket size={32}/></div>
                    <div>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{cart.length} Seleccionados</p>
                        <p className="text-4xl font-black italic tracking-tighter text-blue-400">${(cart.length * selectedRifa.precio).toLocaleString()}</p>
                    </div>
                </div>
                <button onClick={() => setShowPay(true)} className="bg-blue-600 px-10 py-6 rounded-[2.2rem] font-black uppercase text-xs tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-900/40 active:scale-90 transition-all">Pagar Ahora</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL DE PAGO (CLIENTE) */}
      {showPay && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white p-10 md:p-14 rounded-[4rem] w-full max-w-md shadow-2xl relative">
            <h3 className="text-4xl font-black mb-8 uppercase italic text-slate-900 tracking-tighter">Procesar Ticket</h3>
            
            {!paymentMethod ? (
                <div className="space-y-4">
                    <button onClick={() => setPaymentMethod('pago_movil')} className="w-full p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 group hover:bg-blue-50 hover:border-blue-200 transition-all">
                        <div className="bg-white p-4 rounded-2xl text-blue-600 shadow-md group-hover:scale-110 transition-transform"><Smartphone size={28}/></div>
                        <div className="text-left"><p className="font-black uppercase text-sm">Pago Móvil</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Acreditación Rápida</p></div>
                    </button>
                    <button onClick={() => setPaymentMethod('transferencia')} className="w-full p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 group hover:bg-blue-50 hover:border-blue-200 transition-all">
                        <div className="bg-white p-4 rounded-2xl text-blue-600 shadow-md group-hover:scale-110 transition-transform"><Building2 size={28}/></div>
                        <div className="text-left"><p className="font-black uppercase text-sm">Transferencia</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bancos Locales</p></div>
                    </button>
                    <button onClick={() => setShowPay(false)} className="w-full mt-6 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-red-500 transition-all">Cancelar Compra</button>
                </div>
            ) : (
                <div className="animate-in slide-in-from-right duration-300">
                    <div className="bg-blue-600 p-8 rounded-[3rem] mb-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12"><CreditCard size={100}/></div>
                        <p className="text-[10px] font-black uppercase opacity-60 mb-4 tracking-widest">Datos para Transferir</p>
                        <p className="text-lg font-black leading-relaxed">
                            BANCO: PROVINCIAL<br/>
                            NOMBRE: RIFAPRO C.A<br/>
                            RIF: J-50000000-0<br/>
                            PAGO: 0412-1234567
                        </p>
                    </div>
                    
                    <div className="space-y-2 mb-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase px-4">Últimos 4 Dígitos Referencia</label>
                        <input type="text" maxLength="4" placeholder="0000" className="w-full p-7 bg-slate-50 border-2 rounded-[2.2rem] font-black text-center text-4xl tracking-[0.5em] focus:border-blue-500 outline-none transition-all shadow-inner" onChange={e => setPayData({ref: e.target.value})} />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={reportarPago} className="w-full bg-blue-600 text-white p-7 rounded-[2.2rem] font-black uppercase text-xs shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">Informar Pago Ahora</button>
                        <button onClick={() => setPaymentMethod(null)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Volver</button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- APP PRINCIPAL (ENRUTADOR POR SESIÓN Y ROL) ---
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
      setLoading(false); 
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); 
      if (session) checkRole(session.user.id); 
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); 
      if (s) checkRole(s.user.id); 
      else { setRole(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl flex flex-col items-center border border-slate-100">
            <div className="relative">
                <div className="w-20 h-20 bg-blue-50 rounded-full animate-ping absolute"></div>
                <Loader2 className="animate-spin text-blue-600 relative z-10" size={80}/>
            </div>
            <p className="text-[12px] font-black uppercase text-slate-400 tracking-[0.5em] mt-10 animate-pulse">Cargando RifaPro...</p>
        </div>
    </div>
  );

  if (!session) return <Auth onLogin={setSession} />;
  return role === 'admin' ? <AdminPanel /> : <ClienteView userId={session.user.id} />;
}
