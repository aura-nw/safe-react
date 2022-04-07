import { makeStyles } from '@material-ui/core/styles'
import { memo, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { toTokenUnit } from 'src/logic/tokens/utils/humanReadableValue'
import { getChainInfo, getExplorerInfo, getInternalChainId, getNativeCurrency, _getChainId } from 'src/config'
import Divider from 'src/components/Divider'
import Block from 'src/components/layout/Block'
import Col from 'src/components/layout/Col'
import Hairline from 'src/components/layout/Hairline'
import Img from 'src/components/layout/Img'
import Paragraph from 'src/components/layout/Paragraph'
import Row from 'src/components/layout/Row'
import PrefixedEthHashInfo from 'src/components/PrefixedEthHashInfo'
import { sameAddress, ZERO_ADDRESS } from 'src/logic/wallets/ethAddresses'
import SafeInfo from 'src/routes/safe/components/Balances/SendModal/SafeInfo'
import { setImageToPlaceholder } from 'src/routes/safe/components/Balances/utils'
import { extendedSafeTokensSelector } from 'src/routes/safe/container/selector'
import { SpendingLimit } from 'src/logic/safe/store/models/safe'
import { sameString } from 'src/utils/strings'
import { TokenProps } from 'src/logic/tokens/store/model/token'
import { RecordOf } from 'immutable'
import { EstimationStatus } from 'src/logic/hooks/useEstimateTransactionGas'
import { useEstimationStatus } from 'src/logic/hooks/useEstimationStatus'
import { ButtonStatus, Modal } from 'src/components/Modal'
import { ReviewInfoText } from 'src/components/ReviewInfoText'

import { styles } from './style'
import { EditableTxParameters } from 'src/routes/safe/components/Transactions/helpers/EditableTxParameters'
import { TxParametersDetail } from 'src/routes/safe/components/Transactions/helpers/TxParametersDetail'
import { TxParameters } from 'src/routes/safe/container/hooks/useTransactionParameters'
import { ModalHeader } from '../ModalHeader'
import {
  extractSafeAddress,
  extractShortChainName,
  getPrefixedSafeAddressSlug,
  history,
  SAFE_ADDRESS_SLUG,
  SAFE_ROUTES,
} from 'src/routes/routes'
import ExecuteCheckbox from 'src/components/ExecuteCheckbox'
import { getNativeCurrencyAddress } from 'src/config/utils'
import { ICreateSafeTransaction } from 'src/types/transaction'
import { createSafeTransaction, getAccountOnChain, getMChainsConfig, signSafeTransaction } from 'src/services'
import { coins, MsgSendEncodeObject, SignerData, SigningStargateClient } from '@cosmjs/stargate'
import enqueueSnackbar from 'src/logic/notifications/store/actions/enqueueSnackbar'
import { enhanceSnackbarForAction, NOTIFICATIONS } from 'src/logic/notifications'
import { userAccountSelector } from 'src/logic/wallets/store/selectors'
import { ChainInfo } from '@gnosis.pm/safe-react-gateway-sdk'
import { generatePath } from 'react-router-dom'
// import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import { calculateFee, GasPrice, makeMultisignedTx, StargateClient } from '@cosmjs/stargate'
import { fromBase64, toBase64 } from '@cosmjs/encoding'
import { MsgSend, MnemonicKey, Coins, LCDClient, Fee } from '@terra-money/terra.js';
import { ConnectType, CreateTxFailed, SignResult, Timeout, TxFailed, TxResult, TxUnspecifiedError, useConnectedWallet, UserDenied, useWallet } from '@terra-money/wallet-provider'
import { loadLastUsedProvider } from 'src/logic/wallets/store/middlewares/providerWatcher'

const useStyles = makeStyles(styles)
let chains: ChainInfo[] = []
// let isDisabled = false

export type ReviewTxProp = {
  recipientAddress: string
  recipientName?: string
  amount: string
  txRecipient: string
  token: string
  txType?: string
  tokenSpendingLimit?: SpendingLimit
}

type ReviewTxProps = {
  onClose: () => void
  onPrev: () => void
  tx: ReviewTxProp
}

const useTxData = (
  isSendingNativeToken: boolean,
  txAmount: string,
  recipientAddress: string,
  txToken?: RecordOf<TokenProps>,
): string => {
  const [data, setData] = useState('')

  // useEffect(() => {
  //   const updateTxDataAsync = async () => {
  //     if (!txToken) {
  //       return
  //     }

  //     let txData = EMPTY_DATA
  //     if (!isSendingNativeToken) {
  //       const ERC20TokenInstance = getERC20TokenContract(txToken.address)
  //       const erc20TransferAmount = toTokenUnit(txAmount, txToken.decimals)
  //       txData = ERC20TokenInstance.methods.transfer(recipientAddress, erc20TransferAmount).encodeABI()
  //     }
  //     setData(txData)
  //   }

  //   updateTxDataAsync()
  // }, [isSendingNativeToken, recipientAddress, txAmount, txToken])

  return data
}

const ReviewSendFundsTx = ({ onClose, onPrev, tx }: ReviewTxProps): React.ReactElement => {
  const classes = useStyles()
  const dispatch = useDispatch()
  const safeAddress = extractSafeAddress()
  const nativeCurrency = getNativeCurrency()
  const tokens: any = useSelector(extendedSafeTokensSelector)
  const txToken = useMemo(() => tokens.find((token) => sameAddress(token.address, tx.token)), [tokens, tx.token])
  const isSendingNativeToken = useMemo(() => sameAddress(txToken?.address, getNativeCurrencyAddress()), [txToken])
  // const txRecipient = isSendingNativeToken ? tx.recipientAddress : txToken?.address || ''
  const txRecipient = tx.recipientAddress || ''
  const txValue = isSendingNativeToken ? toTokenUnit(tx.amount, nativeCurrency.decimals) : '0'
  const data = useTxData(isSendingNativeToken, tx.amount, tx.recipientAddress, txToken)
  const [manualSafeTxGas, setManualSafeTxGas] = useState('0')
  const [manualGasPrice, setManualGasPrice] = useState<string | undefined>()
  const [manualGasLimit, setManualGasLimit] = useState<string | undefined>()
  const [isDisabled, setDisabled] = useState(false)
  // const { address: safeAddress, ethBalance, name: safeName } = useSelector(currentSafeWithNames)

  // const {
  //   gasCostFormatted,
  //   gasPriceFormatted,
  //   gasLimit,
  //   gasEstimation,
  //   txEstimationExecutionStatus,
  //   isExecution,
  //   isCreation,
  //   isOffChainSignature,
  // } = useEstimateTransactionGas({
  //   txData: data,
  //   txRecipient,
  //   txType: tx.txType,
  //   txAmount: txValue,
  //   safeTxGas: manualSafeTxGas,
  //   manualGasPrice,
  //   manualGasLimit,
  // })

  const {
    gasCostFormatted,
    gasPriceFormatted,
    gasLimit,
    gasEstimation,
    txEstimationExecutionStatus,
    isExecution,
    isCreation,
    isOffChainSignature,
  } = {
    gasCostFormatted: '',
    gasPriceFormatted: '1',
    gasLimit: '100000',
    gasEstimation: '0',
    txEstimationExecutionStatus: EstimationStatus.SUCCESS,
    isExecution: false,
    isCreation: true,
    isOffChainSignature: true,
  }

  const [buttonStatus, setButtonStatus] = useEstimationStatus(txEstimationExecutionStatus)
  const isSpendingLimit = sameString(tx.txType, 'spendingLimit')
  const [executionApproved, setExecutionApproved] = useState<boolean>(true)
  const doExecute = isExecution && executionApproved
  const userWalletAddress = useSelector(userAccountSelector)
  const {
    connect
  } = useWallet();
  const connectedWallet = useConnectedWallet()

  const submitTx = async (txParameters: TxParameters) => {
    setDisabled(true)
    const lastUsedProvider = await loadLastUsedProvider()
    if (lastUsedProvider?.toLowerCase() === 'keplr') {
      signTransactionWithKeplr(safeAddress)
    } else {
      signTransactionWithTerra(safeAddress)
    }
  }

  const signTransactionWithTerra = async (safeAddress: string) => {
    const denom = 'uluna'
    if (!connectedWallet) {
      connect(ConnectType.EXTENSION)
      signTransactionWithTerra('')
      return
    }

    const amountFinal = Math.floor(Number(tx?.amount) * Math.pow(10, 6)).toString() || ''
    const send = new MsgSend(
      safeAddress,
      txRecipient,
      { uluna: amountFinal }
    );

    connectedWallet!
      .sign({
        fee: new Fee(Number(manualGasLimit) || Number(gasLimit), String(manualGasPrice || gasPriceFormatted).concat(denom)),
        msgs: [send],
      })
      .then(async (signResult: SignResult) => {
        // call api to create Tx
        const signatures = signResult.result.signatures[0]

        const data: ICreateSafeTransaction = {
          from: safeAddress,
          to: txRecipient || '',
          amount: amountFinal,
          gasLimit: manualGasLimit || '100000',
          internalChainId: getInternalChainId(),
          fee: Number(manualGasPrice) || 1,
          creatorAddress: userWalletAddress,
          signature: signatures,
          bodyBytes: '',
        }

        createTxFromApi(data)
      })
      .catch((error: unknown) => {
        if (error instanceof UserDenied) {
          dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.TX_REJECTED_MSG)))
        } else if (error instanceof CreateTxFailed) {
          dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.TX_CREATE_FAILED_MSG)))
        } else if (error instanceof TxFailed) {
          dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.TX_FAILED_MSG)))
        } else if (error instanceof Timeout) {
          // setTxError('Timeout');
          dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.TX_TIMEOUT_MSG)))
        } else if (error instanceof TxUnspecifiedError) {
          dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.SOMETHING_WENT_WRONG)))
        } else {
          dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.SOMETHING_WENT_WRONG)))
        }
        onClose()
      });

  }

  const signTransactionWithKeplr = async (safeAddress: string) => {
    const chainInfo = getChainInfo()
    const chainId = chainInfo.chainId
    const listChain = await getMChainsConfig()
    const denom = listChain.find((x) => x.chainId === chainId)?.denom || ''
    if (window.keplr) {
      await window.keplr.enable(chainId)
      window.keplr.defaultOptions = {
        sign: {
          preferNoSetMemo: true,
          preferNoSetFee: true,
          disableBalanceCheck: true,
        },
      }
    }

    if (window.getOfflineSignerOnlyAmino) {
      const offlineSigner = window.getOfflineSignerOnlyAmino(chainId)
      const accounts = await offlineSigner.getAccounts()
      // const tendermintUrl = chainInfo?.rpcUri?.value
      const client = await SigningStargateClient.offline(offlineSigner)

      const amountFinal = Math.floor(Number(tx?.amount) * Math.pow(10, 6)).toString() || ''

      const signingInstruction = await (async () => {
        // get account on chain from API
        const {
          ErrorCode,
          Data: accountOnChainResult,
          Message,
        } = await getAccountOnChain(safeAddress, getInternalChainId())
        // const accountOnChain = await client.getAccount(safeAddress)

        return {
          accountNumber: accountOnChainResult?.accountNumber,
          sequence: accountOnChainResult?.sequence,
          memo: '',
        }
      })()

      const msgSend: any = {
        fromAddress: safeAddress,
        toAddress: txRecipient,
        amount: coins(amountFinal, denom),
      }
      const msg: MsgSendEncodeObject = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: msgSend,
      }

      // calculate fee
      const gasPrice = GasPrice.fromString(String(manualGasPrice || gasPriceFormatted).concat(denom))
      // const sendFee = calculateFee(Number(manualGasLimit) || Number(gasLimit), gasPrice)
      const sendFee = {
        amount: coins(manualGasPrice || gasPriceFormatted, denom),
        gas: manualGasLimit || gasLimit,
      }

      const signerData: SignerData = {
        accountNumber: signingInstruction.accountNumber || 0,
        sequence: signingInstruction.sequence || 0,
        chainId: chainId,
      }

      try {
        // Sign On Wallet
        dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.SIGN_TX_MSG)))

        const signResult = await client.sign(accounts[0]?.address, [msg], sendFee, '', signerData)

        const signatures = toBase64(signResult.signatures[0])
        const bodyBytes = toBase64(signResult.bodyBytes)

        // call api to create transaction
        const data: ICreateSafeTransaction = {
          from: safeAddress,
          to: txRecipient || '',
          amount: amountFinal,
          gasLimit: manualGasLimit || '100000',
          internalChainId: getInternalChainId(),
          fee: Number(manualGasPrice) || 1,
          creatorAddress: userWalletAddress,
          signature: signatures,
          bodyBytes: bodyBytes,
        }

        createTxFromApi(data)
      } catch (error) {
        dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.TX_REJECTED_MSG)))
        onClose()
      }
    }
  }

  const createTxFromApi = async (data: any) => {
    const { ErrorCode, Data: safeData, Message } = await createSafeTransaction(data)
    if (ErrorCode === 'SUCCESSFUL') {
      setButtonStatus(ButtonStatus.READY)
      onClose()

      // navigate to tx details
      const prefixedSafeAddress = getPrefixedSafeAddressSlug({ shortName: extractShortChainName(), safeAddress })
      const txRoute = generatePath(SAFE_ROUTES.TRANSACTIONS_SINGULAR, {
        [SAFE_ADDRESS_SLUG]: prefixedSafeAddress,
        id: safeData,
      })
      history.push(txRoute)
    } else {
      if (ErrorCode === 'E028') {
        dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.CREATE_SAFE_PENDING_EXECUTE_MSG)))
      } else {
        dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.TX_FAILED_MSG)))
      }

      onClose()
    }
  }

  const closeEditModalCallback = (txParameters: TxParameters) => {
    const oldGasPrice = gasPriceFormatted
    const newGasPrice = txParameters.ethGasPrice
    const oldSafeTxGas = gasEstimation
    const newSafeTxGas = txParameters.safeTxGas

    if (newGasPrice && oldGasPrice !== newGasPrice) {
      setManualGasPrice(txParameters.ethGasPrice)
    }

    if (txParameters.ethGasLimit && gasLimit !== txParameters.ethGasLimit) {
      setManualGasLimit(txParameters.ethGasLimit)
    }

    if (newSafeTxGas && oldSafeTxGas !== newSafeTxGas) {
      setManualSafeTxGas(newSafeTxGas)
    }
  }

  return (
    <EditableTxParameters
      isOffChainSignature={isOffChainSignature}
      isExecution={doExecute}
      ethGasLimit={gasLimit}
      ethGasPrice={gasPriceFormatted}
      safeTxGas={gasEstimation}
      closeEditModalCallback={closeEditModalCallback}
    >
      {(txParameters, toggleEditMode) => (
        <>
          {/* Header */}
          <ModalHeader onClose={onClose} subTitle="2 of 2" title="Send funds" />

          <Hairline />

          <Block className={classes.container}>
            {/* SafeInfo */}
            <SafeInfo />
            <Divider withArrow />

            {/* Recipient */}
            <Row margin="xs">
              <Paragraph color="disabled" noMargin size="md" style={{ letterSpacing: '-0.5px' }}>
                Recipient
              </Paragraph>
            </Row>
            <Row align="center" margin="md" data-testid="recipient-review-step">
              <Col xs={12}>
                <PrefixedEthHashInfo
                  hash={tx.recipientAddress}
                  name={tx.recipientName}
                  showCopyBtn
                  showAvatar
                  explorerUrl={getExplorerInfo(tx.recipientAddress)}
                />
              </Col>
            </Row>

            {/* Amount */}
            <Row margin="xs">
              <Paragraph color="disabled" noMargin size="md" style={{ letterSpacing: '-0.5px' }}>
                Amount
              </Paragraph>
            </Row>
            <Row align="center" margin="md">
              <Img alt={txToken?.name as string} height={28} onError={setImageToPlaceholder} src={txToken?.logoUri} />
              <Paragraph
                className={classes.amount}
                noMargin
                size="md"
                data-testid={`amount-${txToken?.symbol as string}-review-step`}
              >
                {tx.amount} {txToken?.symbol}
              </Paragraph>
            </Row>

            {isExecution && !isSpendingLimit && <ExecuteCheckbox onChange={setExecutionApproved} />}

            {/* Tx Parameters */}
            {/* FIXME TxParameters should be updated to be used with spending limits */}
            {!isSpendingLimit && (
              <TxParametersDetail
                txParameters={txParameters}
                onEdit={toggleEditMode}
                isTransactionCreation={isCreation}
                isTransactionExecution={doExecute}
                isOffChainSignature={isOffChainSignature}
              />
            )}
          </Block>

          {/* Disclaimer */}
          {/* FIXME Estimation should be fixed to be used with spending limits */}
          {!isSpendingLimit && txEstimationExecutionStatus !== EstimationStatus.LOADING && (
            <ReviewInfoText
              gasCostFormatted={gasCostFormatted}
              isCreation={true}
              isExecution={true}
              isOffChainSignature={true}
              safeNonce={txParameters.safeNonce}
              txEstimationExecutionStatus={txEstimationExecutionStatus}
            />
          )}

          {/* Footer */}
          <Modal.Footer withoutBorder={!isSpendingLimit && buttonStatus !== ButtonStatus.LOADING}>
            <Modal.Footer.Buttons
              cancelButtonProps={{ onClick: onPrev, text: 'Back' }}
              confirmButtonProps={{
                onClick: () => submitTx(txParameters),
                status: buttonStatus,
                text: txEstimationExecutionStatus === EstimationStatus.LOADING ? 'Estimating' : undefined,
                testId: 'submit-tx-btn',
                disabled: isDisabled,
              }}
            />
          </Modal.Footer>
        </>
      )}
    </EditableTxParameters>
  )
}

export default ReviewSendFundsTx
