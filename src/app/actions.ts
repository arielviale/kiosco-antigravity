'use server'

import { createClient } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'

export async function signIn(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
        const supabase = await createClient()
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
        const supabase = await createClient()
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError) {
            // Si el usuario ya existe o fue registrado en el intento previo, intentamos Iniciar Sesión directamente
            const { error: signInErr } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (!signInErr) {
                revalidatePath('/')
                return { success: true }
            }
            throw authError
        }

        if (authData?.user) {
            // Crear el perfil en la tabla 'profiles'
            await supabase
                .from('profiles')
                .upsert([{
                    id: authData.user.id,
                    email,
                    nombre,
                    role
                }])

            // Iniciar sesión para activar la cookie de sesión
            await supabase.auth.signInWithPassword({
                email,
                password
            })
        }

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function signOut() {
    try {
        const supabase = await createClient()
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
        const supabase = await createClient()
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

export async function descontarStock(codigoBarras: string, metodoPago: string = 'efectivo') {
    try {
        const supabase = await createClient()
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
            precio_venta: producto.precio_venta,
            metodo_pago: metodoPago
        }])

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function recargarStock(codigoBarras: string, cantidad: number) {
    try {
        const supabase = await createClient()
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
        const supabase = await createClient()
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
        const supabase = await createClient()
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

export async function procesarVentaMultiple(
    items: { codigo_barras?: string | null, nombre?: string, cantidad: number, precio_venta: number }[],
    metodoPago: string = 'efectivo'
) {
    try {
        const supabase = await createClient()
        for (const item of items) {
            if (item.codigo_barras) {
                // 1. Descontar stock si el producto existe
                const { data: producto } = await supabase
                    .from('productos')
                    .select('stock_actual')
                    .eq('codigo_barras', item.codigo_barras)
                    .single()

                if (producto && producto.stock_actual !== undefined) {
                    await supabase
                        .from('productos')
                        .update({ stock_actual: Math.max(0, producto.stock_actual - item.cantidad) })
                        .eq('codigo_barras', item.codigo_barras)
                }

                // 2. Registrar venta
                await supabase.from('ventas').insert([{
                    codigo_barras: item.codigo_barras,
                    cantidad: item.cantidad,
                    precio_venta: item.precio_venta,
                    metodo_pago: metodoPago
                }])
            } else {
                // Venta de producto sin código (Varios)
                await supabase.from('ventas').insert([{
                    codigo_barras: null,
                    descripcion: item.nombre || 'Producto Varios',
                    cantidad: item.cantidad,
                    precio_venta: item.precio_venta,
                    metodo_pago: metodoPago
                }])
            }
        }

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getLowStockItems() {
    try {
        const supabase = await createClient()
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
        const supabase = await createClient()
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

