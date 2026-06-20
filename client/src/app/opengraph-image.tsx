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
          backgroundColor: '#0b1f14',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background texture — large faint circle */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #163322 0%, transparent 70%)',
          }}
        />

        {/* Lime accent bar — left edge */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            bottom: '0',
            width: '8px',
            backgroundColor: '#b9f15d',
          }}
        />

        {/* Bottom lime strip */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '6px',
            backgroundColor: '#163322',
          }}
        />

        {/* Tree SVG illustration — right side */}
        <div
          style={{
            position: 'absolute',
            right: '60px',
            top: '50px',
            display: 'flex',
            opacity: 0.18,
          }}
        >
          <svg width="380" height="520" viewBox="0 0 380 520" fill="none">
            {/* Trunk */}
            <rect x="165" y="360" width="50" height="160" rx="10" fill="#b9f15d" />
            {/* Lower canopy */}
            <ellipse cx="190" cy="320" rx="140" ry="110" fill="#b9f15d" />
            {/* Mid canopy */}
            <ellipse cx="190" cy="230" rx="115" ry="95" fill="#b9f15d" />
            {/* Upper canopy */}
            <ellipse cx="190" cy="150" rx="85" ry="80" fill="#b9f15d" />
            {/* Top */}
            <ellipse cx="190" cy="80" rx="55" ry="60" fill="#b9f15d" />
          </svg>
        </div>

        {/* Main content */}
        <div
          style={{
            position: 'absolute',
            left: '80px',
            top: '0',
            bottom: '0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: '700px',
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: '#163322',
                border: '2px solid #2a653f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="12" y="18" width="4" height="10" rx="2" fill="#b9f15d" />
                <ellipse cx="14" cy="15" rx="10" ry="8" fill="#b9f15d" />
                <ellipse cx="14" cy="8" rx="7" ry="6" fill="#b9f15d" />
              </svg>
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#5b9d6c',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              KV Tree
            </div>
          </div>

          {/* Location tag */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#b9f15d',
              }}
            />
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#b9f15d',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Kempton Park &amp; East Rand
            </div>
          </div>

          {/* Main headline */}
          <div
            style={{
              fontSize: '68px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}
          >
            Professional
            <br />
            Tree Care
          </div>

          {/* Subline */}
          <div
            style={{
              marginTop: '20px',
              fontSize: '24px',
              color: '#8dbf98',
              lineHeight: 1.4,
              maxWidth: '560px',
            }}
          >
            Tree felling · Stump grinding · Site clearing · 24/7 emergency response
          </div>

          {/* CTA pill */}
          <div
            style={{
              marginTop: '36px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            <div
              style={{
                backgroundColor: '#b9f15d',
                color: '#0b1f14',
                fontSize: '18px',
                fontWeight: 800,
                padding: '14px 36px',
                borderRadius: '999px',
                letterSpacing: '-0.01em',
              }}
            >
              Free quote within 24 hours
            </div>
            <div
              style={{
                fontSize: '17px',
                color: '#5b9d6c',
                fontWeight: 500,
              }}
            >
              +27 83 302 2877
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
