'use client'

import { ShoppingCart, X, Plus, Minus, Trash2, CheckCircle2 } from 'lucide-react'

interface CartItem {
    codigo_barras: string
    nombre: string
    precio_venta: number
    cantidad: number
}

interface CartProps {
    items: CartItem[]
    onUpdateQuantity: (code: string, delta: number) => void
    onRemove: (code: string) => void
    onConfirm: () => void
    onCancel: () => void
    loading: boolean
}

export default function Cart({ items, onUpdateQuantity, onRemove, onConfirm, onCancel, loading }: CartProps) {
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

                <div className="max-height-[40vh] overflow-y-auto space-y-4 custom-scrollbar pr-2">
                    {items.map((item) => (
                        <div key={item.codigo_barras} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-white/5 group">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-white truncate">{item.nombre}</p>
                                <p className="text-xs font-bold text-primary">${item.precio_venta} c/u</p>
                            </div>

                            <div className="flex items-center gap-3 ml-4">
                                <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-white/5">
                                    <button
                                        onClick={() => onUpdateQuantity(item.codigo_barras, -1)}
                                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
                                        disabled={item.cantidad <= 1}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-8 text-center text-sm font-black text-white">{item.cantidad}</span>
                                    <button
                                        onClick={() => onUpdateQuantity(item.codigo_barras, 1)}
                                        className="p-1.5 text-slate-400 hover:text-white"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => onRemove(item.codigo_barras)}
                                    className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest pl-2">Total de Venta</span>
                        <span className="text-4xl font-black text-white tracking-tighter">${total.toLocaleString()}</span>
                    </div>

                    <button
                        disabled={loading}
                        onClick={onConfirm}
                        className="w-full h-20 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-[1.8rem] font-black text-2xl flex items-center justify-center gap-4 active:scale-[0.97] transition-all shadow-[0_15px_40px_rgba(59,130,246,0.4)]"
                    >
                        {loading ? 'MODO ESPERA...' : <><CheckCircle2 size={28} /> CONFIRMAR VENTA</>}
                    </button>
                </div>
            </div>
        </div>
    )
}
