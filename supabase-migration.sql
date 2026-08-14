-- ============================================
-- MIGRACIÓN: TABLAS FALTANTES PARA ECOSISTEMA
-- ============================================

-- 1. TABLA DE CUPONES (Para tracking de conversión)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  user_id UUID,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'generated', -- generated, redeemed, expired, cancelled
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_coupons_business ON coupons(business_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);

-- 2. TABLA DE RECLAMOS DE NEGOCIOS
CREATE TABLE IF NOT EXISTS business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  claimer_id UUID,
  claimer_name TEXT,
  claimer_email TEXT,
  claimer_phone TEXT,
  proof_method TEXT, -- whatsapp, email, document, manual
  status TEXT DEFAULT 'pending', -- pending, reviewing, approved, rejected
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

CREATE INDEX IF NOT EXISTS idx_claims_business ON business_claims(business_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON business_claims(status);

-- 3. TABLA DE RESEÑAS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  business_reply TEXT,
  replied_at TIMESTAMPTZ,
  verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'published', -- published, hidden, reported
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- 4. TABLA DE LINKS RASTREABLES (Para automarketing)
CREATE TABLE IF NOT EXISTS tracked_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- instagram, whatsapp, qr, facebook, direct
  short_code TEXT UNIQUE,
  full_url TEXT,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_clicked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tracked_business ON tracked_links(business_id);
CREATE INDEX IF NOT EXISTS idx_tracked_source ON tracked_links(source);

-- 5. TABLA DE NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  business_id UUID,
  type TEXT NOT NULL, -- new_offer, offer_expiring, new_follower, coupon_ready, etc
  title TEXT,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 6. TABLA DE LISTAS DE USUARIOS (Para "Mis favoritos", etc)
CREATE TABLE IF NOT EXISTS user_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES user_lists(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, business_id)
);

-- 7. TABLA DE REPORTES
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID,
  business_id UUID,
  offer_id UUID,
  review_id UUID,
  type TEXT NOT NULL, -- fake_business, fake_offer, inappropriate, spam, etc
  reason TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- 8. TABLA DE RESERVAS (Sin pago)
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT,
  user_phone TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled, expired
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reservations_business ON reservations(business_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- 9. VISTA PARA OFERTAS CON NEGOCIO (Para queries más fáciles)
CREATE OR REPLACE VIEW offers_with_business AS
SELECT 
  o.*,
  b.name as business_name,
  b.slug as business_slug,
  b.category as business_category,
  b.portada_url as business_portada,
  b.logo_url as business_logo,
  b.whatsapp as business_whatsapp,
  b.instagram as business_instagram,
  b.address as business_address
FROM offers o
LEFT JOIN businesses b ON o.business_id = b.id
WHERE o.active = TRUE;

-- 10. FUNCIÓN PARA ACTUALIZAR CONTADORES DE NEGOCIOS
CREATE OR REPLACE FUNCTION update_business_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE businesses 
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.business_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE businesses 
    SET favorites_count = favorites_count - 1
    WHERE id = OLD.business_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_favorites_count
AFTER INSERT OR DELETE ON favorites
FOR EACH ROW EXECUTE FUNCTION update_business_stats();

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE coupons IS 'Cupones generados y canjeados para tracking de conversión';
COMMENT ON TABLE business_claims IS 'Reclamos de negocios por dueños reales';
COMMENT ON TABLE reviews IS 'Reseñas de usuarios sobre negocios';
COMMENT ON TABLE tracked_links IS 'Links rastreables para automarketing';
COMMENT ON TABLE notifications IS 'Notificaciones para usuarios';
COMMENT ON TABLE user_lists IS 'Listas creadas por usuarios';
COMMENT ON TABLE reports IS 'Reportes de contenido inapropiado';
COMMENT ON TABLE reservations IS 'Reservas de productos/servicios sin pago';
