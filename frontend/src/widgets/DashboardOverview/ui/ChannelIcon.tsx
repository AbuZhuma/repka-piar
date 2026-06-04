import { Instagram, Mail, MessageCircle, Phone, Send } from 'lucide-react';

export function ChannelIcon({ channel }: { channel: string }) {
  const props = { size: 16 };
  if (channel === 'phone') return <Phone {...props} />;
  if (channel === 'whatsapp') return <MessageCircle {...props} />;
  if (channel === 'telegram') return <Send {...props} />;
  if (channel === 'email') return <Mail {...props} />;
  if (channel === 'instagram') return <Instagram {...props} />;
  return <Phone {...props} />;
}
