import { classNames } from 'lib/utils/styles';
import { useState } from 'react';
import PlaceholderIcon from './PlaceholderIcon';

interface Props {
  src?: string;
  alt: string;
  size?: number;
}

const TokenLogo = ({ src, alt, size }: Props) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return <PlaceholderIcon size={size} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      height={size ?? 24}
      width={size ?? 24}
      className={classNames('aspect-square rounded-full object-cover')}
      onError={() => setError(true)}
    />
  );
};

export default TokenLogo;
