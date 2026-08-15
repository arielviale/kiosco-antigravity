'use client'

import { useState } from 'react'
import { signIn, signUp } from '../actions'
import { Lock, Mail, Loader2, Store, User, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = mode === 'signin' 
            ? await signIn(formData)
            : await signUp(formData)

        if (result.success) {
            window.location.href = '/'
        } else {
            setError(result.error || 'Error al procesar la solicitud')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 selection:bg-cyan-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md relative">
                {/* Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                            <Store className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Kiosco Viale</h1>
                        <p className="text-slate-400 mt-1 text-sm">Sistema de Gestión Inteligente</p>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-slate-800 mb-6">
                        <button
                            type="button"
                            onClick={() => { setMode('signin'); setError(null); }}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                                mode === 'signin'
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('signup'); setError(null); }}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                                mode === 'signup'
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Crear Cuenta
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'signup' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-300 ml-1">Nombre Completo</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <input
                                        name="nombre"
                                        type="text"
                                        required
                                        placeholder="Ej. Juan Pérez"
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-300 ml-1">Correo Electrónico</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="nombre@ejemplo.com"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-300 ml-1">Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {mode === 'signup' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-300 ml-1">Rol de Usuario</label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <select
                                        name="role"
                                        defaultValue="owner"
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
                                    >
                                        <option value="owner" className="bg-slate-900 text-white">Dueño / Administrador</option>
                                        <option value="employee" className="bg-slate-900 text-white">Empleado</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2 animate-shake">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{mode === 'signin' ? 'Ingresar al Sistema' : 'Crear mi Cuenta'}</span>
                                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full group-hover:scale-150 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                        <p className="text-slate-500 text-xs">
                            {mode === 'signin' ? '¿Primera vez usando el sistema?' : '¿Ya tienes una cuenta?'} {' '}
                            <button
                                type="button"
                                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
                                className="text-cyan-400 font-bold hover:underline ml-1"
                            >
                                {mode === 'signin' ? 'Crear cuenta aquí' : 'Ingresar'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="mt-8 text-center">
                    <p className="text-slate-600 text-xs font-medium uppercase tracking-widest">
                        v2.0 • Premium Management Suite
                    </p>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    )
}
