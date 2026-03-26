import L from 'leaflet';
import { MapColor } from '@/core/domain/types';

export const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];
export const DEFAULT_ZOOM = 12;
export const USER_ZOOM = 16;

export const MAP_COLORS: Record<MapColor, { bg: string; ring: string; label: string; desc: string }> = {
  verde:    { bg: '#22c55e', ring: '#16a34a', label: 'Pago', desc: 'Locação finalizada e paga' },
  amarelo:  { bg: '#eab308', ring: '#ca8a04', label: 'Em Uso', desc: 'Caçamba no cliente dentro do prazo' },
  vermelho: { bg: '#ef4444', ring: '#dc2626', label: 'Vencida/Retirar', desc: 'Prazo expirado ou coleta solicitada' },
  azul:     { bg: '#3b82f6', ring: '#2563eb', label: 'Entrega Pendente', desc: 'Aguardando envio ao cliente' },
  cinza:    { bg: '#6b7280', ring: '#4b5563', label: 'Disponível', desc: 'No pátio aguardando nova locação' },
};

export const USER_ICON = L.divIcon({
  html: `<div class="user-pin"><div class="user-pin-ring"></div></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function createCacambaIcon(codigo: string, color: MapColor, blink = false) {
  const c = MAP_COLORS[color];
  const blinkClass = blink ? 'cacamba-blink' : '';
  const len = codigo.length;
  const fontSize = len > 6 ? '9px' : '11px';
  const width = Math.max(56, len * 8.5);
  const anchorX = width / 2;
  const html = `
    <div class="cacamba-marker-pin flex items-center justify-center ${blinkClass}" style="--pin-bg:${c.bg}; --pin-ring:${c.ring}; font-size:${fontSize}; padding: 0 4px;">
      <span class="truncate w-full text-center leading-none">${codigo}</span>
    </div>
  `;
  return L.divIcon({ html, className: '', iconSize: [width, 32], iconAnchor: [anchorX, 36], popupAnchor: [0, -38] });
}
