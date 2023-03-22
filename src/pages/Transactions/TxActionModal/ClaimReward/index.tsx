import { coins, MsgWithdrawDelegatorRewardEncodeObject } from '@cosmjs/stargate'
import { Fragment, useContext, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FilledButton, OutlinedNeutralButton } from 'src/components/Button'
import Gap from 'src/components/Gap'
import { Popup } from 'src/components/Popup'
import Footer from 'src/components/Popup/Footer'
import Header from 'src/components/Popup/Header'
import { getChainInfo, getCoinMinimalDenom, getInternalChainId } from 'src/config'
import { enhanceSnackbarForAction, NOTIFICATIONS } from 'src/logic/notifications'
import enqueueSnackbar from 'src/logic/notifications/store/actions/enqueueSnackbar'
import { MsgTypeUrl } from 'src/logic/providers/constants/constant'
import { createMessage } from 'src/logic/providers/signing'
import { userAccountSelector } from 'src/logic/wallets/store/selectors'
import { extractSafeAddress } from 'src/routes/routes'
import { ICreateSafeTransaction } from 'src/types/transaction'

import { toBase64 } from '@cosmjs/encoding'
import AddressInfo from 'src/components/AddressInfo'
import Amount from 'src/components/TxComponents/Amount'
import { currentSafeWithNames } from 'src/logic/safe/store/selectors'
import { formatNativeToken } from 'src/utils'
import { getNotice, getTitle } from '..'
import { TxSignModalContext } from '../../Queue'
import { ReviewTxPopupWrapper } from '../../styled'
import EditSequence from '../EditSequence'
import { DeleteButton, TxContent } from '../styles'

export default function Execute({
  open,
  onClose,
  data,
  sendTx,
  rejectTx,
  disabled,
  setDisabled,
  confirmTxFromApi,
  changeTxSeqFromApi,
  deleteTx,
}) {
  const { action } = useContext(TxSignModalContext)
  const userWalletAddress = useSelector(userAccountSelector)
  const dispatch = useDispatch()
  const [sequence, setSequence] = useState(data?.txSequence)
  const { ethBalance: balance, nextQueueSeq, sequence: currentSequence } = useSelector(currentSafeWithNames)

  const confirmTx = async () => {
    setDisabled(true)
    const chainInfo = getChainInfo()
    const safeAddress = extractSafeAddress()
    const chainId = chainInfo.chainId

    const denom = getCoinMinimalDenom()
    const sendFee = {
      amount: coins(data?.txDetails?.fee, denom),
      gas: data?.txDetails?.gas.toString(),
    }

    const Data: MsgWithdrawDelegatorRewardEncodeObject = data?.txDetails?.txMessage?.map((msg) => ({
      typeUrl: MsgTypeUrl.GetReward,
      value: {
        delegatorAddress: msg.delegatorAddress,
        validatorAddress: msg.validatorAddress,
      },
    }))
    try {
      dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.SIGN_TX_MSG)))
      const signResult = await createMessage(
        chainId,
        safeAddress,
        MsgTypeUrl.GetReward,
        Data,
        sendFee,
        data?.txSequence,
      )
      if (!signResult) throw new Error()
      const signatures = toBase64(signResult.signatures[0])
      const bodyBytes = toBase64(signResult.bodyBytes)
      const authInfoBytes = toBase64(signResult.authInfoBytes)
      const payload: ICreateSafeTransaction = {
        internalChainId: getInternalChainId(),
        creatorAddress: userWalletAddress,
        signature: signatures,
        bodyBytes: bodyBytes,
        authInfoBytes: authInfoBytes,
        from: safeAddress,
        accountNumber: signResult.accountNumber,
        sequence: signResult.sequence,
        transactionId: data?.id,
      }
      confirmTxFromApi(payload, chainId, safeAddress)
    } catch (error) {
      setDisabled(false)
      console.error(error)
      dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.TX_REJECTED_MSG)))
      onClose()
    }
  }
  const changeTxSequence = async () => {
    setDisabled(true)
    const chainInfo = getChainInfo()
    const safeAddress = extractSafeAddress()
    const chainId = chainInfo.chainId

    const denom = getCoinMinimalDenom()
    const sendFee = {
      amount: coins(data?.txDetails?.fee, denom),
      gas: data?.txDetails?.gas.toString(),
    }

    const Data: MsgWithdrawDelegatorRewardEncodeObject = data?.txDetails?.txMessage?.map((msg) => ({
      typeUrl: MsgTypeUrl.GetReward,
      value: {
        delegatorAddress: msg.delegatorAddress,
        validatorAddress: msg.validatorAddress,
      },
    }))
    try {
      dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.SIGN_TX_MSG)))
      const signResult = await createMessage(chainId, safeAddress, MsgTypeUrl.GetReward, Data, sendFee, sequence)
      if (!signResult) throw new Error()
      const signatures = toBase64(signResult.signatures[0])
      const bodyBytes = toBase64(signResult.bodyBytes)
      const authInfoBytes = toBase64(signResult.authInfoBytes)
      const payload: ICreateSafeTransaction = {
        internalChainId: getInternalChainId(),
        creatorAddress: userWalletAddress,
        signature: signatures,
        bodyBytes: bodyBytes,
        authInfoBytes: authInfoBytes,
        from: safeAddress,
        accountNumber: signResult.accountNumber,
        sequence: signResult.sequence,
        oldTxId: data?.id,
      }
      changeTxSeqFromApi(payload, chainId, safeAddress)
    } catch (error) {
      setDisabled(false)
      console.error(error)
      dispatch(enqueueSnackbar(enhanceSnackbarForAction(NOTIFICATIONS.TX_REJECTED_MSG)))
      onClose()
    }
  }

  return (
    <>
      <Popup open={open} handleClose={onClose} title="">
        <Header onClose={onClose} title={getTitle(action)} />
        <ReviewTxPopupWrapper>
          <p className="label">Claim from: </p>
          {data?.txDetails?.txMessage &&
            data?.txDetails?.txMessage?.map((msg, index) => {
              return (
                <Fragment key={index}>
                  {index != 0 && <Gap height={8} />}
                  <AddressInfo address={msg?.validatorAddress} />
                </Fragment>
              )
            })}
          <Gap height={24} />
          {action == 'delete' ? (
            <TxContent>
              <div>
                <div className="label">Transaction fee</div>
                <div className="value">{formatNativeToken(+data.txDetails?.fee)}</div>
              </div>
              <div>
                <div className="label">Transaction sequence</div>
                <div className="value">{data?.txSequence}</div>
              </div>
              <div className="divider"></div>
              <div>
                <div className="label">Total Allocation Amount</div>
                <div className="value">{formatNativeToken(+data.txDetails?.fee || 0)}</div>
              </div>
            </TxContent>
          ) : (
            <>
              {action == 'change-sequence' && (
                <>
                  <EditSequence defaultSequence={data?.txSequence} sequence={sequence} setSequence={setSequence} />
                  <Gap height={24} />
                </>
              )}
              <Amount label="Total Allocation Amount" amount={formatNativeToken(+data.txDetails?.fee || 0)} />
            </>
          )}
          <div className="notice">{getNotice(action)}</div>
        </ReviewTxPopupWrapper>
        <Footer>
          <OutlinedNeutralButton onClick={onClose}>Back</OutlinedNeutralButton>
          {action == 'delete' ? (
            <DeleteButton onClick={deleteTx}>Delete</DeleteButton>
          ) : (
            <FilledButton
              onClick={() => {
                action == 'confirm'
                  ? confirmTx()
                  : action == 'reject'
                  ? rejectTx()
                  : action == 'change-sequence'
                  ? changeTxSequence()
                  : sendTx()
              }}
              disabled={disabled || +sequence < +currentSequence}
            >
              Submit
            </FilledButton>
          )}
        </Footer>
      </Popup>
    </>
  )
}
