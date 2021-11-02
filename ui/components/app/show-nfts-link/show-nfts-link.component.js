import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useMetricEvent } from '../../../hooks/useMetricEvent';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SHOW_NFT_ROUTE } from '../../../helpers/constants/routes';
import Button from '../../ui/button';
import Box from '../../ui/box/box';
import { TEXT_ALIGN } from '../../../helpers/constants/design-system';
import { detectNewTokens } from '../../../store/actions';

export default function ShowNftsLink({ isMainnet }) {
  const addTokenEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Token Menu',
      name: 'Clicked "Add Token"',
    },
  });
  const t = useI18nContext();
  const history = useHistory();

  return (
    <Box className="import-token-link" textAlign={TEXT_ALIGN.CENTER}>
      {isMainnet && (
        <>
          <Button
            className="import-token-link__link"
            type="link"
            onClick={() => detectNewTokens()}
          >
            {t('refreshList')}
          </Button>
          {t('or')}
        </>
      )}
      <Button
        className="import-token-link__link"
        type="link"
        onClick={() => {
          history.push(SHOW_NFT_ROUTE);
          addTokenEvent();
        }}
      >
        {isMainnet
          ? t('showNFT')
          : t('showNFT').charAt(0).toUpperCase() + t('showNFT').slice(1)}
      </Button>
    </Box>
  );
}

ShowNftsLink.propTypes = {
  isMainnet: PropTypes.bool,
  miaddress: PropTypes.string,
};
