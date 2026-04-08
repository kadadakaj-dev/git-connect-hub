import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="sk" dir="ltr">
    <Head />
    <Preview>{`Váš prihlasovací odkaz – ${siteName}`}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Heading style={headerTitle}>{siteName}</Heading>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Váš prihlasovací odkaz</Heading>
          <Text style={text}>
            Kliknite na tlačidlo nižšie pre prihlásenie do {siteName}.
            Platnosť odkazu je obmedzená.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Prihlásiť sa
          </Button>
          <Text style={footerText}>
            Ak ste o tento odkaz nežiadali, môžete tento e-mail pokojne ignorovať.
          </Text>
        </Section>
        <Section style={footer}>
          <Text style={footerBrand}>{siteName}</Text>
          <Text style={footerContact}>Kontakt: booking@fyzioafit.sk</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
const wrapper = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '20px auto', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)' }
const header = { background: 'linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%)', padding: '36px 30px', textAlign: 'center' as const }
const headerTitle = { color: '#ffffff', margin: '0', fontSize: '28px', fontWeight: '700' as const, letterSpacing: '1.5px' }
const content = { padding: '40px 30px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a2b42', margin: '0 0 20px' }
const text = { fontSize: '16px', color: '#4b5e78', lineHeight: '1.5', margin: '0 0 25px' }
const button = { backgroundColor: '#4a90d9', color: '#ffffff', fontSize: '14px', borderRadius: '10px', padding: '14px 28px', textDecoration: 'none', fontWeight: '600' as const }
const footerText = { fontSize: '12px', color: '#6b7c94', margin: '30px 0 0' }
const footer = { backgroundColor: '#f0f4f8', padding: '20px 30px', textAlign: 'center' as const, borderTop: '1px solid #dde5ef' }
const footerBrand = { color: '#4a90d9', margin: '0 0 10px', fontSize: '16px', fontWeight: '500' as const }
const footerContact = { color: '#6b7c94', margin: '0', fontSize: '14px' }
