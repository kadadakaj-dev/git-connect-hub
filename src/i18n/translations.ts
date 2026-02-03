export type Language = 'sk' | 'en';

export const translations = {
  sk: {
    // Header
    clinicName: 'FYZIO&FIT',
    clinicSubtitle: 'Rezervujte si termín v niekoľkých krokoch',

    // Steps
    steps: {
      service: { title: 'Služba', description: 'Vyberte ošetrenie' },
      dateTime: { title: 'Dátum a čas', description: 'Vyberte termín' },
      details: { title: 'Údaje', description: 'Vaše informácie' },
      confirm: { title: 'Potvrdiť', description: 'Skontrolovať a rezervovať' },
    },
    stepOf: 'Krok {current} z {total}',

    // Service Selection
    selectService: 'Vyberte službu',
    chooseServiceSubtitle: 'Vyberte si ošetrenie, ktoré najlepšie vyhovuje vašim potrebám',
    categories: {
      physiotherapy: 'Fyzioterapia',
      chiropractic: 'Chiropraktika',
    },
    min: 'min',

    // Services
    services: {
      initialExamination: {
        name: 'Vstupné vyšetrenie',
        description: 'Komplexné prvotné vyšetrenie vrátane analýzy držania tela, testov mobility a personalizovaného liečebného plánu.',
      },
      physiotherapySession: {
        name: 'Fyzioterapeutické sedenie',
        description: 'Cielené ošetrenie zamerané na rehabilitáciu, úľavu od bolesti a zlepšenie mobility.',
      },
      chiropracticAdjustment: {
        name: 'Chiropraktická úprava',
        description: 'Manipulácia chrbtice a úpravy na obnovenie správneho zarovnania a funkcie nervového systému.',
      },
      sportsTherapy: {
        name: 'Športová terapia',
        description: 'Špecializované ošetrenie pre športovcov a aktívnych jedincov zotavujúcich sa zo športových zranení.',
      },
      massageTherapy: {
        name: 'Masážna terapia',
        description: 'Terapeutická masáž na uvoľnenie svalového napätia, zlepšenie krvného obehu a podporu relaxácie.',
      },
      followUpConsultation: {
        name: 'Kontrolná konzultácia',
        description: 'Kontrola pokroku a úprava liečby na základe vášho zotavovania.',
      },
    },

    // Date Time Selection
    chooseDateAndTime: 'Vyberte dátum a čas',
    selectPreferredSlot: 'Vyberte si preferovaný termín',
    selectDateFirst: 'Najprv vyberte dátum',
    selectDateToViewSlots: 'Vyberte dátum na zobrazenie dostupných časov',
    loadingSlots: 'Načítavam dostupné termíny...',
    noSlotsAvailable: 'Pre tento deň nie sú dostupné žiadne termíny. Vyberte iný deň.',
    morning: 'Dopoludnia',
    afternoon: 'Popoludní',
    unavailable: 'Nedostupný',
    selected: 'Vybraný',
    dayNames: ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So'],

    // Client Details
    yourDetails: 'Vaše údaje',
    provideContactInfo: 'Prosím, uveďte vaše kontaktné údaje',
    fullName: 'Celé meno',
    fullNamePlaceholder: 'Ján Novák',
    emailAddress: 'E-mailová adresa',
    emailPlaceholder: 'jan@priklad.sk',
    phoneNumber: 'Telefónne číslo',
    phonePlaceholder: '+421 900 123 456',
    additionalNotes: 'Ďalšie poznámky',
    optional: '(nepovinné)',
    notesPlaceholder: 'Akékoľvek konkrétne obavy alebo informácie, ktoré by sme mali vedieť...',
    privacyNotice: 'Pokračovaním súhlasíte s našimi zásadami ochrany osobných údajov. Vaše informácie použijeme iba na správu vašej rezervácie.',
    required: '*',

    // Validation
    errors: {
      nameRequired: 'Meno je povinné',
      emailRequired: 'E-mail je povinný',
      emailInvalid: 'Zadajte platný e-mail',
      phoneRequired: 'Telefónne číslo je povinné',
      selectService: 'Prosím, vyberte službu',
      selectDate: 'Prosím, vyberte dátum',
      selectTime: 'Prosím, vyberte čas',
    },

    // Confirmation
    bookingConfirmed: 'Rezervácia potvrdená!',
    appointmentScheduled: 'Váš termín bol úspešne naplánovaný',
    confirmationNumber: 'Číslo potvrdenia',
    confirmed: 'Potvrdené',
    service: 'Služba',
    dateAndTime: 'Dátum a čas',
    location: 'Miesto',
    clinicAddress: '123 Wellness Street, Suite 100',
    notes: 'Poznámky',
    emailSentTo: 'Potvrdzovací e-mail bol odoslaný na adresu',
    bookAnotherAppointment: 'Rezervovať ďalší termín',

    // Navigation
    back: 'Späť',
    continue: 'Pokračovať',
    confirmBooking: 'Potvrdiť rezerváciu',
    booking: 'Rezervujem...',
    bookingSuccess: 'Rezervácia úspešne potvrdená!',
  },
  en: {
    // Header
    clinicName: 'FYZIO&FIT',
    clinicSubtitle: 'Book your appointment in just a few steps',

    // Steps
    steps: {
      service: { title: 'Service', description: 'Choose your treatment' },
      dateTime: { title: 'Date & Time', description: 'Pick your slot' },
      details: { title: 'Details', description: 'Your information' },
      confirm: { title: 'Confirm', description: 'Review & book' },
    },
    stepOf: 'Step {current} of {total}',

    // Service Selection
    selectService: 'Select Your Service',
    chooseServiceSubtitle: 'Choose the treatment that best fits your needs',
    categories: {
      physiotherapy: 'Physiotherapy',
      chiropractic: 'Chiropractic',
    },
    min: 'min',

    // Services
    services: {
      initialExamination: {
        name: 'Initial Examination',
        description: 'Comprehensive first-time assessment including posture analysis, mobility tests, and personalized treatment plan.',
      },
      physiotherapySession: {
        name: 'Physiotherapy Session',
        description: 'Targeted treatment session focusing on rehabilitation, pain relief, and improved mobility.',
      },
      chiropracticAdjustment: {
        name: 'Chiropractic Adjustment',
        description: 'Spinal manipulation and adjustments to restore proper alignment and nervous system function.',
      },
      sportsTherapy: {
        name: 'Sports Therapy',
        description: 'Specialized treatment for athletes and active individuals recovering from sports injuries.',
      },
      massageTherapy: {
        name: 'Massage Therapy',
        description: 'Therapeutic massage to relieve muscle tension, improve circulation, and promote relaxation.',
      },
      followUpConsultation: {
        name: 'Follow-up Consultation',
        description: 'Progress review and treatment adjustment based on your recovery journey.',
      },
    },

    // Date Time Selection
    chooseDateAndTime: 'Choose Date & Time',
    selectPreferredSlot: 'Select your preferred appointment slot',
    selectDateFirst: 'Select a date first',
    selectDateToViewSlots: 'Please select a date to view available time slots',
    loadingSlots: 'Loading available slots...',
    noSlotsAvailable: 'No available slots for this date. Please select another day.',
    morning: 'Morning',
    afternoon: 'Afternoon',
    unavailable: 'Unavailable',
    selected: 'Selected',
    dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

    // Client Details
    yourDetails: 'Your Details',
    provideContactInfo: 'Please provide your contact information',
    fullName: 'Full Name',
    fullNamePlaceholder: 'John Doe',
    emailAddress: 'Email Address',
    emailPlaceholder: 'john@example.com',
    phoneNumber: 'Phone Number',
    phonePlaceholder: '+1 (555) 123-4567',
    additionalNotes: 'Additional Notes',
    optional: '(optional)',
    notesPlaceholder: 'Any specific concerns or information we should know...',
    privacyNotice: "By continuing, you agree to our privacy policy. We'll only use your information to manage your appointment.",
    required: '*',

    // Validation
    errors: {
      nameRequired: 'Name is required',
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email',
      phoneRequired: 'Phone number is required',
      selectService: 'Please select a service',
      selectDate: 'Please select a date',
      selectTime: 'Please select a time slot',
    },

    // Confirmation
    bookingConfirmed: 'Booking Confirmed!',
    appointmentScheduled: 'Your appointment has been successfully scheduled',
    confirmationNumber: 'Confirmation Number',
    confirmed: 'Confirmed',
    service: 'Service',
    dateAndTime: 'Date & Time',
    location: 'Location',
    clinicAddress: '123 Wellness Street, Suite 100',
    notes: 'Notes',
    emailSentTo: 'A confirmation email has been sent to',
    bookAnotherAppointment: 'Book Another Appointment',

    // Navigation
    back: 'Back',
    continue: 'Continue',
    confirmBooking: 'Confirm Booking',
    booking: 'Booking...',
    bookingSuccess: 'Booking confirmed successfully!',
  },
} as const;

export type TranslationKeys = typeof translations.en;
