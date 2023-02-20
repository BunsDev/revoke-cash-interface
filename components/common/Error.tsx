import { useAddressPageContext } from 'lib/hooks/useAddressContext';
import { getChainName } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';
import { useEffect } from 'react';

interface Props {
  error: Error;
}

const Error = ({ error }: Props) => {
  const { t } = useTranslation();
  const { selectedChainId } = useAddressPageContext();

  useEffect(() => {
    console.log(error);
  }, []);

  const chainName = getChainName(selectedChainId);
  const chainConnectionMessage = t('common:errors.messages.chain_could_not_connect', { chainName });
  const message = error.message.includes('missing response') ? chainConnectionMessage : error.message;
  return <div>Error: {message}</div>;
};

export default Error;
