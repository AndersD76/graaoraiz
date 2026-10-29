import { ImageResponse } from 'next/og';

export const alt = 'Grão Raiz — o vigia da sua lavoura';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Imagem de compartilhamento (WhatsApp, redes sociais), gerada no build sem arquivos externos. */
export default function ImagemCompartilhamento() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          padding: '72px 80px',
          color: '#0B0F0C',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="84" height="84" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#1F6B2E" />
            <path d="M16 4.5c-.9 1.2-8.5 10.3-8.5 15.4a8.5 8.5 0 0 0 17 0C24.5 14.8 16.9 5.7 16 4.5Z" fill="#FFFFFF" />
            <path d="M11.6 23.6c0-5 3.6-8.3 8.9-8.7.1 5.3-3.4 8.9-8.9 8.7Z" fill="#1F6B2E" />
            <path d="M11.9 23.3 17.6 17.6" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 700 }}>Grão Raiz</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, maxWidth: 980 }}>
            O vigia da sua lavoura
          </div>
          <div style={{ marginTop: 28, fontSize: 34, color: '#4A524B', maxWidth: 1000 }}>
            Hora de pulverizar, geada e temporal, satélite, preço do dia e EUDR, por talhão.
          </div>
        </div>
        <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ flex: 1, background: '#1B7F3B' }} />
          <div style={{ flex: 1, background: '#9A5B00' }} />
          <div style={{ flex: 1, background: '#C62828' }} />
        </div>
      </div>
    ),
    size,
  );
}
