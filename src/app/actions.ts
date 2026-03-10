'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function descontarStock(codigoBarras: string) {
    try {
        const { data: producto, error: fetchError } = await supabase
            .from('productos')
            .select('stock_actual, precio_venta')
            .eq('codigo_barras', codigoBarras)
            .single()

        if (fetchError || !producto) throw new Error('Producto no encontrado')
        if (producto.stock_actual <= 0) throw new Error('Sin stock disponible')

        const { error: updateError } = await supabase
            .from('productos')
            .update({ stock_actual: producto.stock_actual - 1 })
            .eq('codigo_barras', codigoBarras)

        if (updateError) throw updateError

        // Registrar la venta en la tabla 'ventas'
        await supabase.from('ventas').insert([{
            codigo_barras: codigoBarras,
            cantidad: 1,
            precio_venta: producto.precio_venta
        }])

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function recargarStock(codigoBarras: string, cantidad: number) {
    try {
        const { data: producto, error: fetchError } = await supabase
            .from('productos')
            .select('stock_actual')
            .eq('codigo_barras', codigoBarras)
            .single()

        if (fetchError || !producto) throw new Error('Producto no encontrado')

        const { error: updateError } = await supabase
            .from('productos')
            .update({ stock_actual: producto.stock_actual + cantidad })
            .eq('codigo_barras', codigoBarras)

        if (updateError) throw updateError

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function editarPrecio(codigoBarras: string, nuevoPrecio: number) {
    try {
        const { error: updateError } = await supabase
            .from('productos')
            .update({ precio_venta: nuevoPrecio })
            .eq('codigo_barras', codigoBarras)

        if (updateError) throw updateError

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function registrarProducto(formData: FormData) {
    try {
        const data = {
            codigo_barras: formData.get('codigo_barras') as string,
            nombre: formData.get('nombre') as string,
            marca: formData.get('marca') as string,
            precio_costo: parseFloat(formData.get('precio_costo') as string),
            precio_venta: parseFloat(formData.get('precio_venta') as string),
            stock_actual: parseInt(formData.get('stock_actual') as string),
            stock_minimo: parseInt(formData.get('stock_minimo') as string),
            proveedor: formData.get('proveedor') as string,
        }

        const { error } = await supabase.from('productos').insert([data])
        if (error) throw error

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function procesarVentaMultiple(items: { codigo_barras: string, cantidad: number, precio_venta: number }[]) {
    try {
        for (const item of items) {
            // 1. Descontar stock
            const { data: producto, error: fetchError } = await supabase
                .from('productos')
                .select('stock_actual')
                .eq('codigo_barras', item.codigo_barras)
                .single()

            if (fetchError || !producto) throw new Error(`Producto ${item.codigo_barras} no encontrado`)

            const { error: updateError } = await supabase
                .from('productos')
                .update({ stock_actual: producto.stock_actual - item.cantidad })
                .eq('codigo_barras', item.codigo_barras)

            if (updateError) throw updateError

            // 2. Registrar venta
            await supabase.from('ventas').insert([{
                codigo_barras: item.codigo_barras,
                cantidad: item.cantidad,
                precio_venta: item.precio_venta
            }])
        }

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getLowStockItems() {
    try {
        const { data, error } = await supabase
            .from('productos')
            .select('nombre, marca, stock_actual, stock_minimo, proveedor')
            .lte('stock_actual', supabase.raw('stock_minimo')) // This might not work directly in Supabase JS depends on version, safer to use explicit column comparison logic or filter after fetch for MVP if RLS allows. Actually, for a clean SQL approach:

        // Better: use a raw filter or fetch and filter
        const { data: allItems, error: fetchErr } = await supabase
            .from('productos')
            .select('nombre, marca, stock_actual, stock_minimo, proveedor')

        if (fetchErr) throw fetchErr

        const lowStock = allItems.filter(item => item.stock_actual <= item.stock_minimo)
        return { success: true, data: lowStock }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
