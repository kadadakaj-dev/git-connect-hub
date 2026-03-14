

# Aktualizácia SMTP hesla a test emailu

## Čo sa urobí

1. **Aktualizácia SMTP_PASSWORD** — nastavenie nového hesla `Booking1@@@` pre `booking@fyzioafit.sk`
2. **Redeploy `send-booking-email`** edge funkcie, aby použila nové heslo
3. **Test** — odoslanie testovacej požiadavky na edge funkciu a kontrola logov

## Technické detaily

- Secret `SMTP_PASSWORD` už existuje, len sa prepíše novou hodnotou
- SMTP server: `smtp.m1.websupport.sk:465` (SSL/TLS)
- Po aktualizácii secretu je potrebný redeploy edge funkcie `send-booking-email`

