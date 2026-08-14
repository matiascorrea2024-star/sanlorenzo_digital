-- ============================================
-- NOTIFICACIONES AUTOMÁTICAS A SEGUIDORES
-- Cuando un negocio publica una oferta activa,
-- todos sus seguidores reciben una notificación.
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'offer',
  link TEXT,
  business_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notif_select_own ON notifications;
DROP POLICY IF EXISTS notif_update_own ON notifications;
CREATE POLICY notif_select_own ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notif_update_own ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Trigger: al insertar oferta activa, notificar seguidores
CREATE OR REPLACE FUNCTION notify_followers_on_offer()
RETURNS trigger AS $$
DECLARE
  biz_name TEXT;
BEGIN
  SELECT name INTO biz_name FROM businesses WHERE id = NEW.business_id;
  INSERT INTO notifications (user_id, title, body, type, link, business_id)
  SELECT f.user_id,
         '🔥 ' || biz_name || ' publicó una nueva oferta',
         NEW.title,
         'offer',
         '/oferta/' || NEW.id,
         NEW.business_id
  FROM followers f
  WHERE f.business_id = NEW.business_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_offer ON offers;
CREATE TRIGGER trg_notify_offer
AFTER INSERT ON offers
FOR EACH ROW
WHEN (NEW.active = true)
EXECUTE FUNCTION notify_followers_on_offer();
