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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="sk" dir="ltr">
    <Head />
    <Preview>Pozvánka do FYZIOAFIT</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Heading style={headerTitle}>FYZIOAFIT</Heading>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Boli ste pozvaní</Heading>
          <Text style={text}>
            Boli ste pozvaní do{' '}
            <Link href={siteUrl} style={link}><strong>FYZIOAFIT</strong></Link>.
            Kliknite na tlačidlo nižšie pre prijatie pozvánky a vytvorenie účtu.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Prijať pozvánku
          </Button>
          <Text style={footerText}>
            Ak ste túto pozvánku neočakávali, môžete tento e-mail pokojne ignorovať.
          </Text>
        </Section>
        <Section style={footer}>
          <Text style={footerBrand}>FYZIOAFIT</Text>
          <Text style={footerContact}>Kontakt: booking@fyzioafit.sk</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
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

