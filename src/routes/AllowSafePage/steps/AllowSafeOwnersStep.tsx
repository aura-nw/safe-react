import TableContainer from '@material-ui/core/TableContainer'
import { ReactElement } from 'react'
import { useForm } from 'react-final-form'
import styled from 'styled-components'

import Field from 'src/components/forms/Field'
import TextField from 'src/components/forms/TextField'
import { minMaxLength } from 'src/components/forms/validator'
import Block from 'src/components/layout/Block'
import Col from 'src/components/layout/Col'
import Hairline from 'src/components/layout/Hairline'
import Paragraph from 'src/components/layout/Paragraph'
import Row from 'src/components/layout/Row'
import NetworkLabel from 'src/components/NetworkLabel/NetworkLabel'
import PrefixedEthHashInfo from 'src/components/PrefixedEthHashInfo'
import { getExplorerInfo } from 'src/config'
import { disabled, extraSmallFontSize, lg, md, sm } from 'src/theme/variables'
import { FIELD_SAFE_OWNER_LIST } from '../fields/allowFields'

export const loadSafeOwnersStepLabel = 'Owners'

function AllowSafeOwnersStep(): ReactElement {
  const loadSafeForm = useForm()
  const ownersWithName = loadSafeForm.getState().values[FIELD_SAFE_OWNER_LIST]
  return (
    <>
      <TitleContainer>
        <Paragraph color="primary" noMargin size="lg" data-testid="load-safe-owners-step">
          This Safe on <NetworkLabel /> has {ownersWithName?.length} owners. Optional: Provide a name for each owner.
        </Paragraph>
      </TitleContainer>
      <Hairline />
      <TableContainer>
        <HeaderContainer>
          <Col xs={4}>NAME</Col>
          <Col xs={8}>ADDRESS</Col>
        </HeaderContainer>
        <Hairline />
        <Block margin="md" padding="md">
          {ownersWithName.map(({ address, name }, index) => {
            const ownerFieldName = `owner-address-${address}`
            return (
              <OwnerContainer key={address} data-testid="owner-row">
                <Col xs={4}>
                  <FieldContainer
                    component={TextField}
                    initialValue={name}
                    name={ownerFieldName}
                    placeholder="Owner Name"
                    text="Owner Name"
                    type="text"
                    validate={minMaxLength(0, 50)}
                    testId={`load-safe-owner-name-${index}`}
                  />
                </Col>
                <Col xs={8}>
                  <OwnerAddressContainer>
                    <PrefixedEthHashInfo hash={address} showAvatar showCopyBtn explorerUrl={getExplorerInfo(address)} />
                  </OwnerAddressContainer>
                </Col>
              </OwnerContainer>
            )
          })}
        </Block>
      </TableContainer>
    </>
  )
}

export default AllowSafeOwnersStep

const TitleContainer = styled(Block)`
  padding: ${md} ${lg};
`

const HeaderContainer = styled(Row)`
  padding: ${sm} ${lg};
  color: ${disabled};
  font-size: ${extraSmallFontSize};
`

const OwnerContainer = styled(Row)`
  padding: 0 ${lg};
  margin-bottom: 12px;
`

const OwnerAddressContainer = styled(Row)`
  align-items: center;
  margin-left: ${sm};
`

const FieldContainer = styled(Field)`
  margin-right: ${sm};
`
