import log from 'loglevel';
import BigNumber from 'bignumber.js';
import {
  conversionUtil,
  multiplyCurrencies,
} from '../../../shared/modules/conversion.utils';
import * as util from './util';
import { formatCurrency } from './confirm-tx.util';
import fetchWithCache from './fetch-with-cache';

const DEFAULT_SYMBOL = '';

async function getSymbolFromContract(tokenAddress) {
  const token = util.getContractAtAddress(tokenAddress);

  try {
    const result = await token.symbol();
    return result[0];
  } catch (error) {
    log.warn(
      `symbol() call for token at address ${tokenAddress} resulted in error:`,
      error,
    );
    return undefined;
  }
}
// POL
async function parseTokenNFTURI(tokenURL) {
  // console.error('Token URL: ', tokenURL);
  const response = await fetchWithCache(
    tokenURL,
    { method: 'GET', mode: 'cors' },
    { cacheRefreshTime: 600000 },
  );
  const retorno = JSON.parse(JSON.stringify(response));
  // console.error('parseTokenNFTURI JSON: ', JSON.stringify(response));
  // console.error('parseTokenNFTURI: ', JSON.stringify(util.valuesFor(response)));
  const imageuri = retorno.image.toString();
  const retImage = imageuri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  // console.error('parseTokenNFTURI Image: ', retImage);
  return retImage;
}

// POL
async function getBalanceFromOwnerAddress(tokenAddress, ownerAddress) {
  const token = util.getContractAtAddress(tokenAddress);

  try {
    const result = await token.balanceOf(ownerAddress);

    return result;
  } catch (error) {
    log.warn(
      `balanceOf() call for token at address ${ownerAddress} resulted in error:`,
      error,
    );
    return undefined;
  }
}

// POL
async function getTokenOfOwnerAddresByIndex(tokenAddress, ownerAddress, index) {
  const token = util.getContractAtAddress(tokenAddress);

  try {
    const result = await token.tokenOfOwnerByIndex(ownerAddress, index);
    const valor = util.valuesFor(result[0]);

    // console.error('getTokenOfOwnerAddresByIndex:', valor[1]);
    return valor[1];
  } catch (error) {
    log.warn(
      `getTokenOfOwnerAddresByIndex() call for token at address ${ownerAddress} resulted in error:`,
      error,
    );
    return undefined;
  }
}

// POL
async function getTokenURIByID(tokenAddress, tokenID) {
  const token = util.getContractAtAddress(tokenAddress);

  try {
    // eslint-disable-next-line radix
    const result = await token.tokenURI(parseInt(tokenID));
    const retorno = result[0];
    // console.error('tokenURI:', retorno);
    return retorno;
  } catch (error) {
    log.warn(
      `tokenURI() call for token at token id ${tokenID} resulted in error:`,
      error,
    );
    return undefined;
  }
}

async function getDecimalsFromContract(tokenAddress) {
  const token = util.getContractAtAddress(tokenAddress);

  try {
    const result = await token.decimals();
    const decimalsBN = result[0];
    return decimalsBN?.toString();
  } catch (error) {
    log.warn(
      `decimals() call for token at address ${tokenAddress} resulted in error:`,
      error,
    );
    return '0'; // POL before were undefined
  }
}

function getTokenMetadata(tokenAddress, tokenList) {
  const casedTokenList = Object.keys(tokenList).reduce((acc, base) => {
    return {
      ...acc,
      [base.toLowerCase()]: tokenList[base],
    };
  }, {});
  return tokenAddress && casedTokenList[tokenAddress.toLowerCase()];
}

// POL
async function getBalanceOf(tokenAddress, tokenList, ownerAddress) {
  let balance = await getBalanceFromOwnerAddress(tokenAddress, ownerAddress);

  if (!balance) {
    const contractMetadataInfo = getTokenMetadata(tokenAddress, tokenList);

    if (contractMetadataInfo) {
      balance = contractMetadataInfo.balance;
    }
  }

  return balance;
}

// POL
async function getTokenOfOwnerByIndex(
  tokenAddress,
  ownerAddress,
  tokenBalance,
) {
  const listOfTokens = [];

  for (let i = 0; i < tokenBalance; i++) {
    const value = await getTokenOfOwnerAddresByIndex(
      tokenAddress,
      ownerAddress,
      i,
    );
    listOfTokens.push(value);
  }

  return listOfTokens;
}

// POL
async function getTokenURIFromOwnerByID(tokenAddress, tokenID) {
  const tokenURI = await getTokenURIByID(tokenAddress, tokenID);
  return tokenURI;
}

async function getSymbol(tokenAddress, tokenList) {
  let symbol = await getSymbolFromContract(tokenAddress);

  if (!symbol) {
    const contractMetadataInfo = getTokenMetadata(tokenAddress, tokenList);

    if (contractMetadataInfo) {
      symbol = contractMetadataInfo.symbol;
    }
  }

  return symbol;
}

async function getDecimals(tokenAddress, tokenList) {
  let decimals = await getDecimalsFromContract(tokenAddress);

  if (!decimals || decimals === '0') {
    const contractMetadataInfo = getTokenMetadata(tokenAddress, tokenList);

    if (contractMetadataInfo) {
      decimals = contractMetadataInfo.decimals?.toString();
    }
  }

  return decimals;
}

// POL
export async function getParsedTokenNFTURI(tokenURL) {
  let resp;
  try {
    resp = await parseTokenNFTURI(tokenURL);
  } catch (error) {
    log.warn(
      `getParsedTokenNFTURI() calls for tokenURL ${tokenURL} resulted in error:`,
      error,
    );
  }

  return {
    imgURI: resp || 'http://',
  };
}


export async function getSymbolAndDecimals(tokenAddress, tokenList) {
  let symbol, decimals;

  try {
    symbol = await getSymbol(tokenAddress, tokenList);
    decimals = await getDecimals(tokenAddress, tokenList);
  } catch (error) {
    log.warn(
      `symbol() and decimal() calls for token at address ${tokenAddress} resulted in error:`,
      error,
    );
  }

  return {
    symbol: symbol || DEFAULT_SYMBOL,
    decimals: decimals || 0,
  };
}

// POL
export function tokenBalanceOf() {
  const tokens = {};

  return async (address, tokenList, ownerAddress) => {
    if (tokens[address]) {
      return tokens[address];
    }

    const balance = await getBalanceOf(address, tokenList, ownerAddress);

    return balance;
  };
}

export function getListOfTokenByOwner() {
  return async (tokenAddress, ownerAddress, tokenBalance) => {
    // console.error(`getListOfTokenByOwner: ${tokenAddress} - ${ownerAddress} - ${tokenBalance}`);

    const listOfTokens = await getTokenOfOwnerByIndex(
      tokenAddress,
      ownerAddress,
      tokenBalance,
    );
    // console.error(listOfTokens);
    return listOfTokens;
  };
}

export function getTokenURI() {
  return async (tokenAddress, tokenID) => {
    const tokenURI = await getTokenURIFromOwnerByID(tokenAddress, tokenID);
    // console.error(tokenURI);
    return tokenURI;
  };
}

export function tokenInfoGetter() {
  const tokens = {};

  return async (address, tokenList) => {
    if (tokens[address]) {
      return tokens[address];
    }

    tokens[address] = await getSymbolAndDecimals(address, tokenList);

    return tokens[address];
  };
}

export function calcTokenAmount(value, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0));
  return new BigNumber(String(value)).div(multiplier);
}

export function calcTokenValue(value, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0));
  return new BigNumber(String(value)).times(multiplier);
}

/**
 * Attempts to get the address parameter of the given token transaction data
 * (i.e. function call) per the Human Standard Token ABI, in the following
 * order:
 *   - The '_to' parameter, if present
 *   - The first parameter, if present
 *
 * @param {Object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A lowercase address string.
 */
export function getTokenAddressParam(tokenData = {}) {
  const value = tokenData?.args?._to || tokenData?.args?.[0];
  return value?.toString().toLowerCase();
}

/**
 * Gets the '_value' parameter of the given token transaction data
 * (i.e function call) per the Human Standard Token ABI, if present.
 *
 * @param {Object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A decimal string value.
 */
export function getTokenValueParam(tokenData = {}) {
  return tokenData?.args?._value?.toString();
}

export function getTokenValue(tokenParams = []) {
  const valueData = tokenParams.find((param) => param.name === '_value');
  return valueData && valueData.value;
}

/**
 * Get the token balance converted to fiat and optionally formatted for display
 *
 * @param {number} [contractExchangeRate] - The exchange rate between the current token and the native currency
 * @param {number} conversionRate - The exchange rate between the current fiat currency and the native currency
 * @param {string} currentCurrency - The currency code for the user's chosen fiat currency
 * @param {string} [tokenAmount] - The current token balance
 * @param {string} [tokenSymbol] - The token symbol
 * @param {boolean} [formatted] - Whether the return value should be formatted or not
 * @param {boolean} [hideCurrencySymbol] - excludes the currency symbol in the result if true
 * @returns {string|undefined} The token amount in the user's chosen fiat currency, optionally formatted and localize
 */
export function getTokenFiatAmount(
  contractExchangeRate,
  conversionRate,
  currentCurrency,
  tokenAmount,
  tokenSymbol,
  formatted = true,
  hideCurrencySymbol = false,
) {
  // If the conversionRate is 0 (i.e. unknown) or the contract exchange rate
  // is currently unknown, the fiat amount cannot be calculated so it is not
  // shown to the user
  if (
    conversionRate <= 0 ||
    !contractExchangeRate ||
    tokenAmount === undefined
  ) {
    return undefined;
  }

  const currentTokenToFiatRate = multiplyCurrencies(
    contractExchangeRate,
    conversionRate,
    {
      multiplicandBase: 10,
      multiplierBase: 10,
    },
  );
  const currentTokenInFiat = conversionUtil(tokenAmount, {
    fromNumericBase: 'dec',
    fromCurrency: tokenSymbol,
    toCurrency: currentCurrency.toUpperCase(),
    numberOfDecimals: 2,
    conversionRate: currentTokenToFiatRate,
  });
  let result;
  if (hideCurrencySymbol) {
    result = formatCurrency(currentTokenInFiat, currentCurrency);
  } else if (formatted) {
    result = `${formatCurrency(
      currentTokenInFiat,
      currentCurrency,
    )} ${currentCurrency.toUpperCase()}`;
  } else {
    result = currentTokenInFiat;
  }
  return result;
}
