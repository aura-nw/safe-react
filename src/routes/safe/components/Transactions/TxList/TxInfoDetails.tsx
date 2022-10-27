import { Erc721Transfer, Transfer, TokenType } from '@gnosis.pm/safe-react-gateway-sdk'
import { ReactElement, useContext, useEffect, useState } from 'react'
import styled from 'styled-components'

import { fromTokenUnit } from 'src/logic/tokens/utils/humanReadableValue'
import { ZERO_ADDRESS } from 'src/logic/wallets/ethAddresses'
import { EllipsisTransactionDetails } from 'src/routes/safe/components/AddressBook/EllipsisTransactionDetails'
import SendModal from 'src/routes/safe/components/Balances/SendModal'
import { AddressInfo } from './AddressInfo'
import { InfoDetails } from './InfoDetails'
import { TxLocationContext, TxLocationProps } from './TxLocationProvider'
import { getTxTokenData } from './utils'
import { Text } from '@aura/safe-react-components'

const SingleRow = styled.div`
  display: flex;
  align-items: flex-end;
`
const TextStyled = styled(Text)`
  font-weight: 600;
  margin-top: 10px;
  margin-bottom: 10px;
`

type TxInfoDetailsProps = {
  title: string
  address: string
  name?: string | undefined
  avatarUrl?: string | undefined
  toAddress?: string
  toName?: string | undefined
  toAvatarUrl?: string | undefined
  isTransferType?: boolean
  txInfo?: Transfer
  quanlity?: string
}

export const TxInfoDetails = ({
  title,
  address,
  isTransferType,
  quanlity,
  txInfo,
  name,
  avatarUrl,
  toAddress,
  toName,
  toAvatarUrl,
}: TxInfoDetailsProps): ReactElement => {
  const { txLocation } = useContext<TxLocationProps>(TxLocationContext)
  const canRepeatTransaction =
    // is transfer type by context
    isTransferType &&
    // not a Collectible
    txInfo?.transferInfo.type !== TokenType.ERC721 &&
    // in history list
    txLocation === 'history' &&
    // it's outgoing
    txInfo?.direction === 'OUTGOING'

  const [sendModalOpen, setSendModalOpen] = useState(false)
  const sendModalOpenHandler = () => {
    setSendModalOpen(true)
  }
  const onClose = () => {
    setSendModalOpen(false)
  }

  const [sendModalParams, setSendModalParams] = useState<{
    activeScreenType: 'sendCollectible' | 'sendFunds'
    recipientAddress: string
    selectedToken: string | Erc721Transfer
    tokenAmount: string
  }>({
    activeScreenType: 'sendFunds',
    recipientAddress: address,
    selectedToken: ZERO_ADDRESS,
    tokenAmount: '0',
  })

  useEffect(() => {
    if (txInfo) {
      const isCollectible = txInfo.transferInfo.type === TokenType.ERC721
      const { address, value, decimals } = getTxTokenData(txInfo)

      setSendModalParams((prev) => ({
        ...prev,
        activeScreenType: isCollectible ? 'sendCollectible' : 'sendFunds',
        selectedToken: isCollectible ? (txInfo.transferInfo as Erc721Transfer) : address,
        tokenAmount: isCollectible ? '1' : fromTokenUnit(value, Number(decimals)),
      }))
    }
  }, [txInfo])
  return (
    <>
      <InfoDetails title={title} quanlity={quanlity}>
        <SingleRow>
          <AddressInfo address={address} name={name} avatarUrl={avatarUrl} />
          {/* <EllipsisTransactionDetails
          address={address}
          sendModalOpenHandler={canRepeatTransaction ? sendModalOpenHandler : undefined}
        /> */}
        </SingleRow>
        {canRepeatTransaction && <SendModal isOpen={sendModalOpen} onClose={onClose} {...sendModalParams} />}
      </InfoDetails>
      {toAddress && (
        <>
          <TextStyled strong color="white" size="lg">
            To:
          </TextStyled>
          <AddressInfo address={toAddress} name={toName} avatarUrl={toAvatarUrl} />
        </>
      )}
    </>
  )
}
