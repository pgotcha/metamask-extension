import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import NFTItem from '../../ui/nft-item';
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import TransactionStatus from '../transaction-status/transaction-status.component';
import TransactionIcon from '../transaction-icon';
import {
  TRANSACTION_GROUP_CATEGORIES,
  TRANSACTION_STATUSES,
} from '../../../../shared/constants/transaction';
// import {
//   getListOfTokenByOwner,
//   getTokenURI,
// } from '../../../helpers/utils/token-util';

export default function NFTListItem({
  transactionGroup,
  isEarliestNonce = false,
}) {
  const t = useI18nContext();
  const history = useHistory();
  const [setShowDetails] = useState(false);

  // const tokenURI = getTokenURI();
  // const listOfTokenByOwner = getListOfTokenByOwner();

  const {
    initialTransaction: { id },
    primaryTransaction: { err, status },
  } = transactionGroup;

  const {
    title,
    subtitle,
    subtitleContainsOrigin,
    date,
    category,
    primaryCurrency,
    secondaryCurrency,
    displayedStatusKey,
    isPending,
  } = useTransactionDisplayData(transactionGroup);

  const isSignatureReq =
    category === TRANSACTION_GROUP_CATEGORIES.SIGNATURE_REQUEST;
  const isApproval = category === TRANSACTION_GROUP_CATEGORIES.APPROVAL;
  const isUnapproved = status === TRANSACTION_STATUSES.UNAPPROVED;

  const className = classnames('transaction-list-item', {
    'transaction-list-item--unconfirmed':
      isPending ||
      [
        TRANSACTION_STATUSES.FAILED,
        TRANSACTION_STATUSES.DROPPED,
        TRANSACTION_STATUSES.REJECTED,
      ].includes(displayedStatusKey),
  });

  const toggleShowDetails = useCallback(() => {
    if (isUnapproved) {
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${id}`);
      return;
    }
    setShowDetails((prev) => !prev);
  }, [isUnapproved, history, id]);

  return (
    <>
      <NFTItem
        onClick={toggleShowDetails}
        className={className}
        title={title}
        icon={
          <TransactionIcon category={category} status={displayedStatusKey} />
        }
        subtitle={
          <h3>
            <TransactionStatus
              isPending={isPending}
              isEarliestNonce={isEarliestNonce}
              error={err}
              date={date}
              status={displayedStatusKey}
            />
            <span
              className={
                subtitleContainsOrigin
                  ? 'transaction-list-item__origin'
                  : 'transaction-list-item__address'
              }
              title={subtitle}
            >
              {subtitle}
            </span>
          </h3>
        }
        rightContent={
          !isSignatureReq &&
          !isApproval && (
            <>
              <h2
                title={primaryCurrency}
                className="transaction-list-item__primary-currency"
              >
                {primaryCurrency}
              </h2>
              <h3 className="transaction-list-item__secondary-currency">
                {secondaryCurrency}
              </h3>
            </>
          )
        }
      ></NFTItem>
    </>
  );
}

NFTListItem.propTypes = {
  transactionGroup: PropTypes.object.isRequired,
  isEarliestNonce: PropTypes.bool,
};
