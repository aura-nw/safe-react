import { ReactElement } from 'react'
import { Button, Title, Text } from '@gnosis.pm/safe-react-components'
import Divider from '@material-ui/core/Divider'
import Page from 'src/components/layout/Page'
import Block from 'src/components/layout/Block'
import Link from 'src/components/layout/Link'
import { LOAD_SAFE_ROUTE, OPEN_SAFE_ROUTE } from 'src/routes/routes'
import {
  CardsContainer,
  StyledCard,
  CardContentContainer,
  CardDescriptionContainer,
  StyledTitle,
  StyledButtonLabel,
  StyledButton,
  StyledTextButton,
  StyledButtonBorder,
  StyledBorder,
} from './styles'

function Welcome(): ReactElement {
  return (
    <Page align="center">
      <Block>
        <StyledTitle>
          <Title size="md" strong>
            Welcome to Aura Safe.
          </Title>
          <Title size="xs">
            Aura Safe is the most trusted platform to manage digital assets. <br /> Here is how to get started:
          </Title>
        </StyledTitle>
        <CardsContainer>
          <StyledCard>
            {/* Create Safe */}
            <CardContentContainer>
              <Title size="sm" strong withoutMargin>
                Create Safe
              </Title>
              <CardDescriptionContainer>
                <Text size="xl" color="white">
                  Create a new Safe that is controlled by one or multiple owners.
                </Text>
                <Text size="xl" color="white">
                  You will be required to pay a network fee for creating your new Safe.
                </Text>
              </CardDescriptionContainer>
              <StyledButton size="lg" variant="contained" component={Link} to={OPEN_SAFE_ROUTE}>
                {/* <Button> */}
                <StyledTextButton size="xl">+ Create new Safe</StyledTextButton>
                {/* </Button> */}
              </StyledButton>
            </CardContentContainer>
            <Divider orientation="vertical" flexItem />
            <CardContentContainer>
              <Title size="sm" strong withoutMargin>
                Load Existing Safe
              </Title>
              <CardDescriptionContainer>
                <Text size="xl" color="white">
                  Already have a Safe or want to access it from a different device? Easily load your Safe using your
                  Safe address.
                </Text>
              </CardDescriptionContainer>
              <StyledBorder>
                <StyledButtonBorder iconType="safe" iconSize="sm" size="lg" component={Link} to={LOAD_SAFE_ROUTE}>
                  <StyledButtonLabel size="xl">Add existing Safe</StyledButtonLabel>
                </StyledButtonBorder>
              </StyledBorder>
            </CardContentContainer>
          </StyledCard>
        </CardsContainer>
      </Block>
    </Page>
  )
}

export default Welcome
