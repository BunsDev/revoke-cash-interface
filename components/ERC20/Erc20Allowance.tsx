import { track } from '@amplitude/analytics-browser';
import AllowanceControls from 'components/common/AllowanceControls';
import { displayTransactionSubmittedToast } from 'components/common/transaction-submitted-toast';
import { BigNumber, Contract } from 'ethers';
import { useEthereum } from 'lib/hooks/useEthereum';
import { Erc20TokenData, IERC20Allowance } from 'lib/interfaces';
import { fromFloat, shortenAddress } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { formatAllowance } from 'lib/utils/erc20';
import { addressToAppName } from 'lib/utils/whois';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import { useRef, useState } from 'react';
import { useAsync } from 'react-async-hook';
import { Form } from 'react-bootstrap';
import { ClipLoader } from 'react-spinners';
import { toast } from 'react-toastify';

interface Props {
  spender: string;
  allowance: string;
  inputAddress: string;
  token: Erc20TokenData;
  onRevoke: (allowance: IERC20Allowance) => void;
}

function Erc20Allowance({ spender, allowance, inputAddress, token, onRevoke }: Props) {
  const toastRef = useRef();
  const { t } = useTranslation();
  const [updatedAllowance, setUpdatedAllowance] = useState<string | undefined>();
  const { signer, selectedChainId, account } = useEthereum();
  const { result: spenderName, loading } = useAsync(() => addressToAppName(spender, selectedChainId), []);

  const revoke = async () => update('0');

  const update = async (newAllowance: string) => {
    const bnNew = BigNumber.from(fromFloat(newAllowance, token.decimals));
    const writeContract = new Contract(token.contract.address, token.contract.interface, signer);

    let tx;
    // Not all ERC20 contracts allow for simple changes in approval to be made
    // https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    // so we tell the user to revoke instead if the contract doesn't allow the simple use
    // of contract.approve(0)
    try {
      console.debug(`Calling contract.approve(${spender}, ${bnNew.toString()})`);
      tx = await writeContract.functions.approve(spender, bnNew);
    } catch (e) {
      const code = e.error?.code ?? e.code;
      console.debug(`failed, code ${code}`);
      if (code === -32000) {
        toast.error('This token does not support updating allowances, please revoke instead', {
          position: 'top-left',
        });
      }

      // ignore other errors
      console.log('Ran into issue while revoking', e);
    }

    if (tx) {
      displayTransactionSubmittedToast(toastRef);

      if (newAllowance === '0') {
        track('Revoked ERC20 allowance', { chainId: selectedChainId, account, spender, token: token.contract.address });
      } else {
        track('Updated ERC20 allowance', {
          chainId: selectedChainId,
          account,
          spender,
          token: token.contract.address,
          amount: newAllowance,
        });
      }

      await tx.wait(1);
      console.debug('Reloading data');

      if (newAllowance === '0') {
        onRevoke({ spender, allowance });
      } else {
        // TODO: Update allowance order after update
        setUpdatedAllowance(fromFloat(newAllowance, token.decimals));
      }
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
  const formattedAllowance = formatAllowance(updatedAllowance ?? allowance, token.decimals, token.totalSupply);
  const explorerBaseUrl = getChainExplorerUrl(selectedChainId);

  return (
    <Form inline className="Allowance">
      {/* Display separate spans for the regular and shortened versions of the spender address */}
      {/* The correct one is selected using CSS media-queries */}
      <Form.Label className="AllowanceText">
        <span className="only-mobile-inline">
          <Trans
            i18nKey={formattedAllowance === 'Unlimited' ? 'dashboard:allowance_unlimited' : 'dashboard:allowance'}
            values={{ amount: formattedAllowance, spender: shortenedSpenderDisplay }}
            components={[<a className="monospace" href={`${explorerBaseUrl}/address/${spender}`} />]}
          />
        </span>
        <span className="only-desktop-inline">
          <Trans
            i18nKey={formattedAllowance === 'Unlimited' ? 'dashboard:allowance_unlimited' : 'dashboard:allowance'}
            values={{ amount: formattedAllowance, spender: spenderDisplay }}
            components={[<a className="monospace" href={`${explorerBaseUrl}/address/${spender}`} />]}
          />
        </span>
      </Form.Label>
      <AllowanceControls
        revoke={revoke}
        update={update}
        inputAddress={inputAddress}
        id={`${token.symbol}-${spender}`}
      />
    </Form>
  );
}

export default Erc20Allowance;
