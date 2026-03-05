-- Añadir last_message a conversations para la lista de chats
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_text text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

-- Trigger: actualizar last_message al insertar mensaje
CREATE OR REPLACE FUNCTION public.on_message_inserted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_text = NEW.body,
      last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_message_inserted ON public.messages;
CREATE TRIGGER trigger_on_message_inserted
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.on_message_inserted();
