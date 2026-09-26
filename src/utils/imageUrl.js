const CLOUDINARY_UPLOAD_PATH = '/image/upload/';
const isCloudinaryImage = (source) => typeof source === 'string' && source.includes('res.cloudinary.com') && source.includes(CLOUDINARY_UPLOAD_PATH);

export const optimizedImageUrl = (source, { width, quality = 'auto:eco' } = {}) => {
  if (!isCloudinaryImage(source)) return source;
  const [prefix, assetPath] = source.split(CLOUDINARY_UPLOAD_PATH);
  const transforms = ['f_auto', `q_${quality}`, width ? `w_${Math.round(width)}` : '', width ? 'c_limit' : ''].filter(Boolean).join(',');
  return `${prefix}${CLOUDINARY_UPLOAD_PATH}${transforms}/${assetPath}`;
};

export const optimizedImageSrcSet = (source, widths = [], options = {}) => isCloudinaryImage(source)
  ? widths.map((width) => `${optimizedImageUrl(source, { ...options, width })} ${width}w`).join(', ')
  : undefined;
