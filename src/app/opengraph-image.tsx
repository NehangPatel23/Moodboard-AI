import { ImageResponse } from 'next/og';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site-metadata';

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #312e81 100%)',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: '#f472b6' }} />
          <div style={{ width: 96, height: 48, borderRadius: 12, background: '#38bdf8', marginTop: 8 }} />
          <div style={{ width: 64, height: 64, borderRadius: 12, background: '#34d399', marginTop: 24 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            {SITE_NAME}
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.4, color: '#cbd5e1', maxWidth: 920 }}>
            {SITE_DESCRIPTION}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
