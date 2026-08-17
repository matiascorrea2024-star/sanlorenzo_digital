-- Hallazgo real: solo "messages" y "notifications" estaban agregadas a
-- la publicación de Realtime -- las suscripciones postgres_changes de
-- live_stream_messages (chat de En Vivo) y city_chat_messages (chat de
-- ciudad, recién armado) nunca iban a recibir actualizaciones en vivo,
-- aunque el código las suscribía correctamente. Se suman también
-- offers y group_deal_participants para que el panel de ofertas
-- grupales se actualice solo en tiempo real.
alter publication supabase_realtime add table offers, group_deal_participants, city_chat_messages, live_stream_messages;
