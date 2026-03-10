'use client'

import { useState } from 'react'
import { registrarProducto } from '@/app/actions'
import { Save, X, PlusCircle } from 'lucide-react'

interface NewProductFormProps {
    codigoDefault: string
    onCancel: () => void
    onSuccess: () => void
}

export default function NewProductForm({ codigoDefault, onCancel, onSuccess }: NewProductFormProps) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const res = await registrarProducto(formData)
        if (res.success) onSuccess()
        else alert(res.error)
        setLoading(false)
    }

    return (
        <div className="w-full max-w-md mx-auto glass rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-primary/20 rounded-2xl shadow-inner">
                    <PlusCircle className="text-primary w-7 h-7" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Nuevo Producto</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Registro Manual</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Código de Barras</label>
                    <input
                        name="codigo_barras"
                        defaultValue={codigoDefault}
                        readOnly
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-400 font-mono outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Nombre del Producto</label>
                        <input name="nombre" required placeholder="Ejem: Coca Cola 500ml" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Marca</label>
                        <input name="marca" placeholder="Coca Cola" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Costo ($)</label>
                        <input name="precio_costo" type="number" step="0.01" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Venta ($)</label>
                        <input name="precio_venta" type="number" step="0.01" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Stock Inicial</label>
                        <input name="stock_actual" type="number" defaultValue="0" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Stock Mínimo</label>
                        <input name="stock_minimo" type="number" defaultValue="5" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Proveedor</label>
                    <input name="proveedor" placeholder="Ejem: Distribuidora Viale" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 h-14 bg-slate-800 text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                        CANCELAR
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {loading ? 'GUARDANDO...' : <><Save size={20} /> GUARDAR PRODUCTO</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
