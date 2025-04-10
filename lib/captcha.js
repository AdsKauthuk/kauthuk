// lib/captcha.js

/**
 * Generate a simple SVG captcha
 * @returns {Promise<{image: string, code: string}>} Captcha image as SVG and the code
 */
export async function generateCaptcha() {
  // Generate a random 6-character code
  const code = generateRandomCode(6);
  
  // Generate SVG image
  const svgImage = generateSvgCaptcha(code);
  
  return {
    image: svgImage,
    code
  };
}

/**
 * Generate a random alphanumeric code
 * @param {number} length - Length of the code
 * @returns {string} Random code
 */
function generateRandomCode(length = 6) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'; // Removed confusing characters like 0, O, 1, I, l
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

/**
 * Generate SVG captcha image
 * @param {string} code - The code to render
 * @returns {string} SVG image as string
 */
function generateSvgCaptcha(code) {
  const width = 150;
  const height = 50;
  const fontSize = 24;
  const charSpacing = 22;
  
  // Start SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="#f8f8f8" />`;
  
  // Add noise lines
  for (let i = 0; i < 6; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    const color = getRandomColor(0.4); // Semi-transparent color
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" />`;
  }
  
  // Add noise circles
  for (let i = 0; i < 15; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const r = 1 + Math.random() * 3;
    const color = getRandomColor(0.3);
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" />`;
  }
  
  // Add each character with rotation and position variation
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const x = 15 + i * charSpacing + (Math.random() * 8 - 4);
    const y = height / 2 + 8 + (Math.random() * 10 - 5);
    const rotation = Math.random() * 30 - 15;
    const color = `rgb(${20 + Math.floor(Math.random() * 80)}, ${20 + Math.floor(Math.random() * 30)}, ${Math.floor(Math.random() * 30)})`;
    
    svg += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${color}" transform="rotate(${rotation}, ${x}, ${y})">${char}</text>`;
  }
  
  // Close SVG
  svg += '</svg>';
  
  return svg;
}

/**
 * Generate a random color with given opacity
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} Color in rgba format
 */
function getRandomColor(opacity = 1) {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}