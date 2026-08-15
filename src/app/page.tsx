'use client'

import { useState, useCallback, useEffect } from 'react'
import Scanner from '@/components/Scanner'
import ProductCard from '@/components/ProductCard'
import NewProductForm from '@/components/NewProductForm'
import Cart from '@/components/Cart'
import ShoppingList from '@/components/ShoppingList'
import { supabase } from '@/lib/supabase'
import { Package, ScanLine, ShoppingBag, TrendingUp, AlertCircle, FileText, User, LogOut, Search, Plus, X, Tag, Loader2, Sparkles } from 'lucide-react'
import { procesarVentaMultiple, signOut, getUserProfile, buscarProductos } from '@/app/actions'
import confetti from 'canvas-confetti'

export default function Home() {
  const [profile, setProfile] = useState<any>(null)
  const [producto, setProducto] = useState<any | null>(null)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [todaySales, setTodaySales] = useState(0)
  const [cart, setCart] = useState<any[]>([])
  const [isProcessingCart, setIsProcessingCart] = useState(false)
  const [view, setView] = useState<'scanner' | 'stock'>('scanner')

  // Search & Varios State
  const [posSearchQuery, setPosSearchQuery] = useState('')
  const [posSearchResults, setPosSearchResults] = useState<any[]>([])
  const [isSearchingPos, setIsSearchingPos] = useState(false)
  const [showVariosModal, setShowVariosModal] = useState(false)
  const [variosConcepto, setVariosConcepto] = useState('Varios')
  const [variosPrecio, setVariosPrecio] = useState('')

  const fetchProfile = useCallback(async () => {
    const p = await getUserProfile()
    setProfile(p)
  }, [])

  const fetchTodaySales = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('ventas')
      .select('precio_venta, cantidad')
      .gte('created_at', `${today}T00:00:00Z`)

    const total = data?.reduce((acc: number, curr: any) => acc + (Number(curr.precio_venta) * Number(curr.cantidad || 1)), 0) || 0
    setTodaySales(total)
  }, [])

  useEffect(() => {
    fetchTodaySales()
    fetchProfile()
  }, [fetchTodaySales, fetchProfile])

  const handlePosSearch = async (val: string) => {
    setPosSearchQuery(val)
    if (val.trim().length < 2) {
      setPosSearchResults([])
      return
    }
    setIsSearchingPos(true)
    const res = await buscarProductos(val)
    if (res.success) {
      setPosSearchResults(res.data || [])
    }
    setIsSearchingPos(false)
  }

  const addProductToCart = (prod: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.codigo_barras && item.codigo_barras === prod.codigo_barras)
      if (existing) {
        return prev.map(item =>
          item.codigo_barras === prod.codigo_barras
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      return [...prev, { ...prod, cantidad: 1 }]
    })
    setPosSearchQuery('')
    setPosSearchResults([])
  }

  const addVariosToCart = () => {
    const precio = parseFloat(variosPrecio)
    if (!precio || isNaN(precio) || precio <= 0) {
      alert('Ingresá un precio válido')
      return
    }

    const itemVarios = {
      nombre: variosConcepto.trim() || 'Varios',
      precio_venta: precio,
      cantidad: 1
    }

    setCart(prev => [...prev, itemVarios])
    setVariosPrecio('')
    setVariosConcepto('Varios')
    setShowVariosModal(false)
  }

  const handleScanResult = (data: any | null, code: string) => {
    if (data) {
      // Producto existe, agregar al carrito automáticamente
      addProductToCart(data)
      setScannedCode(null)
      setProducto(null)
    } else {
      // Producto no existe, mostrar opción de registro
      setScannedCode(code)
      setProducto(null)
      setShowForm(false)
    }
  }

  const updateQuantity = (identifier: string, delta: number) => {
    setCart(prev => prev.map(item => {
      const match = item.codigo_barras === identifier || item.nombre === identifier
      if (match) {
        return { ...item, cantidad: Math.max(1, item.cantidad + delta) }
      }
      return item
    }))
  }

  const removeFromCart = (identifier: string) => {
    setCart(prev => prev.filter(item => item.codigo_barras !== identifier && item.nombre !== identifier))
  }

  const confirmCartSale = async (metodoPago: string) => {
    setIsProcessingCart(true)
    const res = await procesarVentaMultiple(
      cart.map(i => ({
        codigo_barras: i.codigo_barras || null,
        nombre: i.nombre,
        cantidad: i.cantidad,
        precio_venta: i.precio_venta
      })),
      metodoPago
    )

    if (res.success) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      })
      setCart([])
      fetchTodaySales()
    } else {
      alert(res.error)
    }
    setIsProcessingCart(false)
  }

  const refreshProducto = useCallback(async () => {
    if (!scannedCode) return
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('codigo_barras', scannedCode)
      .single()
    setProducto(data)
  }, [scannedCode])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 pb-28 selection:bg-primary/30">
      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 h-20 glass flex items-center justify-center z-50 px-6">
        <div className="w-full max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/40 rotate-3 hover:rotate-0 transition-transform">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tighter text-white leading-none">KIOSCO <span className="text-primary italic">VIALE</span></h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Gestión Inteligente</p>
            </div>
          </div>
          <div className="flex flex-col items-end mr-auto ml-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              <TrendingUp className="w-3 h-3 text-primary animate-pulse" />
              <span className="text-xs font-black text-white">${todaySales.toLocaleString()}</span>
            </div>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 mr-1">Hoy</span>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                <User className="w-4 h-4 text-primary" />
                <div className="hidden md:flex flex-col">
                  <span className="text-[10px] font-medium text-white leading-none mb-0.5">{profile.nombre || profile.email}</span>
                  <span className="text-[8px] font-bold text-primary uppercase leading-none">
                    {profile.role === 'owner' ? 'Dueño' : 'Empleado'}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={async () => {
                await signOut();
                window.location.href = '/login';
              }}
              className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="pt-28 px-4 max-w-md mx-auto space-y-8">

        {/* Buscador Manual de Producto & Boton Venta Varios (Siempre Visible en Modo Venta) */}
        {view === 'scanner' && !producto && !showForm && (
          <div className="space-y-3">
            <div className="relative glass rounded-2xl p-2 border-white/10">
              <div className="flex items-center gap-3 px-3">
                <Search className="text-slate-500 w-5 h-5" />
                <input
                  value={posSearchQuery}
                  onChange={(e) => handlePosSearch(e.target.value)}
                  placeholder="Buscar producto por nombre..."
                  className="flex-1 bg-transparent py-2.5 text-white placeholder:text-slate-500 focus:outline-none font-medium text-sm"
                />
                {isSearchingPos && <Loader2 className="animate-spin text-primary w-4 h-4" />}
              </div>

              {posSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl overflow-hidden z-50 border-primary/20 shadow-2xl">
                  {posSearchResults.map(prod => (
                    <button
                      key={prod.codigo_barras}
                      onClick={() => addProductToCart(prod)}
                      className="w-full p-3.5 flex items-center justify-between hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="text-left">
                        <p className="font-bold text-white text-sm">{prod.nombre}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{prod.marca} • Stock: {prod.stock_actual}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-primary text-sm">${prod.precio_venta}</span>
                        <Plus className="text-primary w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Button for Non-Barcode / Custom Sale */}
            <button
              onClick={() => setShowVariosModal(true)}
              className="w-full py-3 px-4 glass rounded-2xl border-dashed border-cyan-500/30 flex items-center justify-center gap-2 text-cyan-400 font-bold text-xs tracking-wider hover:bg-cyan-500/10 transition-all shadow-sm"
            >
              <Tag size={16} /> + VENTA VARIOS / SIN CÓDIGO
            </button>
          </div>
        )}

        {/* Modal Venta Varios / Sin Código */}
        {showVariosModal && (
          <div className="glass rounded-3xl p-6 border-cyan-500/30 space-y-4 animate-in slide-in-from-top-4 duration-300 bg-slate-900/90 shadow-2xl">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Tag size={14} /> Producto sin código / Varios
              </h4>
              <X size={18} className="text-slate-500 cursor-pointer hover:text-white" onClick={() => setShowVariosModal(false)} />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Concepto / Nombre</label>
                <input
                  value={variosConcepto}
                  onChange={e => setVariosConcepto(e.target.value)}
                  placeholder="Ej. Cigarrillos sueltos, Helado, Fotocopia"
                  className="w-full bg-slate-950/60 rounded-xl p-3.5 border border-white/10 text-white focus:border-cyan-500/50 outline-none font-medium text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Precio de Venta ($)</label>
                <input
                  type="number"
                  value={variosPrecio}
                  onChange={e => setVariosPrecio(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full bg-slate-950/60 rounded-xl p-3.5 border border-white/10 text-white focus:border-cyan-500/50 outline-none font-bold text-lg text-cyan-400"
                />
              </div>
            </div>

            <button
              onClick={addVariosToCart}
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-cyan-600/20"
            >
              AGREGAR AL CARRITO
            </button>
          </div>
        )}

        {!producto && !showForm && cart.length === 0 && (
          <div className="space-y-6 text-center animate-in fade-in duration-700">
            <div className="inline-flex p-4 bg-primary/10 rounded-3xl border border-primary/20">
              <ScanLine className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-2">Punto de Venta</h2>
              <p className="text-slate-400 text-sm">Escaneá o buscá productos para vender</p>
            </div>
            <Scanner onResult={handleScanResult} isPaused={showForm || isProcessingCart || showVariosModal} />
          </div>
        )}

        {cart.length > 0 && !showForm && view === 'scanner' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-6">
              <div className="glass rounded-3xl p-4 flex items-center justify-between border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3 pl-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                  <span className="text-xs font-black uppercase tracking-widest text-primary">Cámara Activa</span>
                </div>
                <button
                  onClick={() => setCart([])}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-1.5 hover:text-white transition-colors"
                >
                  Vaciar Todo
                </button>
              </div>
              <Scanner onResult={handleScanResult} isPaused={showForm || isProcessingCart || showVariosModal} />
            </div>

            <Cart
              items={cart}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              onConfirm={confirmCartSale}
              onCancel={() => setCart([])}
              loading={isProcessingCart}
            />
          </div>
        )}

        {producto && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <button
                onClick={() => { setProducto(null); setScannedCode(null); }}
                className="text-primary font-bold flex items-center gap-1"
              >
                <ScanLine size={18} /> Volver a escanear
              </button>
              <div className="text-xs font-mono text-slate-500">ID: {scannedCode}</div>
            </div>
            <ProductCard
              producto={producto}
              onUpdate={() => {
                refreshProducto()
                fetchTodaySales()
              }}
            />
          </div>
        )}

        {!producto && scannedCode && !showForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Producto no encontrado</h3>
              <p className="text-slate-400">El código <code className="text-primary">{scannedCode}</code> no está registrado.</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="w-full h-14 bg-primary text-white rounded-2xl font-black text-lg shadow-lg shadow-primary/20"
            >
              REGISTRAR PRODUCTO NUEVO
            </button>
            <button
              onClick={() => { setScannedCode(null); }}
              className="text-slate-500 font-medium"
            >
              Cancelar
            </button>
          </div>
        )}

        {showForm && scannedCode && (
          <NewProductForm
            codigoDefault={scannedCode}
            onCancel={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false)
              refreshProducto()
            }}
          />
        )}

        {view === 'stock' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black text-white tracking-tighter">Inventario</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Control de Mercadería</p>
            </div>
            <ShoppingList />
          </div>
        )}
      </div>

      {/* Bottom Navigation Glass */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-20 glass rounded-[2rem] flex items-center justify-around px-8 z-50 shadow-2xl border-white/10">
        <button
          onClick={() => setView('scanner')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${view === 'scanner' ? 'text-primary scale-110' : 'text-slate-500 opacity-60'}`}
        >
          <div className={`p-2 ${view === 'scanner' ? 'bg-primary/10 rounded-xl' : ''}`}>
            <ScanLine size={22} strokeWidth={view === 'scanner' ? 3 : 2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Ventas</span>
        </button>

        <button
          onClick={() => setView('stock')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${view === 'stock' ? 'text-primary scale-110' : 'text-slate-500 opacity-60'}`}
        >
          <div className={`p-2 ${view === 'stock' ? 'bg-primary/10 rounded-xl' : ''}`}>
            <Package size={22} strokeWidth={view === 'stock' ? 3 : 2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Stock</span>
        </button>
      </nav>
    </main>
  )
}

