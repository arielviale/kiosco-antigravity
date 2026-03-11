'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function signIn(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) throw error

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function signUp(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const nombre = formData.get('nombre') as string
    const role = (formData.get('role') as 'owner' | 'employee') || 'employee'

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('No se pudo crear el usuario')

        // Crear el perfil en la tabla 'profiles'
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: authData.user.id,
                email,
                nombre,
                role
            }])

        if (profileError) throw profileError

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getUserProfile() {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) throw error
        return profile
    } catch (error) {
        return null
    }
}

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

export async function buscarProductos(query: string) {
    try {
        const { data, error } = await supabase
            .from('productos')
            .select('nombre, marca, stock_actual, stock_minimo, proveedor, precio_venta, codigo_barras')
            .or(`nombre.ilike.%${query}%,marca.ilike.%${query}%`)
            .limit(5)

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
