'use client'

import { useState, useEffect } from 'react'
import { FileDown, Loader2, AlertTriangle, Plus, Trash2, Search, PackagePlus, X, Minus } from 'lucide-react'
import { getLowStockItems, buscarProductos } from '@/app/actions'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ListItem {
    id_temp: string
    nombre: string
    marca: string
    stock_actual: number
    stock_minimo: number
    proveedor: string
    cantidad: number
    is_new?: boolean
}

export default function ShoppingList() {
    const [items, setItems] = useState<ListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)

    // Manual entry state
    const [showManual, setShowManual] = useState(false)
    const [newItem, setNewItem] = useState({ nombre: '', marca: '', proveedor: '' })

    useEffect(() => {
        loadInitialItems()
    }, [])

    const loadInitialItems = async () => {
        try {
            const res = await getLowStockItems()
            if (res.success && res.data) {
                setItems(res.data.map((i: any) => ({
                    id_temp: Math.random().toString(36).substr(2, 9),
                    nombre: i.nombre || 'Sin nombre',
                    marca: i.marca || 'Genérico',
                    stock_actual: Number(i.stock_actual) || 0,
                    stock_minimo: Number(i.stock_minimo) || 0,
                    proveedor: i.proveedor || '-',
                    cantidad: 1
                })))
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async (val: string) => {
        setSearchQuery(val)
        if (val.length < 2) {
            setSearchResults([])
            return
        }
        setSearching(true)
        const res = await buscarProductos(val)
        if (res.success) setSearchResults(res.data || [])
        setSearching(false)
    }

    const addExistingProduct = (prod: any) => {
        if (items.find(i => i.nombre === prod.nombre && i.marca === prod.marca)) {
            alert('Ya está en la lista')
            return
        }
        setItems(prev => [{
            id_temp: Math.random().toString(36).substr(2, 9),
            nombre: prod.nombre,
            marca: prod.marca,
            stock_actual: Number(prod.stock_actual) || 0,
            stock_minimo: Number(prod.stock_minimo) || 0,
            proveedor: prod.proveedor,
            cantidad: 1
        }, ...prev])
        setSearchQuery('')
        setSearchResults([])
    }

    const addManualItem = () => {
        if (!newItem.nombre) return
        setItems(prev => [{
            id_temp: Math.random().toString(36).substr(2, 9),
            nombre: newItem.nombre,
            marca: newItem.marca || 'Genérica',
            proveedor: newItem.proveedor || '-',
            stock_actual: 0,
            stock_minimo: 0,
            cantidad: 1,
            is_new: true
        }, ...prev])
        setNewItem({ nombre: '', marca: '', proveedor: '' })
        setShowManual(false)
    }

    const updateQuantity = (id: string, delta: number) => {
        setItems(prev => prev.map(i => {
            if (i.id_temp === id) {
                const currentCant = Number(i.cantidad) || 1
                return { ...i, cantidad: Math.max(1, currentCant + delta) }
            }
            return i
        }))
    }

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id_temp !== id))
    }

    const generatePDF = () => {
        setGenerating(true)
        try {
            const doc = new jsPDF()
            const today = new Date().toLocaleDateString('es-AR')

            doc.setFontSize(22)
            doc.text('PEDIDO DE MERCADERÍA - VIALE', 14, 22)
            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.text(`Generado el: ${today}`, 14, 30)

            const tableColumn = ["Cant.", "Producto", "Marca", "Proveedor"]
            const tableRows = items.map(item => [
                (Number(item.cantidad) || 1).toString(),
                item.nombre,
                item.marca,
                item.proveedor || '-'
            ])

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
                columnStyles: { 0: { cellWidth: 20, halign: 'center' } }
            })

            doc.save(`Pedido_Viale_${today.replace(/\//g, '-')}.pdf`)
        } finally {
            setGenerating(false)
        }
    }

    if (loading) return (
        <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
        </div>
    )

    return (
        <div className="w-full max-w-md mx-auto space-y-6 pb-32 px-4">
            {/* Search Bar */}
            <div className="relative glass rounded-2xl p-2 border-white/10">
                <div className="flex items-center gap-3 px-3">
                    <Search className="text-slate-500 w-5 h-5" />
                    <input
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Buscar producto existente..."
                        className="flex-1 bg-transparent py-3 text-white placeholder:text-slate-600 focus:outline-none font-medium"
                    />
                    {searching && <Loader2 className="animate-spin text-primary w-4 h-4" />}
                </div>

                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl overflow-hidden z-50 border-primary/20 shadow-2xl">
                        {searchResults.map(prod => (
                            <button
                                key={prod.codigo_barras}
                                onClick={() => addExistingProduct(prod)}
                                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                            >
                                <div className="text-left">
                                    <p className="font-bold text-white text-sm">{prod.nombre}</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-black">{prod.marca}</p>
                                </div>
                                <Plus className="text-primary w-4 h-4" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Manual Add Trigger */}
            {!showManual ? (
                <button
                    onClick={() => setShowManual(true)}
                    className="w-full py-4 glass rounded-2xl border-dashed border-primary/30 flex items-center justify-center gap-2 text-primary font-black text-xs tracking-widest hover:bg-primary/5 transition-all"
                >
                    <PackagePlus size={16} /> AGREGAR ARTÍCULO NUEVO
                </button>
            ) : (
                <div className="glass rounded-3xl p-6 border-primary/20 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-black text-primary uppercase tracking-widest">Nuevo Artículo</h4>
                        <X size={16} className="text-slate-500 cursor-pointer" onClick={() => setShowManual(false)} />
                    </div>
                    <input
                        value={newItem.nombre}
                        onChange={e => setNewItem({ ...newItem, nombre: e.target.value })}
                        placeholder="Nombre del producto"
                        className="w-full bg-slate-950/50 rounded-xl p-4 border border-white/10 text-white focus:border-primary/50 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            value={newItem.marca}
                            onChange={e => setNewItem({ ...newItem, marca: e.target.value })}
                            placeholder="Marca"
                            className="bg-slate-950/50 rounded-xl p-4 border border-white/10 text-white outline-none"
                        />
                        <input
                            value={newItem.proveedor}
                            onChange={e => setNewItem({ ...newItem, proveedor: e.target.value })}
                            placeholder="Proveedor"
                            className="bg-slate-950/50 rounded-xl p-4 border border-white/10 text-white outline-none"
                        />
                    </div>
                    <button
                        onClick={addManualItem}
                        className="w-full py-4 bg-primary text-white rounded-xl font-black text-sm active:scale-95 transition-all"
                    >
                        CONFIRMAR AGREGADO
                    </button>
                </div>
            )}

            {/* List Display */}
            <div className="space-y-3">
                {items.length > 0 ? (
                    items.map((item) => (
                        <div key={item.id_temp} className="glass rounded-2xl p-4 flex items-center justify-between border-white/5 group animate-in slide-in-from-right-4 duration-300">
                            <div className="min-w-0 pr-4">
                                <div className="flex items-center gap-2">
                                    <p className="font-black text-white text-sm truncate">{item.nombre}</p>
                                    {item.is_new && <span className="bg-primary/20 text-primary text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter shrink-0">Nuevo</span>}
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{item.marca} • {item.proveedor || '-'}</p>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-3 bg-slate-950/40 rounded-xl p-1.5 border border-white/5">
                                    <button
                                        onClick={() => updateQuantity(item.id_temp, -1)}
                                        className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="min-w-[1.5rem] text-center font-black text-white text-sm">
                                        {Number(item.cantidad) || 1}
                                    </span>
                                    <button
                                        onClick={() => updateQuantity(item.id_temp, 1)}
                                        className="p-1.5 hover:bg-white/5 rounded-lg text-primary transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => removeItem(item.id_temp)}
                                    className="p-2 text-slate-700 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center glass rounded-[2.5rem] border-dashed border-white/10">
                        <AlertTriangle className="mx-auto text-slate-700 w-10 h-10 mb-4" />
                        <p className="text-slate-500 font-bold text-sm">No hay artículos en la lista.</p>
                    </div>
                )}
            </div>

            {/* Action Button */}
            {items.length > 0 && (
                <button
                    onClick={generatePDF}
                    disabled={generating || items.length === 0}
                    className="w-full h-16 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 rounded-[1.8rem] font-black text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-2xl shadow-primary/20 mt-8"
                >
                    {generating ? <Loader2 className="animate-spin" /> : <><FileDown size={22} /> GENERAR LISTA ({items.length})</>}
                </button>
            )}
        </div>
    )
}
