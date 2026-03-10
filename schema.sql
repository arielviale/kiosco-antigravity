-- Tabla de productos para el Kiosco Viale
CREATE TABLE IF NOT EXISTS productos (
    codigo_barras TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    marca TEXT,
    precio_costo DECIMAL(10, 2) DEFAULT 0.00,
    precio_venta DECIMAL(10, 2) DEFAULT 0.00,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    proveedor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Política simple: permitir todo (MVP - idealmente ajustar para roles específicos)
CREATE POLICY "Permitir acceso anonimo" ON productos FOR ALL USING (true) WITH CHECK (true);

-- Tabla de ventas para registrar transacciones
CREATE TABLE IF NOT EXISTS ventas (
    id BIGSERIAL PRIMARY KEY,
    codigo_barras TEXT REFERENCES productos(codigo_barras),
    cantidad INTEGER DEFAULT 1,
    precio_venta DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir ventas anonimas" ON ventas FOR ALL USING (true) WITH CHECK (true);
