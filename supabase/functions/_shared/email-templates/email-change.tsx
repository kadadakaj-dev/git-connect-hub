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

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="sk" dir="ltr">
    <Head>
      <style dangerouslySetInnerHTML={{ __html: `
        :root { color-scheme: light dark; }
        @media (prefers-color-scheme: dark) {
          .email-body { background-color: #18181b !important; }
          .email-card { background-color: #242427 !important; border: 1px solid #3f3f46 !important; }
          .text-heading { color: #e4e4e7 !important; }
          .text-body { color: #d4d4d8 !important; }
          .text-muted { color: #a1a1aa !important; }
          .footer-section { background-color: #1e1e22 !important; border-color: #3f3f46 !important; }
        }
      `}} />
    </Head>
    <Preview>Potvrďte zmenu e-mailu – FYZIO&FIT</Preview>
    <Body className="email-body" style={main}>
      <Container className="email-card" style={wrapper}>
        <Section style={header}>
          <Heading style={headerTitle}>FYZIO&FIT</Heading>
        </Section>
        <Section style={content}>
          <Heading className="text-heading" style={h1}>Potvrďte zmenu e-mailu</Heading>
          <Text className="text-body" style={text}>
            Požiadali ste o zmenu e-mailovej adresy v FYZIO&FIT z{' '}
            <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
            na{' '}
            <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
          </Text>
          <Text className="text-body" style={text}>
            Kliknite na tlačidlo nižšie pre potvrdenie tejto zmeny:
          </Text>
          <Button style={button} href={confirmationUrl}>
            Potvrdiť zmenu e-mailu
          </Button>
          <Text className="text-muted" style={footerText}>
            Ak ste o túto zmenu nežiadali, zabezpečte si prosím ihneď svoj účet.
          </Text>
        </Section>
        <Section className="footer-section" style={footer}>
          <Text className="text-muted" style={footerBrand}>FYZIO&FIT</Text>
          <Text className="text-muted" style={footerContact}>Kontakt: booking@fyzioafit.sk</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#f7f9fc', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
const wrapper = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '20px auto', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)' }
const header = { background: 'linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%)', padding: '36px 30px', textAlign: 'center' as const }
const headerTitle = { color: '#ffffff', margin: '0', fontSize: '28px', fontWeight: '700' as const, letterSpacing: '1.5px' }
const content = { padding: '40px 30px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a2b42', margin: '0 0 20px' }
const text = { fontSize: '16px', color: '#4b5e78', lineHeight: '1.5', margin: '0 0 25px' }
const link = { color: '#4a90d9', textDecoration: 'underline' }
const button = { backgroundColor: '#4a90d9', color: '#ffffff', fontSize: '14px', borderRadius: '10px', padding: '14px 28px', textDecoration: 'none', fontWeight: '600' as const }
const footerText = { fontSize: '12px', color: '#6b7c94', margin: '30px 0 0' }
const footer = { backgroundColor: '#f0f4f8', padding: '20px 30px', textAlign: 'center' as const, borderTop: '1px solid #dde5ef' }
const footerBrand = { color: '#4a90d9', margin: '0 0 10px', fontSize: '16px', fontWeight: '500' as const }
const footerContact = { color: '#6b7c94', margin: '0', fontSize: '14px' }
