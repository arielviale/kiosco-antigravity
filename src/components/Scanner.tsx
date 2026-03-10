'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '@/lib/supabase'
import { Search, Loader2 } from 'lucide-react'

interface ScannerProps {
    onResult: (data: any | null, code: string) => void
    isPaused: boolean
}

export default function Scanner({ onResult, isPaused }: ScannerProps) {
    const [loading, setLoading] = useState(false)
    const [flash, setFlash] = useState(false)
    const lastScannedTime = useRef<number>(0)
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)

    useEffect(() => {
        scannerRef.current = new Html5QrcodeScanner(
            'reader',
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
      /* verbose= */ false
        )

        const playBeep = () => {
            if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioContextClass();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
            } catch (e) {
                console.error("Audio context error", e);
            }
        }

        const onScanSuccess = async (decodedText: string) => {
            if (isPaused) return
            const now = Date.now()
            if (now - lastScannedTime.current < 2000) return // Throttle

            lastScannedTime.current = now
            playBeep()
            setFlash(true)
            setTimeout(() => setFlash(false), 150)
            setLoading(true)
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .eq('codigo_barras', decodedText)
                .single()

            onResult(data, decodedText)
            setLoading(false)
        }

        const onScanFailure = (error: any) => {
            // Ignore scan failures
        }

        scannerRef.current.render(onScanSuccess, onScanFailure)

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error))
            }
        }
    }, [onResult])

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-slate-900 shadow-2xl glass aspect-square">
                <div className="scan-line" />
                {flash && <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-150" />}
                <div id="reader" className="w-full h-full [&_video]:object-cover" />
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                )}
            </div>
            <div className="text-center text-sm text-slate-400 animate-pulse flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                Escaneando código de barras...
            </div>
        </div>
    )
}
