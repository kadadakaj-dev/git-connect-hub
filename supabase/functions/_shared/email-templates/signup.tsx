/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="sk" dir="ltr">
    <Head />
    <Preview>Potvrďte svoj e-mail – FYZIO&FIT</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Heading style={headerTitle}>FYZIO&FIT</Heading>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Potvrďte svoj e-mail</Heading>
          <Text style={text}>
            Ďakujeme za registráciu v{' '}
            <Link href={siteUrl} style={link}><strong>FYZIO&FIT</strong></Link>!
          </Text>
          <Text style={text}>
            Prosím, potvrďte svoju e-mailovú adresu (
            <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
            ) kliknutím na tlačidlo nižšie:
          </Text>
          <Button style={button} href={confirmationUrl}>
            Overiť e-mail
          </Button>
          <Text style={footerText}>
            Ak ste si nevytvorili účet, tento e-mail môžete pokojne ignorovať.
          </Text>
        </Section>
        <Section style={footer}>
          <Text style={footerBrand}>Tešíme sa na vašu návštevu!</Text>
          <Text style={footerContact}>Kontakt: booking@fyzioafit.sk</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#f0f5fa', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }
const wrapper = { backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' as const, maxWidth: '600px', margin: '20px auto', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)' }
const header = { background: 'linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%)', padding: '30px', textAlign: 'center' as const }
const headerTitle = { color: '#ffffff', margin: '0', fontSize: '28px', fontWeight: '700' as const, letterSpacing: '1px' }
const content = { padding: '40px 30px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a2b42', margin: '0 0 20px' }
const text = { fontSize: '16px', color: '#4b5e78', lineHeight: '1.5', margin: '0 0 25px' }
const link = { color: '#4a90d9', textDecoration: 'underline' }
const button = { backgroundColor: '#4a90d9', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', fontWeight: '500' as const }
const footerText = { fontSize: '12px', color: '#6b7c94', margin: '30px 0 0' }
const footer = { backgroundColor: '#f5f8fc', padding: '20px 30px', textAlign: 'center' as const, borderTop: '1px solid #dde5ef' }
const footerBrand = { color: '#4a90d9', margin: '0 0 10px', fontSize: '16px', fontWeight: '500' as const }
const footerContact = { color: '#6b7c94', margin: '0', fontSize: '14px' }
