import L from 'leaflet';
import { MapColor } from '@/core/domain/types';
import { escapeHtml } from '@/lib/domain-helpers';

export const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];
export const DEFAULT_ZOOM = 12;
export const USER_ZOOM = 16;

export const MAP_COLORS: Record<MapColor, { bg: string; ring: string; ink: string; label: string; desc: string }> = {
  verde:    { bg: '#16794C', ring: '#115E3B', ink: '#FAF8F5', label: 'Pago', desc: 'Locação finalizada e paga' },
  amarelo:  { bg: '#D98A00', ring: '#9E6300', ink: '#1D1915', label: 'Em Uso', desc: 'Caçamba na obra dentro do prazo' },
  vermelho: { bg: '#C42B22', ring: '#961E17', ink: '#FAF8F5', label: 'Vencida / Retirar', desc: 'Prazo expirado ou aguardando retirada' },
  azul:     { bg: '#1D5FB8', ring: '#16498E', ink: '#FAF8F5', label: 'Entrega Pendente', desc: 'Aguardando envio ao cliente' },
  cinza:    { bg: '#57534E', ring: '#44403C', ink: '#FAF8F5', label: 'Disponível', desc: 'No pátio aguardando nova locação' },
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
  const safeCode = escapeHtml(codigo);
  const len = codigo.length;
  const fontSize = len > 6 ? '10px' : '11px';
  const width = Math.max(58, len * 8.5);
  const anchorX = width / 2;
  const html = `
    <div class="cacamba-marker-pin flex items-center justify-center ${blinkClass}" style="--pin-bg:${c.bg}; --pin-ring:${c.ring}; color:${c.ink}; font-size:${fontSize}; padding: 0 5px;">
      <span class="truncate w-full text-center leading-none">${safeCode}</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: '',
    iconSize: [width, 32],
    iconAnchor: [anchorX, 36],
    popupAnchor: [0, -38],
  });
}
