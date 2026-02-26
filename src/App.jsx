import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LogOut, Plus, Ticket, X, CheckCircle2, Loader2, CreditCard, 
  User, Phone, ChevronLeft, Trash2, Download, Eye, EyeOff, FileText, Image as ImageIcon, Edit3, Printer
} from 'lucide-react';

// Librerías para documentos
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
        <p className="text-center text-slate-400 text-xs mb-8 font-bold uppercase tracking-widest">Plataforma de Sorteos</p>
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Nombre" required className="p-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-500 transition-all" onChange={e => setFormData({...formData, nombre: e.target.value})} />
              <input type="text" placeholder="Apellido" required className="p-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-500 transition-all" onChange={e => setFormData({...formData, apellido: e.target.value})} />
            </div>
          )}
          <input type="tel" placeholder="Teléfono" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-500 transition-all" onChange={e => setFormData({...formData, telefono: e.target.value})} />
          <input type="password" placeholder="Contraseña" required className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-500 transition-all" onChange={e => setFormData({...formData, password: e.target.value})} />
          <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (isRegistering ? 'Crear Cuenta' : 'Entrar')}
          </button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center mt-6 text-xs font-black text-slate-400 uppercase hover:text-blue-600 transition-all">
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
  const [manualData, setManualData] = useState({ 
    numeros: '', nombre: '', apellido: '', telefono: '', estado: 'apartado' 
  });

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

  const clientesAgrupados = numsRifa.reduce((acc, n) => {
    if (n.comprador_id) {
      const id = n.comprador_id;
      if (!acc[id]) {
        acc[id] = {
          info: n.usuarios,
          numeros: [],
          tienePendientes: false
        };
      }
      acc[id].numeros.push(n);
      if (n.estado === 'apartado') acc[id].tienePendientes = true;
    }
    return acc;
  }, {});

  // --- FUNCIÓN EXCEL ADMIN ---
  const exportarExcel = () => {
    const dataParaExcel = [];
    Object.values(clientesAgrupados).forEach(cliente => {
      cliente.numeros.forEach(num => {
        dataParaExcel.push({
          Rifa: selectedRifa.nombre,
          Nombre: cliente.info?.nombre,
          Apellido: cliente.info?.apellido,
          Telefono: cliente.info?.telefono,
          Numero_Ticket: num.numero,
          Estado: num.estado,
          Referencia: num.referencia_pago
        });
      });
    });

    if (dataParaExcel.length === 0) return alert("No hay datos para exportar.");

    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participantes");
    XLSX.writeFile(wb, `Reporte_Rifa_${selectedRifa.nombre}.xlsx`);
  };

  const aprobarTodoElCliente = async (clienteId) => {
    if(!window.confirm("¿Aprobar todos los números pendientes de este cliente?")) return;
    setLoadingAction(true);
    const { error } = await supabase
      .from('numeros')
      .update({ estado: 'pagado' })
      .eq('id_rifa', selectedRifa.id_rifa)
      .eq('comprador_id', clienteId)
      .eq('estado', 'apartado');
    
    if(!error) openRifaDetail(selectedRifa);
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

      alert("Rifa creada");
      setView('list');
      fetchRifas();
      calculateStats();
      setImageFile(null);
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

  const handleActionNumber = async (numId, nuevoEstado) => {
    const updateData = nuevoEstado === 'disponible' 
      ? { estado: 'disponible', comprador_id: null, referencia_pago: null } 
      : { estado: 'pagado' };
    
    await supabase.from('numeros').update(updateData).eq('id_numero', numId);
    openRifaDetail(selectedRifa);
    setNumDetail(null);
    calculateStats();
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
        estado: manualData.estado, comprador_id: clienteId, referencia_pago: 'VENTA_MANUAL'
      }).eq('id_rifa', selectedRifa.id_rifa).in('numero', numerosArray);
      if (updateError) throw updateError;
      alert("Asignación completada");
      setShowManualAssign(false);
      openRifaDetail(selectedRifa);
      calculateStats();
    } catch (err) { alert("Error: " + err.message); }
    finally { setLoadingAction(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800">
      <nav className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <h1 className="font-black italic text-xl text-blue-600">RIFAPRO ADMIN</h1>
        <button onClick={async () => { await supabase.auth.signOut(); }} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all">
          <LogOut size={22}/>
        </button>
      </nav>

      <main className="p-4 max-w-[1400px] mx-auto">
        {view === 'list' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-3xl border shadow-sm"><p className="text-[9px] font-bold text-slate-400 uppercase">Recaudado</p><p className="text-xl font-black text-green-600">${stats.recaudado}</p></div>
              <div className="bg-white p-4 rounded-3xl border shadow-sm"><p className="text-[9px] font-bold text-slate-400 uppercase">Vendidos</p><p className="text-xl font-black text-blue-600">{stats.vendidos}</p></div>
              <div className="bg-white p-4 rounded-3xl border shadow-sm"><p className="text-[9px] font-bold text-slate-400 uppercase">Pendientes</p><p className="text-xl font-black text-yellow-500">{stats.pendientes}</p></div>
            </div>

            <button onClick={() => setView('create')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all"><Plus/> Nueva Rifa</button>
            
            <div className="grid gap-4">
              {rifas.map(r => (
                <div key={r.id_rifa} className="bg-white p-4 rounded-3xl shadow-sm border flex items-center gap-4">
                  {r.imagen_url ? (
                    <img src={r.imagen_url} className="w-16 h-16 rounded-2xl object-cover bg-slate-100" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300"><ImageIcon size={24}/></div>
                  )}
                  <div onClick={() => openRifaDetail(r)} className="cursor-pointer flex-1">
                    <h3 className="font-bold uppercase text-sm leading-tight">{r.nombre}</h3>
                    <p className="text-[10px] text-slate-400">Finaliza: {r.fecha_fin}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedRifa(r); setView('edit'); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-all"><Edit3 size={18}/></button>
                    <button onClick={async () => { if(window.confirm("¿Borrar rifa?")) { await supabase.from('rifas').delete().eq('id_rifa', r.id_rifa); fetchRifas(); calculateStats(); } }} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'detail' && selectedRifa && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <button onClick={() => setView('list')} className="flex items-center gap-1 text-sm font-bold text-slate-400"><ChevronLeft size={16}/> Volver</button>
                <div className="flex gap-2">
                  <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:bg-green-700 transition-all">
                    <FileText size={14}/> Reporte Excel
                  </button>
                  <button onClick={() => setShowManualAssign(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"><Plus size={14}/> Venta Manual</button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-2/3 space-y-4">
                <div className="bg-white p-6 rounded-3xl border shadow-sm flex gap-4 items-center">
                    {selectedRifa.imagen_url && <img src={selectedRifa.imagen_url} className="w-14 h-14 rounded-xl object-cover" />}
                    <h2 className="text-xl font-black uppercase italic">{selectedRifa.nombre}</h2>
                </div>
                
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
                    {numsRifa.map(n => (
                      <button key={n.id_numero} onClick={() => n.estado !== 'disponible' && setNumDetail(n)}
                        className={`aspect-square rounded-lg text-[10px] font-bold border-2 transition-all ${ESTADOS[n.estado].bg} ${ESTADOS[n.estado].border} ${ESTADOS[n.estado].text}`}>
                        {n.numero}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3">
                <div className="bg-white p-6 rounded-3xl border shadow-sm sticky top-24 max-h-[80vh] overflow-y-auto">
                  <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Participantes</h3>
                  <div className="space-y-4">
                    {Object.values(clientesAgrupados).map((item) => (
                      <div key={item.info?.id_usuario} className={`p-4 rounded-2xl border-2 transition-all ${item.tienePendientes ? 'border-yellow-200 bg-yellow-50/30 shadow-sm' : 'border-slate-100'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div><p className="font-bold text-sm uppercase leading-tight">{item.info?.nombre} {item.info?.apellido}</p><p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5"><Phone size={10}/> {item.info?.telefono}</p></div>
                          {item.tienePendientes && (<button onClick={() => aprobarTodoElCliente(item.info?.id_usuario)} className="bg-green-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-sm hover:bg-green-700 uppercase">Aprobar Todo</button>)}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.numeros.map(n => (<span key={n.id_numero} className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${n.estado === 'apartado' ? 'bg-yellow-400 text-yellow-900 animate-pulse' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>#{n.numero}</span>))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border max-w-2xl mx-auto">
            <button onClick={() => setView('list')} className="mb-4 flex items-center gap-1 text-sm font-bold text-slate-400"><ChevronLeft size={16}/> Volver</button>
            <h2 className="text-xl font-black mb-4 uppercase italic">{view === 'create' ? 'Nueva Rifa' : 'Editar Rifa'}</h2>
            <form onSubmit={view === 'create' ? crearRifa : handleEditRifa} className="space-y-4">
              <div className="flex justify-center">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-slate-50 text-blue-500 rounded-3xl border-2 border-dashed border-blue-200 cursor-pointer hover:bg-blue-50">
                  <ImageIcon size={32} className="mb-2"/><span className="text-[10px] font-black uppercase tracking-tight">{imageFile ? imageFile.name : 'Subir Foto'}</span>
                  <input type='file' accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
                </label>
              </div>
              <input type="text" placeholder="Nombre" className="w-full p-3 bg-slate-50 rounded-xl border outline-none" required 
                value={view === 'edit' ? selectedRifa.nombre : newRifa.nombre}
                onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, nombre: e.target.value}) : setNewRifa({...newRifa, nombre: e.target.value})} />
              <textarea placeholder="Descripción" className="w-full p-3 bg-slate-50 rounded-xl border outline-none" 
                value={view === 'edit' ? selectedRifa.descripcion : newRifa.descripcion}
                onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, descripcion: e.target.value}) : setNewRifa({...newRifa, descripcion: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" disabled={view === 'edit'} className="w-full p-3 bg-slate-50 rounded-xl border" value={view === 'edit' ? selectedRifa.cantidad_numeros : newRifa.cantidad} onChange={e => setNewRifa({...newRifa, cantidad: e.target.value})} />
                <input type="number" step="0.01" disabled={view === 'edit'} className="w-full p-3 bg-slate-50 rounded-xl border" value={view === 'edit' ? selectedRifa.precio : newRifa.precio} onChange={e => setNewRifa({...newRifa, precio: parseFloat(e.target.value)})} />
              </div>
              <input type="date" className="w-full p-3 bg-slate-50 rounded-xl border font-bold" value={view === 'edit' ? selectedRifa.fecha_fin : newRifa.fecha} onChange={e => view === 'edit' ? setSelectedRifa({...selectedRifa, fecha_fin: e.target.value}) : setNewRifa({...newRifa, fecha: e.target.value})} />
              <button disabled={loadingAction} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase">{loadingAction ? <Loader2 className="animate-spin" /> : 'Confirmar'}</button>
            </form>
          </div>
        )}
      </main>

      {/* Modal Venta Manual */}
      {showManualAssign && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-[2.5rem] w-full max-w-md">
            <div className="flex justify-between mb-6"><h3 className="text-xl font-black uppercase italic">Venta Directa</h3><button onClick={() => setShowManualAssign(false)}><X/></button></div>
            <form onSubmit={handleManualAssignment} className="space-y-4">
              <input type="text" required placeholder="Números (Ej: 1, 5, 20)" className="w-full p-3 bg-slate-50 rounded-xl border" onChange={e => setManualData({...manualData, numeros: e.target.value})} />
              <div className="grid grid-cols-2 gap-3"><input type="text" placeholder="Nombre" required className="p-3 bg-slate-50 rounded-xl border" onChange={e => setManualData({...manualData, nombre: e.target.value})} /><input type="text" placeholder="Apellido" required className="p-3 bg-slate-50 rounded-xl border" onChange={e => setManualData({...manualData, apellido: e.target.value})} /></div>
              <input type="tel" placeholder="Teléfono" required className="w-full p-3 bg-slate-50 rounded-xl border" onChange={e => setManualData({...manualData, telefono: e.target.value})} />
              <select className="w-full p-3 bg-slate-50 rounded-xl border font-bold" onChange={e => setManualData({...manualData, estado: e.target.value})}><option value="apartado">🟡 REVISIÓN</option><option value="pagado">🔴 VENDIDO</option></select>
              <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase text-xs">Confirmar</button>
            </form>
          </div>
        </div>
      )}

      {/* Detalle Ticket Individual */}
      {numDetail && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm">
            <div className="flex justify-between mb-4"><h3 className="text-2xl font-black italic uppercase">Ticket #{numDetail.numero}</h3><button onClick={() => setNumDetail(null)}><X/></button></div>
            <div className="space-y-3 mb-6"><p className="text-sm"><strong>Cliente:</strong> {numDetail.usuarios?.nombre} {numDetail.usuarios?.apellido}</p><p className="text-sm"><strong>Ref:</strong> {numDetail.referencia_pago || 'S/N'}</p></div>
            <div className="grid grid-cols-2 gap-2"><button onClick={() => handleActionNumber(numDetail.id_numero, 'disponible')} className="bg-red-50 text-red-600 p-3 rounded-xl font-bold text-xs uppercase">Liberar</button>{numDetail.estado === 'apartado' && (<button onClick={() => handleActionNumber(numDetail.id_numero, 'pagado')} className="bg-green-600 text-white p-3 rounded-xl font-bold text-xs uppercase">Confirmar Pago</button>)}</div>
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

  // --- FUNCIÓN PDF CLIENTE ---
  const descargarComprobante = () => {
    const misNumeros = nums.filter(n => n.comprador_id === userId);
    if (misNumeros.length === 0) return alert("No tienes números en esta rifa.");

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text("RIFAPRO - COMPROBANTE", 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(50);
    doc.text(selectedRifa.nombre, 105, 30, { align: 'center' });

    const rows = misNumeros.map(n => [`#${n.numero}`, n.estado.toUpperCase(), n.referencia_pago || 'N/A']);
    
    doc.autoTable({
      startY: 40,
      head: [['Ticket', 'Estado', 'Referencia']],
      body: rows,
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`Tickets_${selectedRifa.nombre}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h1 className="font-black italic text-xl tracking-tighter text-blue-600">RIFAPRO</h1>
        <button onClick={async () => { await supabase.auth.signOut(); }} className="p-2 text-slate-300 hover:text-red-500">
          <LogOut size={20}/>
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {!selectedRifa ? (
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Sorteos Activos</h2>
            {rifas.map(r => (
              <div key={r.id_rifa} onClick={() => selectRifa(r)} className="bg-white p-4 rounded-[2.5rem] border-2 border-transparent hover:border-blue-600 cursor-pointer shadow-sm flex gap-4 items-center transition-all group">
                <img src={r.imagen_url || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-[2rem] object-cover bg-slate-50 shadow-md" />
                <div className="flex-1">
                  <h3 className="text-lg font-black uppercase italic leading-none">{r.nombre}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 mb-2 line-clamp-1">{r.descripcion}</p>
                  <div className="text-blue-600 font-black text-sm">${r.precio} USD</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pb-32">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setSelectedRifa(null)} className="flex items-center gap-1 font-bold text-slate-400 text-sm"><ChevronLeft size={16}/> Volver</button>
              <div className="flex gap-2">
                {nums.some(n => n.comprador_id === userId) && (
                  <button onClick={descargarComprobante} className="flex items-center gap-2 bg-white border px-4 py-2 rounded-full text-[10px] font-black uppercase text-blue-600 shadow-sm">
                    <Download size={14}/> Mis Tickets
                  </button>
                )}
                <button 
                  onClick={() => setHideSold(!hideSold)} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${hideSold ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border'}`}>
                  {hideSold ? <Eye size={14}/> : <EyeOff size={14}/>} {hideSold ? 'Ver Todo' : 'Limpiar'}
                </button>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-[2.5rem] border mb-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-6 bg-blue-100 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full border border-blue-200">${selectedRifa.precio} USD</div>
              <h2 className="text-2xl font-black uppercase italic leading-tight">{selectedRifa.nombre}</h2>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{selectedRifa.descripcion}</p>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 bg-white p-6 rounded-[2.5rem] border shadow-inner">
              {nums.map(n => {
                const isMine = n.comprador_id === userId;
                const isSelected = cart.includes(n.id_numero);
                if (hideSold && n.estado !== 'disponible' && !isMine) return null;
                return (
                  <button key={n.id_numero} disabled={n.estado !== 'disponible' && !isMine} onClick={() => { if(n.estado === 'disponible') setCart(prev => prev.includes(n.id_numero) ? prev.filter(id => id !== n.id_numero) : [...prev, n.id_numero]); }}
                    className={`aspect-square rounded-2xl text-[10px] font-black border-2 transition-all relative ${isMine ? 'bg-blue-600 border-blue-800 text-white shadow-lg z-10 scale-105' : n.estado === 'pagado' ? 'bg-red-500 border-red-600 text-white opacity-40 grayscale-[0.5]' : n.estado === 'apartado' ? 'bg-yellow-400 border-yellow-500 text-yellow-900 opacity-60' : isSelected ? 'bg-slate-900 border-black text-white' : 'bg-green-500 border-green-600 text-white hover:bg-green-400'}`}>
                    {n.numero}
                    {isMine && <div className="absolute -top-1 -right-1 bg-white text-blue-600 rounded-full border border-blue-600 p-0.5"><CheckCircle2 size={10}/></div>}
                  </button>
                );
              })}
            </div>

            {cart.length > 0 && (
              <div className="fixed bottom-6 left-4 right-4 bg-slate-900 text-white p-6 rounded-[2.5rem] flex justify-between items-center shadow-2xl z-40">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cart.length} Tickets</p><p className="text-2xl font-black">${(cart.length * selectedRifa.precio).toFixed(2)}</p></div>
                <button onClick={() => setShowPay(true)} className="bg-blue-600 px-8 py-4 rounded-2xl font-black uppercase text-xs hover:bg-blue-500 shadow-xl">Pagar</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL PAGO */}
      {showPay && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] w-full max-sm:p-6 w-full max-w-sm">
            <h3 className="text-2xl font-black mb-4 uppercase italic text-blue-600">Pagar</h3>
            <div className="bg-blue-50 p-5 rounded-2xl mb-5 text-[11px] text-blue-800 leading-relaxed border border-blue-100 font-bold uppercase text-center">Transfiere a:<br/>BANCO CENTRAL<br/>0412-0000000 / V-12345678</div>
            <input type="text" maxLength="4" placeholder="Últimos 4 dígitos Ref." className="w-full p-5 bg-slate-50 border-2 rounded-2xl mb-5 font-black text-center outline-none focus:border-blue-500 text-lg" onChange={e => setPayData({ref: e.target.value})} />
            <button onClick={async () => { if(!payData.ref) return alert("Ingresa referencia"); const { error } = await supabase.from('numeros').update({ estado: 'apartado', comprador_id: userId, referencia_pago: payData.ref }).in('id_numero', cart); if(!error) { alert("¡Pago enviado!"); setSelectedRifa(null); setShowPay(false); } }} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-xs shadow-xl transition-all hover:bg-blue-700">Confirmar Reporte</button>
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
