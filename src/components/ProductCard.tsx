'use client'

import { useState } from 'react'
import { ShoppingCart, Truck, Edit3, Save, X, Plus, Minus } from 'lucide-react'
import { descontarStock, recargarStock, editarPrecio } from '@/app/actions'
import confetti from 'canvas-confetti'

interface Producto {
    codigo_barras: string
    nombre: string
    marca: string
    precio_costo: number
    precio_venta: number
    stock_actual: number
    stock_minimo: number
    proveedor: string
}

export default function ProductCard({ producto, onUpdate }: { producto: Producto, onUpdate: () => void }) {
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'mercadopago' | 'tarjeta'>('efectivo')
    const [isEditingPrice, setIsEditingPrice] = useState(false)
    const [newPrice, setNewPrice] = useState(producto.precio_venta)
    const [recargaAmount, setRecargaAmount] = useState(0)
    const [isRecargando, setIsRecargando] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleVenta = async () => {
        setLoading(true)
        const res = await descontarStock(producto.codigo_barras, metodoPago)
        if (res.success) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#ffffff', '#60a5fa']
            })
            onUpdate()
        }
        else alert(res.error)
        setLoading(false)
    }

    const handleRecarga = async () => {
        if (recargaAmount <= 0) return
        setLoading(true)
        const res = await recargarStock(producto.codigo_barras, recargaAmount)
        if (res.success) {
            setIsRecargando(false)
            setRecargaAmount(0)
            onUpdate()
        }
        setLoading(false)
    }

    const handleUpdatePrice = async () => {
        setLoading(true)
        const res = await editarPrecio(producto.codigo_barras, newPrice)
        if (res.success) {
            setIsEditingPrice(false)
            onUpdate()
        }
        setLoading(false)
    }

    return (
        <div className="w-full max-w-md mx-auto glass rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="p-8 space-y-8">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                        <h3 className="text-3xl font-black text-white tracking-tight leading-tight">{producto.nombre}</h3>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-slate-800 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                {producto.marca}
                            </span>
                            <span className="text-slate-500 text-xs font-medium">| {producto.proveedor}</span>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        {isEditingPrice ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                                    className="w-24 bg-slate-800 border border-primary text-white text-xl font-bold rounded-lg px-2 py-1 outline-none"
                                />
                                <button onClick={handleUpdatePrice} className="p-2 bg-primary text-white rounded-lg"><Save size={20} /></button>
                                <button onClick={() => setIsEditingPrice(false)} className="p-2 bg-slate-800 text-slate-400 rounded-lg"><X size={20} /></button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-end">
                                <p className="text-3xl font-black text-primary">${producto.precio_venta}</p>
                                <button onClick={() => setIsEditingPrice(true)} className="flex items-center gap-1 text-slate-500 text-sm hover:text-white transition-colors mt-1">
                                    <Edit3 size={12} /> Editar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border ${producto.stock_actual <= producto.stock_minimo ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Stock Actual</p>
                        <p className={`text-2xl font-black ${producto.stock_actual <= producto.stock_minimo ? 'text-red-500' : 'text-white'}`}>
                            {producto.stock_actual} <span className="text-sm font-normal text-slate-500">unids</span>
                        </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Costo</p>
                        <p className="text-2xl font-black text-slate-300">${producto.precio_costo}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        disabled={loading || producto.stock_actual <= 0}
                        onClick={handleVenta}
                        className="group w-full h-20 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:bg-slate-700 text-white rounded-3xl font-black text-2xl flex items-center justify-center gap-4 active:scale-[0.97] transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.4)]"
                    >
                        <ShoppingCart size={28} className="group-active:scale-110 transition-transform" />
                        <span>VENTA (-1)</span>
                    </button>

                    {!isRecargando ? (
                        <button
                            disabled={loading}
                            onClick={() => setIsRecargando(true)}
                            className="w-full h-16 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-3xl font-bold flex items-center justify-center gap-3 transition-all border border-white/5 active:scale-[0.98]"
                        >
                            <Truck size={20} className="text-slate-400" /> RECARGAR STOCK
                        </button>
                    ) : (
                        <div className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300">
                            <input
                                type="number"
                                placeholder="Cantidad"
                                value={recargaAmount || ''}
                                onChange={(e) => setRecargaAmount(parseInt(e.target.value))}
                                className="flex-1 bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 text-white font-bold outline-none focus:border-primary transition-colors"
                                autoFocus
                            />
                            <button
                                onClick={handleRecarga}
                                className="px-8 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black transition-colors"
                            >
                                OK
                            </button>
                            <button
                                onClick={() => setIsRecargando(false)}
                                className="p-4 bg-slate-800 text-slate-400 rounded-2xl"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
