'use client'

import { useState, useCallback, useEffect } from 'react'
import Scanner from '@/components/Scanner'
import ProductCard from '@/components/ProductCard'
import NewProductForm from '@/components/NewProductForm'
import Cart from '@/components/Cart'
import { supabase } from '@/lib/supabase'
import { Package, ScanLine, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react'
import { procesarVentaMultiple } from '@/app/actions'
import confetti from 'canvas-confetti'

export default function Home() {
  const [producto, setProducto] = useState<any | null>(null)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [todaySales, setTodaySales] = useState(0)
  const [cart, setCart] = useState<any[]>([])
  const [isProcessingCart, setIsProcessingCart] = useState(false)

  const fetchTodaySales = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('ventas')
      .select('precio_venta')
      .gte('created_at', `${today}T00:00:00Z`)

    const total = data?.reduce((acc: number, curr: any) => acc + Number(curr.precio_venta), 0) || 0
    setTodaySales(total)
  }, [])

  useEffect(() => {
    fetchTodaySales()
  }, [fetchTodaySales])

  const handleScanResult = (data: any | null, code: string) => {
    if (data) {
      // Producto existe, agregar al carrito automáticamente o mostrar tarjeta
      setCart(prev => {
        const existing = prev.find(item => item.codigo_barras === data.codigo_barras)
        if (existing) {
          return prev.map(item =>
            item.codigo_barras === data.codigo_barras
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          )
        }
        return [...prev, { ...data, cantidad: 1 }]
      })
      setScannedCode(null)
      setProducto(null)
    } else {
      // Producto no existe, mostrar opción de registro
      setScannedCode(code)
      setProducto(null)
      setShowForm(false)
    }
  }

  const updateQuantity = (code: string, delta: number) => {
    setCart(prev => prev.map(item =>
      item.codigo_barras === code
        ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
        : item
    ))
  }

  const removeFromCart = (code: string) => {
    setCart(prev => prev.filter(item => item.codigo_barras !== code))
  }

  const confirmCartSale = async () => {
    setIsProcessingCart(true)
    const res = await procesarVentaMultiple(cart.map(i => ({
      codigo_barras: i.codigo_barras,
      cantidad: i.cantidad,
      precio_venta: i.precio_venta
    })))

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
        <div className="w-full max-w-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/40 rotate-3 hover:rotate-0 transition-transform">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white leading-none">KIOSCO <span className="text-primary italic">VIALE</span></h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Gestión Inteligente</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              <TrendingUp className="w-3 h-3 text-primary animate-pulse" />
              <span className="text-xs font-black text-white">${todaySales.toLocaleString()}</span>
            </div>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 mr-1">Hoy</span>
          </div>
        </div>
      </header>

      <div className="pt-28 px-4 max-w-md mx-auto space-y-10">
        {!producto && !showForm && cart.length === 0 && (
          <div className="space-y-6 text-center animate-in fade-in duration-700">
            <div className="inline-flex p-4 bg-primary/10 rounded-3xl border border-primary/20">
              <ScanLine className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-2">Punto de Venta</h2>
              <p className="text-slate-400">Escaneá productos para vender</p>
            </div>
            <Scanner onResult={handleScanResult} isPaused={showForm || isProcessingCart} />
          </div>
        )}

        {cart.length > 0 && !showForm && (
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
              <Scanner onResult={handleScanResult} isPaused={showForm || isProcessingCart} />
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
      </div>

      {/* Bottom Navigation Glass */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-20 glass rounded-[2rem] flex items-center justify-around px-8 z-50 shadow-2xl border-white/10">
        <div className="flex flex-col items-center gap-1.5 text-primary scale-110">
          <div className="p-2 bg-primary/10 rounded-xl">
            <ScanLine size={22} strokeWidth={3} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Ventas</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-slate-500 opacity-60">
          <div className="p-2">
            <Package size={22} strokeWidth={2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Stock</span>
        </div>
      </nav>
    </main>
  )
}
