import html2canvas from 'html2canvas';

export const exportElementAsImage = async (
  element: HTMLElement,
  filename: string = 'milestone.png'
): Promise<Blob | null> => {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png', 1.0);
    });
  } catch (error) {
    console.error('Error exporting image:', error);
    return null;
  }
};

export const downloadImage = async (
  element: HTMLElement,
  filename: string = 'milestone.png'
): Promise<void> => {
  const blob = await exportElementAsImage(element, filename);
  if (!blob) return;
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const shareImage = async (
  element: HTMLElement,
  title: string,
  text: string
): Promise<boolean> => {
  const blob = await exportElementAsImage(element);
  if (!blob) return false;
  
  const file = new File([blob], 'milestone.png', { type: 'image/png' });
  
  if (navigator.share && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }
  
  // Fallback to download
  await downloadImage(element, 'milestone.png');
  return true;
};
