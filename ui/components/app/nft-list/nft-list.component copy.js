import React, { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getTokenURI } from '../../../helpers/utils/token-util';
import {
  nonceSortedCompletedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
} from '../../../selectors/transactions';
import { getCurrentChainId } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import NFTListItem from '../nft-list-item';
import Button from '../../ui/button';
import { TOKEN_CATEGORY_HASH } from '../../../helpers/constants/transactions';
import { SWAPS_CHAINID_CONTRACT_ADDRESS_MAP } from '../../../../shared/constants/swaps';
import { TRANSACTION_TYPES } from '../../../../shared/constants/transaction';
import { isEqualCaseInsensitive } from '../../../helpers/utils/util';

const PAGE_INCREMENT = 10;

// When we are on a token page, we only want to show transactions that involve that token.
// In the case of token transfers or approvals, these will be transactions sent to the
// token contract. In the case of swaps, these will be transactions sent to the swaps contract
// and which have the token address in the transaction data.
//
// getTransactionGroupRecipientAddressFilter is used to determine whether a transaction matches
// either of those criteria
const getTransactionGroupRecipientAddressFilter = (
  recipientAddress,
  chainId,
) => {
  return ({ initialTransaction: { txParams } }) => {
    return (
      isEqualCaseInsensitive(txParams?.to, recipientAddress) ||
      (txParams?.to === SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[chainId] &&
        txParams.data.match(recipientAddress.slice(2)))
    );
  };
};

const tokenTransactionFilter = ({
  initialTransaction: { type, destinationTokenSymbol, sourceTokenSymbol },
}) => {
  if (TOKEN_CATEGORY_HASH[type]) {
    return false;
  } else if (type === TRANSACTION_TYPES.SWAP) {
    return destinationTokenSymbol === 'ETH' || sourceTokenSymbol === 'ETH';
  }
  return true;
};

const getFilteredTransactionGroups = (
  transactionGroups,
  hideTokenTransactions,
  tokenAddress,
  chainId,
) => {
  if (hideTokenTransactions) {
    return transactionGroups.filter(tokenTransactionFilter);
  } else if (tokenAddress) {
    return transactionGroups.filter(
      getTransactionGroupRecipientAddressFilter(tokenAddress, chainId),
    );
  }
  return transactionGroups;
};

function localGetTokenURI() {

  return async (tokenAddress, tokenID) => {
      await getTokenURI()(tokenAddress, tokenID);
  };
  
  // console.error(miret);
  // return miret().toString();
}

// const LocalGetListOfTokenByOwner = (tokenAddress, recipientAddress) => {
//   getListOfTokenByOwner(tokenAddress, recipientAddress, 2);
// };

export default function NFTList({ hideTokenTransactions, tokenAddress }) {
  const [limit, setLimit] = useState(PAGE_INCREMENT);
  const t = useI18nContext();

  const unfilteredPendingTransactions = useSelector(
    nonceSortedPendingTransactionsSelector,
  );
  const unfilteredCompletedTransactions = useSelector(
    nonceSortedCompletedTransactionsSelector,
  );
  const chainId = useSelector(getCurrentChainId);

  const pendingTransactions = useMemo(
    () =>
      getFilteredTransactionGroups(
        unfilteredPendingTransactions,
        hideTokenTransactions,
        tokenAddress,
        chainId,
      ),
    [
      hideTokenTransactions,
      tokenAddress,
      unfilteredPendingTransactions,
      chainId,
    ],
  );
  const completedTransactions = useMemo(
    () =>
      getFilteredTransactionGroups(
        unfilteredCompletedTransactions,
        hideTokenTransactions,
        tokenAddress,
        chainId,
      ),
    [
      hideTokenTransactions,
      tokenAddress,
      unfilteredCompletedTransactions,
      chainId,
    ],
  );

  // const tokenURI = localGetTokenURI(
  //   '0x8b3ca8acd097efb6af81216deb8919c003274dee',
  //   30,
  // );

  const tokenURI = useMemo(
    async () =>
      await localGetTokenURI()(
        '0x8b3ca8acd097efb6af81216deb8919c003274dee',
        30,
      ),
    [],
  );

  // const tokenURI = localGetTokenURI(tokenAddress, 5663);
  // const tokenURI = localGetTokenURI(
  //   '0x8b3ca8acd097efb6af81216deb8919c003274dee',
  //   30,
  // );

  // const tokensByOwner = LocalGetListOfTokenByOwner(
  //   '0x9beb905dc224ba26ea18a7cd787053d2e77f8fea',
  //   '0x97670583253a435be047f4839ef525cd783b6505',
  // );

  const viewMore = useCallback(
    () => setLimit((prev) => prev + PAGE_INCREMENT),
    [],
  );

  const pendingLength = pendingTransactions.length;

  return (
    <div className="nft-list">
      {/* <span>Contract Address: {tokenAddress}</span> */}
      <span>URI: {tokenURI}</span>
      {/* <span>tokensByOwner: {tokensByOwner}</span> */}
      <div className="nft-list__transactions">
        {pendingLength > 0 && (
          <div className="nft-list__pending-transactions">
            <div className="nft-list__header">
              {`${t('queue')} (${pendingTransactions.length})`}
            </div>
            {pendingTransactions.map((transactionGroup, index) => (
              <NFTListItem
                isEarliestNonce={index === 0}
                transactionGroup={transactionGroup}
                key={`${transactionGroup.nonce}:${index}`}
              />
            ))}
          </div>
        )}
        <div className="nft-list__completed-transactions">
          {pendingLength > 0 ? (
            <div className="nft-list__header">{t('history')}</div>
          ) : null}
          {completedTransactions.length > 0 ? (
            completedTransactions
              .slice(0, limit)
              .map((transactionGroup, index) => (
                <NFTListItem
                  transactionGroup={transactionGroup}
                  key={`${transactionGroup.nonce}:${limit + index - 10}`}
                />
              ))
          ) : (
            <div className="nft-list__empty">
              <div className="nft-list__empty-text">{t('noTransactions')}</div>
            </div>
          )}
          {completedTransactions.length > limit && (
            <Button
              className="nft-list__view-more"
              type="secondary"
              onClick={viewMore}
            >
              {t('viewMore')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

NFTList.propTypes = {
  hideTokenTransactions: PropTypes.bool,
  tokenAddress: PropTypes.string,
};

NFTList.defaultProps = {
  hideTokenTransactions: false,
  tokenAddress: undefined,
};
