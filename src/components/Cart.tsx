'use client'

import { useState } from 'react'
import { ShoppingCart, X, Plus, Minus, Trash2, CheckCircle2, Banknote, QrCode, CreditCard } from 'lucide-react'

interface CartItem {
    codigo_barras?: string
    nombre: string
    precio_venta: number
    cantidad: number
}

interface CartProps {
    items: CartItem[]
    onUpdateQuantity: (codeOrName: string, delta: number) => void
    onRemove: (codeOrName: string) => void
    onConfirm: (metodoPago: string) => void
    onCancel: () => void
    loading: boolean
}

export default function Cart({ items, onUpdateQuantity, onRemove, onConfirm, onCancel, loading }: CartProps) {
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'mercadopago' | 'tarjeta'>('efectivo')
    const total = items.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0)

    if (items.length === 0) return null

    return (
        <div className="w-full max-w-md mx-auto glass rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-xl">
                            <ShoppingCart className="text-primary w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight">Carrito ({items.length})</h3>
                    </div>
                    <button onClick={onCancel} className="p-2 text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[35vh] overflow-y-auto space-y-4 custom-scrollbar pr-2">
                    {items.map((item, idx) => {
                        const key = item.codigo_barras || `${item.nombre}-${idx}`
                        const identifier = item.codigo_barras || item.nombre
                        return (
                            <div key={key} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-white/5 group">
                                <div className="flex-1 min-w-0 pr-2">
                                    <p className="text-sm font-black text-white truncate">{item.nombre}</p>
                                    <p className="text-xs font-bold text-primary">${item.precio_venta} c/u</p>
                                </div>

                                <div className="flex items-center gap-3 ml-2">
                                    <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-white/5">
                                        <button
                                            onClick={() => onUpdateQuantity(identifier, -1)}
                                            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
                                            disabled={item.cantidad <= 1}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center text-sm font-black text-white">{item.cantidad}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(identifier, 1)}
                                            className="p-1.5 text-slate-400 hover:text-white"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => onRemove(identifier)}
                                        className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Seleccion de Medio de Pago */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Medio de Pago</p>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setMetodoPago('efectivo')}
                            className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${metodoPago === 'efectivo'
                                ? 'bg-green-500/20 border-green-500 text-green-400 font-bold shadow-lg shadow-green-500/10'
                                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20'
                                }`}
                        >
                            <Banknote size={20} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Efectivo</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMetodoPago('mercadopago')}
                            className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${metodoPago === 'mercadopago'
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-bold shadow-lg shadow-cyan-500/10'
                                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20'
                                }`}
                        >
                            <QrCode size={20} />
                            <span className="text-[10px] font-black uppercase tracking-wider">MP / QR</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMetodoPago('tarjeta')}
                            className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${metodoPago === 'tarjeta'
                                ? 'bg-purple-500/20 border-purple-500 text-purple-400 font-bold shadow-lg shadow-purple-500/10'
                                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20'
                                }`}
                        >
                            <CreditCard size={20} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Tarjeta</span>
                        </button>
                    </div>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest pl-2">Total de Venta</span>
                        <span className="text-4xl font-black text-white tracking-tighter">${total.toLocaleString()}</span>
                    </div>

                    <button
                        disabled={loading}
                        onClick={() => onConfirm(metodoPago)}
                        className="w-full h-20 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-[1.8rem] font-black text-2xl flex items-center justify-center gap-4 active:scale-[0.97] transition-all shadow-[0_15px_40px_rgba(59,130,246,0.4)]"
                    >
                        {loading ? 'PROCESANDO VENTA...' : <><CheckCircle2 size={28} /> CONFIRMAR VENTA</>}
                    </button>
                </div>
            </div>
        </div>
    )
}
