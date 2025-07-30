// Font utility to load Thai Sarabun font for PDF
export const loadThaiFont = async (): Promise<string> => {
  try {
    const response = await fetch('/THSarabunNew.ttf');
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Error loading Thai font:', error);
    return '';
  }
};
