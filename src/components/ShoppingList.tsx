'use client'

import { useState } from 'react'
import { FileDown, Loader2, AlertTriangle } from 'lucide-react'
import { getLowStockItems } from '@/app/actions'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function ShoppingList() {
    const [loading, setLoading] = useState(false)

    const generatePDF = async () => {
        setLoading(true)
        try {
            const res = await getLowStockItems()
            if (!res.success || !res.data) throw new Error(res.error || 'No hay datos')

            const doc = new jsPDF()
            const today = new Date().toLocaleDateString('es-AR')

            // Header
            doc.setFontSize(22)
            doc.setTextColor(40)
            doc.text('LISTA DE COMPRAS - KIOSCO VIALE', 14, 22)

            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.text(`Fecha de generación: ${today}`, 14, 30)
            doc.text('Productos con stock crítico (Menor o igual al mínimo)', 14, 35)

            // Table
            const tableColumn = ["Producto", "Marca", "Stock Actual", "Mínimo", "Proveedor"]
            const tableRows = res.data.map(item => [
                item.nombre,
                item.marca,
                item.stock_actual.toString(),
                item.stock_minimo.toString(),
                item.proveedor || 'No especificado'
            ])

            // @ts-ignore - jspdf-autotable extends jsPDF type
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 45,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { top: 45 }
            })

            doc.save(`Pedido_Mercaderia_${today.replace(/\//g, '-')}.pdf`)
        } catch (error: any) {
            alert('Error generando PDF: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto p-8 glass rounded-[2.5rem] space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-2xl">
                    <AlertTriangle className="text-amber-500 w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white">Reposición de Stock</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Generar pedido para proveedor</p>
                </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
                Se generará un archivo PDF con todos los productos que han alcanzado su **stock mínimo**. Ideal para enviar por WhatsApp al repartidor.
            </p>

            <button
                onClick={generatePDF}
                disabled={loading}
                className="w-full h-16 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-white/5"
            >
                {loading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <>
                        <FileDown size={22} />
                        GENERAR LISTA (PDF)
                    </>
                )}
            </button>
        </div>
    )
}
