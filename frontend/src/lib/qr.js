import QRCode from 'qrcode';

export function extractPetIdFromQr(rawText) {
  if (!rawText) return '';
  const trimmed = String(rawText).trim();

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      for (const [key, val] of url.searchParams.entries()) {
        if (['pet', 'id', 'pet_id', 'petid', 'animal_id', 'animalid', 'passport'].includes(key.toLowerCase()) && val) {
          return decodeURIComponent(val).trim().toUpperCase();
        }
      }
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length >= 2 && (segments[0].toLowerCase() === 'passport' || segments[0].toLowerCase() === 'pet')) {
        return decodeURIComponent(segments[1]).trim().toUpperCase();
      }
      if (segments.length > 0) {
        const last = decodeURIComponent(segments[segments.length - 1]).trim();
        if (last && !['app', 'pet', 'passport', 'index.html'].includes(last.toLowerCase())) {
          return last.toUpperCase();
        }
      }
    } catch {
      // Fallback to regex matching below
    }
  }

  const queryMatch = trimmed.match(/[?&](?:pet|id|pet_id|petid|animal_id)=([^&#\s]+)/i);
  if (queryMatch) {
    return decodeURIComponent(queryMatch[1]).trim().toUpperCase();
  }

  const pathMatch = trimmed.match(/(?:\/passport\/|\/pet\/)([A-Za-z0-9_-]+)/i);
  if (pathMatch) {
    return pathMatch[1].toUpperCase();
  }

  const idMatch = trimmed.match(/(?:PET|STRAY|TF|CIT|ADOPT)[-_A-Z0-9]+/i);
  if (idMatch) {
    return idMatch[0].toUpperCase();
  }

  return trimmed.replace(/^[#/]+/, '').trim().toUpperCase();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generates a print-ready 1200x1200 (300 DPI) branded collar tag PNG containing
 * the CIT-U Task Force Bruno header, scannable QR code, pet name, ID, zone, and hotline.
 */
export async function renderBrandedCollarTagPng(pet, targetUrl) {
  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    width: 720,
    margin: 2,
    color: { dark: '#5C0612', light: '#FFFFFF' },
  });

  const canvas = document.createElement('canvas');
  const size = 1200;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Outer clean background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // Maroon outer card frame with gold inner accent
  drawRoundedRect(ctx, 36, 36, size - 72, size - 72, 64);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 22;
  ctx.strokeStyle = '#5C0612';
  ctx.stroke();

  // Header band
  ctx.save();
  drawRoundedRect(ctx, 47, 47, size - 94, 185, 52);
  ctx.clip();
  ctx.fillStyle = '#5C0612';
  ctx.fillRect(47, 47, size - 94, 185);
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(47, 220, size - 94, 12);
  ctx.restore();

  // Try drawing logo in header
  try {
    const logo = await loadImage('/logo.png');
    ctx.drawImage(logo, 95, 76, 118, 118);
  } catch {
    // Continue cleanly without logo if unavailable
  }

  ctx.fillStyle = '#D4AF37';
  ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('CIT-U TASK FORCE BRUNO', 240, 122);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 44px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('OFFICIAL COLLAR TAG', 240, 178);

  // QR matrix centered
  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 570;
  const qrX = (size - qrSize) / 2;
  const qrY = 268;
  drawRoundedRect(ctx, qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 32);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#E2E8F0';
  ctx.stroke();
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Pet details footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0F172A';
  ctx.font = '800 60px "Plus Jakarta Sans", sans-serif';
  const petName = String(pet?.name || 'Campus Companion').slice(0, 24);
  ctx.fillText(petName, size / 2, 938);

  ctx.fillStyle = '#5C0612';
  ctx.font = '700 34px "JetBrains Mono", monospace';
  ctx.fillText(`TAG ID: ${pet?.pet_id || 'N/A'}`, size / 2, 994);

  ctx.fillStyle = '#475569';
  ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
  const subline = `${pet?.species || 'Companion'} • ${pet?.found_near || 'CIT-U Campus'}`.slice(0, 48);
  ctx.fillText(subline, size / 2, 1044);

  // Divider + Emergency hotline
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(140, 1076);
  ctx.lineTo(size - 140, 1076);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = '700 26px "JetBrains Mono", monospace';
  ctx.fillText('SCAN FOR PASSPORT  •  HOTLINE: (032) 261-7741 loc. 144', size / 2, 1122);

  return {
    qrDataUrl,
    badgeDataUrl: canvas.toDataURL('image/png'),
  };
}
