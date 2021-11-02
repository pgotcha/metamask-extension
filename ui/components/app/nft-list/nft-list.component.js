import React, { useMemo, useState, useCallback, Component } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { 
  tokenBalanceOf,
  getListOfTokenByOwner, 
  getTokenURI,
  getParsedTokenNFTURI,
} from '../../../helpers/utils/token-util';
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

class NFTList extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    tokenAddress: PropTypes.string.isRequired,
    userAddress: PropTypes.string.isRequired,
    tokenBalance: PropTypes.string.isRequired,
  };

  state = {
    uriTokenList: [],
    tokenImageList: [],
    tokenList: [],
  };

  // eslint-disable-next-line no-useless-constructor
  constructor(props) {
    super(props);
  }

  // async componentDidUpdate() {
  //   console.error('componentDidUpdate', this.props.tokenBalance);

  //   await this.attemptToAutoFillTokenList(
  //     this.props.tokenAddress,
  //     this.props.userAddress,
  //     this.props.tokenBalance,
  //   );
  // }

  async componentDidMount() {
    await this.attemptToAutoFillTokenList(
      this.props.tokenAddress,
      this.props.userAddress,
      this.props.tokenBalance,
    );

    await this.attemptToAutoFillTokenURI(this.props.tokenAddress);

    // await this.attempToAutoFillImages('https://ipfs.io/ipfs/QmQCA6Hfr7357MrQskqsPmcBfGre8WDUUcH4qur15s4ELt/8076');
    // console.error(this.state.uriTokenList[0].toString());
    await this.attempToAutoFillImages();
  }

  async attemptToAutoFillTokenURI(contractAddress) {
    const newListOfTokens = await Promise.all(
      this.state.tokenList.map(async (value) => {
        const uri = await getTokenURI()(contractAddress, value);
        return uri;
      }),
    );

    this.setState({ uriTokenList: newListOfTokens });
  }

  async attempToAutoFillImages() {
    const newImageList = await Promise.all(
      this.state.uriTokenList.map(async (value) => {
        const respData = await getParsedTokenNFTURI(value);
        return respData;
      }),
    );
    this.setState({ tokenImageList: newImageList });
  }

  async attemptToAutoFillTokenList(contractAddress, ownerAddress, balance) {
    const ret = await getListOfTokenByOwner()(
      contractAddress,
      ownerAddress,
      balance,
    );
    this.setState({ tokenList: ret });
  }

  render() {
    const spanlink = this.state.tokenImageList.map((item, i) => {
      return (
        <div key={`divkey_${i}`}>
          <span key={`spankey_${i}`}>{item.imgURI.toString()}</span>
        </div>
      );
    });

    const imagelink = this.state.tokenImageList.map((item, i) => {
      return (
        <div key={`divkey_${i}`}>
          <img
            style={{ width: '10%', margin: '30px 0' }}
            key={`spankey_${i}`}
            src={item.imgURI.toString()}
            alt=""
          ></img>
        </div>
      );
    });

    return (
      <div className="nft-list">
        <div>
          <span>Address: {this.props.userAddress}</span>
        </div>
        <div>
          <span>Balance: {this.props.tokenBalance}</span>
        </div>
        <div>
          <span>Token List: {this.state.tokenList.toString()}</span>
        </div>
        {/* {spanlink} */}
        {imagelink}
        {/* <img src={this.mitokenURI} alt="Italian Trulli"></img> */}
      </div>
    );
  }
}

export default NFTList;
