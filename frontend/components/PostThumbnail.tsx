import Image from 'next/image';

interface PostThumbnailProps {
  src: string;
  alt: string;
  type?: 'list' | 'detail';
  priority?: boolean;
}

export default function PostThumbnail({ src, alt, type = 'list', priority = false }: PostThumbnailProps) {
  const isList = type === 'list';
  
  const containerClass = isList
    ? 'w-full aspect-[800/440] sm:w-[260px] sm:h-auto relative overflow-hidden rounded-lg bg-surface-muted'
    : 'w-full aspect-[800/440] max-h-[350px] relative overflow-hidden rounded-xl bg-surface-muted mb-xl';
    
  const imageClass = isList 
    ? 'object-cover object-center transition-transform duration-500 group-hover:scale-105'
    : 'object-cover object-center';

  return (
    <div className={containerClass}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={isList ? "(max-width: 640px) 100vw, 260px" : "(max-width: 800px) 100vw, 800px"}
        className={imageClass}
      />
    </div>
  );
}
