-- Tipos de roles para el sistema
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'employee' NOT NULL,
    nombre TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS para perfiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para perfiles
CREATE POLICY "Perfiles visibles por todos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Solo dueños pueden insertar/borrar perfiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
);

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

-- Políticas de productos: todos pueden ver, solo empleados/dueños pueden modificar
CREATE POLICY "Productos visibles por todos" ON productos FOR SELECT USING (true);
CREATE POLICY "Solo personal puede modificar productos" ON productos FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);

-- Tabla de ventas para registrar transacciones
CREATE TABLE IF NOT EXISTS ventas (
    id BIGSERIAL PRIMARY KEY,
    codigo_barras TEXT REFERENCES productos(codigo_barras),
    vendedor_id UUID REFERENCES profiles(id),
    cantidad INTEGER DEFAULT 1,
    precio_venta DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ventas visibles para personal" ON ventas FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Personal puede registrar ventas" ON ventas FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);
