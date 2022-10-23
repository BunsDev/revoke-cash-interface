import { track } from '@amplitude/analytics-browser';
import AllowanceControls from 'components/common/AllowanceControls';
import { displayTransactionSubmittedToast } from 'components/common/transaction-submitted-toast';
import { Contract } from 'ethers';
import { ADDRESS_ZERO } from 'lib/constants';
import { useEthereum } from 'lib/hooks/useEthereum';
import { Erc721TokenData, IERC721Allowance } from 'lib/interfaces';
import { shortenAddress } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { addressToAppName } from 'lib/utils/whois';
import Trans from 'next-translate/Trans';
import { useRef } from 'react';
import { useAsync } from 'react-async-hook';
import { Form } from 'react-bootstrap';
import { ClipLoader } from 'react-spinners';

interface Props {
  token: Erc721TokenData;
  allowance: IERC721Allowance;
  inputAddress: string;
  openSeaProxyAddress?: string;
  onRevoke: (allowance: IERC721Allowance) => void;
}

function Erc721Allowance({ token, allowance, inputAddress, openSeaProxyAddress, onRevoke }: Props) {
  const { spender, tokenId } = allowance;

  const toastRef = useRef();
  const { signer, account, selectedChainId } = useEthereum();
  const { result: spenderName, loading } = useAsync(
    () => addressToAppName(spender, selectedChainId, openSeaProxyAddress),
    []
  );

  const revoke = async () => {
    const writeContract = new Contract(token.contract.address, token.contract.interface, signer);

    let tx;
    try {
      tx =
        tokenId === undefined
          ? await writeContract.functions.setApprovalForAll(spender, false)
          : await writeContract.functions.approve(ADDRESS_ZERO, tokenId);
    } catch (e) {
      // Ignore issues
      console.log('Ran into issue while revoking', e);
    }

    if (tx) {
      displayTransactionSubmittedToast(toastRef);

      track('Revoked ERC721 allowance', {
        chainId: selectedChainId,
        account,
        spender,
        token: token.contract.address,
        tokenId,
      });

      await tx.wait(1);

      onRevoke(allowance);
    }
  };

  if (loading) {
    return (
      <div>
        <ClipLoader size={10} color={'#000'} loading={loading} />
      </div>
    );
  }

  const spenderDisplay = spenderName || spender;
  const shortenedSpenderDisplay = spenderName || shortenAddress(spender);
  const explorerBaseUrl = getChainExplorerUrl(selectedChainId);

  return (
    <Form inline className="Allowance">
      {/* Display separate spans for the regular and shortened versions of the spender address */}
      {/* The correct one is selected using CSS media-queries */}
      <Form.Label className="AllowanceText">
        <span className="only-mobile-inline">
          <Trans
            i18nKey={tokenId === undefined ? 'dashboard:allowance_unlimited' : 'dashboard:allowance_token_id'}
            values={{ tokenId, spender: shortenedSpenderDisplay }}
            components={[<a className="monospace" href={`${explorerBaseUrl}/address/${spender}`} />]}
          />
        </span>
        <span className="only-desktop-inline">
          <Trans
            i18nKey={tokenId === undefined ? 'dashboard:allowance_unlimited' : 'dashboard:allowance_token_id'}
            values={{ tokenId, spender: spenderDisplay }}
            components={[<a className="monospace" href={`${explorerBaseUrl}/address/${spender}`} />]}
          />
        </span>
      </Form.Label>
      <AllowanceControls revoke={revoke} inputAddress={inputAddress} id={`${token.symbol}-${spender}`} />
    </Form>
  );
}

export default Erc721Allowance;
