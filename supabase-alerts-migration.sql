-- ============================================
-- TABLA PARA "AVISAME SI VUELVE" (FOMO LEGÍTIMO)
-- ============================================

CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID,
  offer_id UUID,
  alert_type TEXT NOT NULL, -- offer_back, price_drop, new_offer_category
  search_query TEXT, -- para alertas genéricas (ej: "zapatillas")
  product_name TEXT, -- nombre del producto/oferta original
  original_price NUMERIC,
  status TEXT DEFAULT 'active', -- active, triggered, dismissed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  triggered_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_business ON user_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_status ON user_alerts(status);
CREATE INDEX IF NOT EXISTS idx_user_alerts_type ON user_alerts(alert_type);
