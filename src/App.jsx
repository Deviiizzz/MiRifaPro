import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LogOut, Plus, Ticket, X, CheckCircle2, Loader2, CreditCard, 
  User, Phone, ChevronLeft, Trash2, Download, Eye, EyeOff, FileText, Image as ImageIcon, Edit3, Printer, Trophy, PartyPopper, Calendar, Info, Building2, Smartphone, Bell, AlertCircle
} from 'lucide-react';

// Librerías para documentos
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './index.css'; 

// --- CONFIGURACIÓN DE COLORES ---
// Para el Administrador: Revision = Rojo, Pagado = Azul
const ESTADOS_ADMIN = {
  disponible: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white', label: 'Libre' },
  apartado: { bg: 'bg-red-600', border: 'border-red-700', text: 'text-white', label: 'Revision' },
  pagado: { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white', label: 'Vendido' }
};

// Para el Cliente: Revision = Rojo, Pagado = Rojo (Vendido)
const ESTADOS_CLIENTE = {
  disponible: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white', label: 'Libre' },
  apartado: { bg: 'bg-red-600', border: 'border-red-700', text: 'text-white', label: 'Revision' },
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
    const finalEmail = `${formData.telefono}@alexcars-rifas.com`;

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
        <h2 className="text-3xl font-black text-center mb-2 italic tracking-tighter text-blue-600 uppercase">AlexCar´s - Rifas</h2>
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

  // CORRECCIÓN: Cálculo de estadísticas global mejorado
  const calculateStats = async () => {
    const { data: nums, error } = await supabase.from('numeros').select('estado, id_rifa, rifas(precio)');
    if (error) { console.error(error); return; }
    
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
    // Obtenemos rifas y un conteo de sus números pendientes para la notificación
    const { data: rifasData } = await supabase.from('rifas').select('*, numeros(estado)').order('creado_en', { ascending: false });
    
    const processedRifas = rifasData?.map(r => ({
      ...r,
      tienePendientes: r.numeros?.some(n => n.estado === 'apartado')
    })) || [];
    
    setRifas(processedRifas);
  };

  const openRifaDetail = async (rifa) => {
    setSelectedRifa(rifa);
    const { data } = await supabase.from('numeros')
      .select('*, usuarios(id_usuario, nombre, apellido, telefono)')
      .eq('id_rifa', rifa.id_rifa)
      .order('numero', { ascending: true });
    setNumsRifa(data || []);
    setView('detail');
    calculateStats();
  };

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
          "Empresa": "AlexCar´s - Rifas",
          "Rifa": selectedRifa.nombre,
          "Nombre": cliente.info?.nombre,
          "Apellido": cliente.info?.apellido,
          "Telefono": cliente.info?.telefono,
          "Ticket": num.numero,
          "Estado": num.estado,
          "Ref": num.referencia_pago
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participantes");
    XLSX.writeFile(wb, `Reporte_AlexCars_${selectedRifa.nombre}.xlsx`);
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

  const ticketGanador = selectedRifa?.id_ganador ? numsRifa.find(n => n.id_numero === selectedRifa.id_ganador) : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800">
      <nav className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <h1 className="font-black italic text-xl text-blue-600 tracking-tighter uppercase">AlexCar´s - Rifas ADMIN</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-white bg-red-600 p-2 hover:bg-red-700 rounded-full transition-colors flex items-center gap-2 px-4"><LogOut size={18}/> <span className="text-xs font-black uppercase">Salir</span></button>
      </nav>

      <main className="p-4 max-w-[1400px] mx-auto">
        {view === 'list' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-[9px] font-bold text-slate-400 uppercase">Recaudado</p><p className="text-xl font-black text-green-600">${stats.recaudado}</p></div>
              <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-[9px] font-bold text-slate-400 uppercase">Vendidos</p><p className="text-xl font-black text-blue-600">{stats.vendidos}</p></div>
              <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-[9px] font-bold text-slate-400 uppercase">En Revisión</p><p className="text-xl font-black text-red-600">{stats.pendientes}</p></div>
            </div>
            <button onClick={() => setView('create')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all"><Plus/> Nueva Rifa</button>
            <div className="grid gap-4">
              {rifas.map(r => (
                <div key={r.id_rifa} className="bg-white p-4 rounded-3xl shadow-sm border flex items-center gap-4 relative">
                  {/* NOTIFICACIÓN DE PENDIENTES */}
                  {r.tienePendientes && (
                    <div className="absolute -top-2 -left-2 bg-red-600 text-white p-2 rounded-full shadow-lg animate-bounce z-10 border-2 border-white">
                      <Bell size={16} fill="white"/>
                    </div>
                  )}
                  
                  <div onClick={() => openRifaDetail(r)} className="cursor-pointer flex-1 flex items-center gap-4">
                    <img src={r.imagen_url || 'https://via.placeholder.com/150'} className={`w-16 h-16 rounded-2xl object-cover ${r.estado === 'finalizada' ? 'grayscale opacity-50' : ''}`} />
                    <div>
                      <h3 className="font-bold uppercase text-sm">{r.nombre}</h3>
                      <div className="flex gap-2 items-center">
                        <p className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${r.estado === 'finalizada' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{r.estado}</p>
                        {r.tienePendientes && <span className="text-[8px] font-black text-red-600 uppercase">● Pago por revisar</span>}
                      </div>
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
                        className={`aspect-square rounded-lg text-[10px] font-bold border-2 transition-all ${selectedRifa.id_ganador === n.id_numero ? 'bg-yellow-400 border-yellow-600 text-yellow-900 scale-110' : ESTADOS_ADMIN[n.estado].bg + ' ' + ESTADOS_ADMIN[n.estado].border + ' ' + ESTADOS_ADMIN[n.estado].text}`}>
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
                    <div key={c.info?.id_usuario} className={`p-4 rounded-2xl border mb-3 transition-colors ${c.tienePendientes ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-slate-50'}`}>
                      <p className="font-bold text-xs uppercase">{c.info?.nombre} {c.info?.apellido}</p>
                      <p className="text-[10px] text-slate-500">{c.info?.telefono}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.numeros.map(n => (
                          <span key={n.id_numero} className={`text-[9px] font-bold px-2 py-0.5 rounded border ${n.estado === 'apartado' ? 'bg-red-600 text-white border-red-700' : (selectedRifa.id_ganador === n.id_numero ? 'bg-yellow-400 text-yellow-900' : 'bg-white')}`}>
                            #{n.numero}
                          </span>
                        ))}
                      </div>
                      {c.tienePendientes && <button onClick={() => aprobarTodoElCliente(c.info?.id_usuario)} className="w-full mt-2 bg-green-600 text-white text-[9px] font-black py-1 rounded shadow-md">Aprobar Pagos</button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border max-w-2xl mx-auto">
            <button onClick={() => setView('list')} className="mb-6 text-sm font-bold text-slate-400 flex items-center gap-1 hover:text-slate-600 transition-colors"><ChevronLeft size={16}/> Volver al Panel</button>
            <h2 className="text-2xl font-black mb-6 uppercase italic text-blue-600">{view === 'create' ? 'Crear Nueva Rifa' : 'Editar Rifa Actual'}</h2>
            
            <form onSubmit={view === 'create' ? crearRifa : handleEditRifa} className="space-y-6">
              {/* ESTILO DE SUBIDA DE IMAGEN MEJORADO */}
              <div className="relative group">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Imagen de Portada (Premio)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-[2rem] cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all overflow-hidden relative">
                    {imageFile ? (
                      <div className="text-center">
                        <p className="text-blue-600 font-bold text-xs uppercase">{imageFile.name}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="text-slate-400 mb-2" size={24}/>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Click para subir foto</p>
                      </div>
                    )}
                    <input type='file' accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <input type="text" placeholder="Nombre de la Rifa" className="w-full p-4 bg-slate-50 rounded-2xl border outline-none focus:border-blue-500 font-bold" required value={view === 'edit' ? selectedRifa.nombre : newRifa.nombre} onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, nombre: e.target.value}) : setNewRifa({...newRifa, nombre: e.target.value})} />
                
                <textarea placeholder="Describe el premio y condiciones..." className="w-full p-4 bg-slate-50 rounded-2xl border outline-none focus:border-blue-500 text-sm h-32" value={view === 'edit' ? selectedRifa.descripcion : newRifa.descripcion} onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, descripcion: e.target.value}) : setNewRifa({...newRifa, descripcion: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Cantidad Tickets</label>
                    <input type="number" disabled={view === 'edit'} placeholder="Cant." className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" value={view === 'edit' ? selectedRifa.cantidad_numeros : newRifa.cantidad} onChange={e => setNewRifa({...newRifa, cantidad: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Precio x Ticket ($)</label>
                    <input type="number" step="0.01" disabled={view === 'edit'} placeholder="Precio" className="w-full p-4 bg-slate-50 rounded-2xl border font-bold text-green-600" value={view === 'edit' ? selectedRifa.precio : newRifa.precio} onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, precio: parseFloat(e.target.value)}) : setNewRifa({...newRifa, precio: parseFloat(e.target.value)})} />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="text-blue-600" size={16}/>
                    <label className="text-[10px] font-black text-blue-900 uppercase">Fecha de Finalización</label>
                  </div>
                  <input type="date" className="w-full p-4 bg-white rounded-xl border-blue-200 outline-none font-bold" value={view === 'edit' ? selectedRifa.fecha_fin : newRifa.fecha} onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, fecha_fin: e.target.value}) : setNewRifa({...newRifa, fecha: e.target.value})} />
                  <p className="text-[9px] font-bold text-blue-400 mt-2 uppercase italic text-center">Nota: Esta es la fecha en la que se cerrará automáticamente la rifa.</p>
                </div>
              </div>

              <button disabled={loadingAction} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
                {loadingAction ? <Loader2 className="animate-spin mx-auto" /> : (view === 'create' ? 'Publicar Rifa' : 'Guardar Cambios')}
              </button>
            </form>
          </div>
        )}
      </main>

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
            
            <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border">
              <p className="text-xs uppercase font-black text-slate-400">Información del Cliente</p>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Nombre:</p>
                <p className="text-sm font-black uppercase">{numDetail.usuarios?.nombre} {numDetail.usuarios?.apellido}</p>
              </div>
              {/* CORRECCIÓN: Agregar Teléfono en Modal Admin */}
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Teléfono:</p>
                <p className="text-sm font-black text-blue-600">{numDetail.usuarios?.telefono || 'Sin número'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Referencia Pago:</p>
                <p className="text-sm font-black text-slate-700">{numDetail.referencia_pago || 'VENTA MANUAL'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleActionNumber(numDetail.id_numero, 'disponible')} className="bg-red-50 text-red-600 p-3 rounded-xl font-bold uppercase text-[10px] border border-red-100">Liberar Cupo</button>
              {numDetail.estado === 'apartado' && <button onClick={() => handleActionNumber(numDetail.id_numero, 'pagado')} className="bg-green-600 text-white p-3 rounded-xl font-bold uppercase text-[10px] shadow-lg">Confirmar Pago</button>}
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
  const [paymentMethod, setPaymentMethod] = useState(null); 
  const [payData, setPayData] = useState({ ref: '' });

  useEffect(() => { fetchRifas(); }, []);

  const fetchRifas = async () => {
    const { data } = await supabase.from('rifas').select('*').order('creado_en', { ascending: false });
    setRifas(data || []);
  };

  const selectRifa = async (rifa) => {
    setSelectedRifa(rifa);
    // CORRECCIÓN: Al seleccionar rifa, traer info de usuario para el PDF
    const { data } = await supabase.from('numeros')
      .select('*, usuarios(nombre, apellido, telefono)')
      .eq('id_rifa', rifa.id_rifa)
      .order('numero', { ascending: true });
    setNums(data || []);
  };

  // CORRECCIÓN: PDF con toda la información solicitada
  const descargarComprobante = () => {
    const misNums = nums.filter(n => n.comprador_id === userId);
    if(misNums.length === 0) return alert("No tienes tickets en esta rifa.");
    
    const user = misNums[0].usuarios;
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ALEXCAR'S - RIFAS", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text("COMPROBANTE OFICIAL DE PARTICIPACIÓN", 105, 28, { align: 'center' });
    
    // Información del cliente
    doc.setFontSize(11);
    doc.rect(14, 35, 182, 30);
    doc.text(`Participante: ${user?.nombre} ${user?.apellido}`, 20, 45);
    doc.text(`Teléfono: ${user?.telefono}`, 20, 52);
    doc.text(`Rifa: ${selectedRifa.nombre}`, 20, 59);

    // Tabla de Tickets
    autoTable(doc, { 
      startY: 70, 
      head: [['Número Ticket', 'Estado', 'Referencia']], 
      body: misNums.map(n => [`#${n.numero}`, n.estado.toUpperCase(), n.referencia_pago || 'Manual']),
      styles: { halign: 'center' },
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    doc.save(`Tickets_AlexCars_${selectedRifa.nombre}.pdf`);
  };

  const handleConfirmPayment = async () => {
    if(!payData.ref) return alert("Referencia necesaria");
    const { error } = await supabase.from('numeros')
      .update({ 
        estado: 'apartado', 
        comprador_id: userId, 
        referencia_pago: `${paymentMethod === 'pago_movil' ? 'PM' : 'TR'}-${payData.ref}` 
      })
      .in('id_numero', cart);

    if(!error) {
      alert("Pago reportado. En espera de confirmación.");
      setSelectedRifa(null); 
      setCart([]);
      setShowPay(false);
      setPaymentMethod(null);
      fetchRifas();
    }
  };

  const esGanador = selectedRifa?.id_ganador && nums.find(n => n.id_numero === selectedRifa.id_ganador)?.comprador_id === userId;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h1 className="font-black italic text-xl text-blue-600 uppercase tracking-tighter">AlexCar´s - Rifas</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-white bg-red-600 p-2 hover:bg-red-700 rounded-full transition-colors flex items-center gap-2 px-4"><LogOut size={16}/> <span className="text-[10px] font-black uppercase">Salir</span></button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {!selectedRifa ? (
          <div className="space-y-4">
             <div className="mb-4">
              <h2 className="text-2xl font-black uppercase italic text-slate-400">Rifas Disponibles</h2>
              <p className="text-xs font-bold text-slate-300">Selecciona una para participar</p>
            </div>
            {rifas.map(r => (
              <div key={r.id_rifa} onClick={() => selectRifa(r)} className="bg-white p-4 rounded-[2.5rem] shadow-sm flex gap-4 items-center cursor-pointer border-2 border-transparent hover:border-blue-600 relative overflow-hidden transition-all">
                {r.estado === 'finalizada' && <div className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full z-10">CERRADA</div>}
                <img src={r.imagen_url || 'https://via.placeholder.com/150'} className={`w-20 h-20 rounded-3xl object-cover ${r.estado === 'finalizada' && 'grayscale opacity-50'}`} />
                <div>
                  <h3 className="text-lg font-black uppercase italic leading-tight">{r.nombre}</h3>
                  <p className="text-blue-600 font-black">${r.precio} USD</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1"><Calendar size={10}/> Finaliza: {r.fecha_fin || 'TBA'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pb-32">
            <button onClick={() => setSelectedRifa(null)} className="mb-4 text-sm font-bold text-slate-400 flex items-center gap-1 hover:text-slate-600 transition-colors"><ChevronLeft size={16}/> Volver al listado</button>
            
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
              </div>
            )}

            <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm mb-6">
              <h2 className="text-2xl font-black uppercase italic leading-none">{selectedRifa.nombre}</h2>
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><Info size={12}/> Descripción</p>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedRifa.descripcion}</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                 <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase flex items-center gap-2"><Calendar size={12}/> Cierra: {selectedRifa.fecha_fin}</div>
                 <button onClick={descargarComprobante} className="flex items-center gap-2 bg-slate-900 text-white font-black text-[10px] uppercase px-4 py-2 rounded-full hover:bg-slate-800 transition-colors"><Download size={14}/> Mis Tickets (PDF)</button>
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 bg-white p-6 rounded-[2.5rem] border shadow-inner">
              {nums.map(n => {
                const isMine = n.comprador_id === userId;
                const isWinner = selectedRifa.id_ganador === n.id_numero;
                
                // Colores Cliente: Libre = Verde, Propio/Apartado/Pagado = Rojo (Revision/Vendido)
                let colorClass = ESTADOS_CLIENTE[n.estado].bg;
                if (isWinner) colorClass = "bg-yellow-400 text-yellow-900 scale-110";
                else if (cart.includes(n.id_numero)) colorClass = "bg-blue-600 text-white animate-pulse";
                else if (isMine) colorClass = n.estado === 'apartado' ? "bg-red-600 text-white" : "bg-red-500 opacity-60";

                return (
                  <button key={n.id_numero} disabled={selectedRifa.estado === 'finalizada' || (n.estado !== 'disponible' && !isMine)} onClick={() => { if(n.estado === 'disponible') setCart(prev => prev.includes(n.id_numero) ? prev.filter(id => id !== n.id_numero) : [...prev, n.id_numero]); }}
                    className={`aspect-square rounded-2xl text-[10px] font-black border-2 transition-all relative ${colorClass}`}>
                    {n.numero}
                  </button>
                );
              })}
            </div>

            {cart.length > 0 && (
              <div className="fixed bottom-6 left-4 right-4 bg-slate-900 text-white p-6 rounded-[2.5rem] flex justify-between items-center shadow-2xl z-40">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">{cart.length} Tickets</p><p className="text-2xl font-black">${(cart.length * selectedRifa.precio).toFixed(2)}</p></div>
                <button onClick={() => setShowPay(true)} className="bg-blue-600 px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-lg">Pagar</button>
              </div>
            )}
          </div>
        )}
      </main>

      {showPay && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-sm">
            {!paymentMethod ? (
              <div className="space-y-3">
                <h3 className="text-xl font-black mb-4 uppercase text-center italic">¿Cómo deseas pagar?</h3>
                <button onClick={() => setPaymentMethod('pago_movil')} className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 hover:border-blue-500 bg-slate-50"><Smartphone size={24}/><span className="font-black uppercase">Pago Móvil</span></button>
                <button onClick={() => setPaymentMethod('transferencia')} className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 hover:border-green-500 bg-slate-50"><Building2 size={24}/><span className="font-black uppercase">Transferencia</span></button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-black uppercase italic">Datos Bancarios</h3>
                <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2">
                   {paymentMethod === 'pago_movil' ? (
                     <><div>Banco: [BANCO]</div><div>Tel: [04XX-XXXXXXX]</div><div>CI: [XX.XXX.XXX]</div></>
                   ) : (
                     <><div>Banco: [BANCO]</div><div>Cuenta: [XXXX-XXXX-XX-XXXXXXXXXX]</div><div>RIF: [J-XXXXXXXX-X]</div></>
                   )}
                </div>
                <input type="text" placeholder="Nro de Referencia" className="w-full p-4 border rounded-2xl font-black text-center" onChange={e => setPayData({ref: e.target.value})} />
                <button onClick={handleConfirmPayment} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase">Reportar Pago</button>
              </div>
            )}
            <button onClick={() => setShowPay(false)} className="w-full mt-3 text-slate-400 font-black text-[10px] uppercase">Cerrar</button>
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

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 mb-2" size={32}/><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Cargando AlexCar´s...</p></div>;
  if (!session) return <Auth onLogin={setSession} />;
  return role === 'admin' ? <AdminPanel /> : <ClienteView userId={session.user.id} />;
}
