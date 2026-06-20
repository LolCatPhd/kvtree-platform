import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'KV Tree — Tree Felling & Stump Removal Experts in Kempton Park';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '72px 80px',
          backgroundColor: '#0b1f14',
          position: 'relative',
        }}
      >
        {/* Lime accent bar at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: '#b9f15d',
          }}
        />

        {/* Tree icon placeholder — simple circle */}
        <div
          style={{
            position: 'absolute',
            top: '64px',
            right: '80px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: '#163322',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              lineHeight: 1,
            }}
          >
            🌳
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#b9f15d',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Kempton Park &amp; East Rand
          </div>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.1,
            }}
          >
            KV Tree
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#bbdac1',
              maxWidth: '700px',
              lineHeight: 1.4,
            }}
          >
            Professional tree felling, stump grinding &amp; 24/7 emergency tree care.
          </div>
          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            <div
              style={{
                backgroundColor: '#b9f15d',
                color: '#0b1f14',
                fontSize: '20px',
                fontWeight: 700,
                padding: '12px 32px',
                borderRadius: '999px',
              }}
            >
              Free quote within 24 hours
            </div>
            <div style={{ color: '#5b9d6c', fontSize: '18px' }}>
              +27 83 302 2877
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
