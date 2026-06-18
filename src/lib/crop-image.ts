export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Failed to load image for cropping')));
    image.src = url;
  });
}

export async function cropImageToBlob(
  imageSrc: string,
  pixelCrop: CropArea,
  outputSize = 512,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not crop image');
  }

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not crop image'));
          return;
        }

        resolve(blob);
      },
      'image/jpeg',
      0.92,
    );
  });
}
