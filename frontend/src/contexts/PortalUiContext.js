"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const PortalUiContext = createContext(null);

const FONT_MIN = 0.9;
const FONT_MAX = 1.2;
const FONT_STEP = 0.1;

const translations = {
  en: {
    header: {
      governmentOfIndia: "Government of India",
      languageLabel: "English",
      search: "Search",
      login: "Login",
      register: "Register",
      nav: {
        home: "Home",
        about: "About",
        clearance: "Clearance",
        downloads: "Downloads",
        guide: "Guide",
        contact: "Contact",
        dashboard: "Dashboard",
        complaint: "Complaint",
        vacancies: "Vacancies",
      },
    },
    footer: {
      kicker: "Green Clearances",
      title: "PARIVESH 3.0 Unified Environmental Clearance Portal",
      description:
        "Designed to support environmental, forest, wildlife, and CRZ proposal processing through a single digital workflow for proponents, scrutiny teams, MoM teams, and administrators.",
      policyLinks: "Policy Links",
      privacy: "Privacy Policy",
      terms: "Terms of Use",
      hyperlinking: "Hyperlinking Policy",
      accessibility: "Accessibility",
      disclaimer: "Disclaimer",
      note:
        "PARIVESH portal is designed for demonstration of a government-style workflow experience.",
      context:
        "Content context: Ministry of Environment, Forest and Climate Change, Government of India.",
      implementation:
        "Interface and workflow implementation in this workspace are developed for the hackathon portal.",
    },
    home: {
      kicker: "Single Window Green Clearance Platform",
      title: "PARIVESH 3.0",
      description:
        "Unified Environmental Clearance Portal for application filing, scrutiny, meeting workflows, payment-gated submission, audit-ready history, and final publication across green approval lifecycles.",
      notice:
        "New portal flow: proposal drafts can be submitted only after EC fee completion. Proponents, scrutiny teams, MoM teams, and administrators operate in one consolidated workflow.",
      aboutKicker: "About PARIVESH 3.0",
      aboutTitle: "Integrated Portal For Green Clearances",
      aboutDescription:
        "PARIVESH 3.0 is a unified digital platform to process environmental approvals end-to-end. It brings proposal filing, scrutiny, meeting outcomes, compliance tracking, and administrative monitoring into one secure and auditable system.",
      about: {
        workflowTitle: "Single Workflow",
        workflowNote: "From draft submission to final decision, every stage is managed through one connected process.",
        rolesTitle: "Role-based Access",
        rolesNote: "Proponents, scrutiny officers, MoM teams, and administrators work through dedicated role dashboards.",
        transparencyTitle: "Traceable Decisions",
        transparencyNote: "Status history and recorded remarks provide a complete decision trail for each application.",
        digitalTitle: "Digital-first Processing",
        digitalNote: "Online documents, payment-gated submission, and workflow actions reduce manual dependency and delays.",
      },
      trackProposal: "Track Your Proposal",
      knowApproval: "Know Your Approval",
      openDashboard: "Open Dashboard",
      modulesKicker: "Green Clearance Modules",
      modulesBanner:
        "Ministry-style dashboarding, status visibility, and auditable transitions are available across the authenticated portal experience.",
      modules: {
        environmentalTitle: "Environmental Clearance",
        environmentalNote: "Proposal submission and appraisal workflow",
        forestTitle: "Forest Clearance",
        forestNote: "Integrated review and decision support",
        wildlifeTitle: "Wildlife Clearance",
        wildlifeNote: "Protected-area proposal tracking",
        crzTitle: "CRZ Clearance",
        crzNote: "Coastal regulation compliance management",
      },
      featuresKicker: "Portal Features",
      featuresTitle: "End-to-End Environmental Governance Flow",
      featuresDescription:
        "The frontend now follows an official-portal-inspired layout language with clear government identity, structured information hierarchy, and operational sections that match administrative workflows.",
      features: {
        submissionTitle: "Application Submission",
        submissionDesc:
          "Multi-step wizard for EC applications with document uploads, fee calculation, and payment-gated submission.",
        scrutinyTitle: "Scrutiny & Review",
        scrutinyDesc:
          "Dedicated review workspace for scrutiny officers to raise essential document requirements and move proposals forward.",
        momTitle: "MoM Generation",
        momDesc:
          "Meeting creation, agenda linkage, outcome drafting, finalization, and publication for referred applications.",
        analyticsTitle: "Dashboard & Analytics",
        analyticsDesc:
          "Role-aware charts, real-time status distribution, and monitoring views for administrative visibility.",
      },
    },
    auth: {
      loginTitle: "Sign in to your account",
      loginSubtitle: "Access the PARIVESH workflow dashboard",
      email: "Email Address",
      emailPlaceholder: "you@example.com",
      password: "Password",
      passwordPlaceholder: "••••••••",
      signIn: "Sign In",
      signingIn: "Signing in...",
      noAccount: "Don't have an account?",
      registerHere: "Register here",
      demoAdmin: "Demo Admin: admin@parivesh.gov.in / Admin@123",
      registerTitle: "Create your Project Proponent account",
      registerSubtitle: "Register to submit and track proposals in PARIVESH",
      fullName: "Full Name",
      fullNamePlaceholder: "John Doe",
      phone: "Phone (10 digits)",
      phonePlaceholder: "9876543210",
      organization: "Organization",
      organizationPlaceholder: "Your Company / Organization",
      createAccount: "Create Account",
      creatingAccount: "Creating account...",
      alreadyAccount: "Already have an account?",
      signInLink: "Sign in",
      confirmPassword: "Confirm Password",
      confirmPasswordPlaceholder: "Re-enter password",
      passwordRules: "Min 8 chars, 1 uppercase, 1 number",
      passwordsMismatch: "Passwords do not match",
      passwordLength: "Password must be at least 8 characters",
      loginSuccess: "Login successful!",
      loginFailed: "Login failed",
      registrationSuccess: "Registration successful!",
      registrationFailed: "Registration failed",
    },
  },
  hi: {
    header: {
      governmentOfIndia: "भारत सरकार",
      languageLabel: "हिंदी",
      search: "खोजें",
      login: "लॉगिन",
      register: "रजिस्टर",
      nav: {
        home: "होम",
        about: "परिचय",
        clearance: "क्लीयरेंस",
        downloads: "डाउनलोड",
        guide: "गाइड",
        contact: "संपर्क",
        dashboard: "डैशबोर्ड",
        complaint: "शिकायत",
        vacancies: "रिक्तियां",
      },
    },
    footer: {
      kicker: "हरित स्वीकृतियां",
      title: "परिवेश 3.0 एकीकृत पर्यावरण स्वीकृति पोर्टल",
      description:
        "यह पोर्टल परियोजना प्रस्तावकों, स्क्रूटनी टीमों, मोम टीमों और प्रशासकों के लिए पर्यावरण, वन, वन्यजीव और सीआरजेड प्रस्ताव प्रसंस्करण को एकल डिजिटल कार्यप्रवाह में समर्थन देने हेतु बनाया गया है।",
      policyLinks: "नीति लिंक",
      privacy: "गोपनीयता नीति",
      terms: "उपयोग की शर्तें",
      hyperlinking: "हाइपरलिंकिंग नीति",
      accessibility: "सुगम्यता",
      disclaimer: "अस्वीकरण",
      note:
        "परिवेश पोर्टल को सरकारी शैली के कार्यप्रवाह अनुभव के प्रदर्शन के लिए तैयार किया गया है।",
      context:
        "संदर्भ सामग्री: पर्यावरण, वन और जलवायु परिवर्तन मंत्रालय, भारत सरकार।",
      implementation:
        "इस वर्कस्पेस में इंटरफेस और कार्यप्रवाह कार्यान्वयन हैकाथॉन पोर्टल के लिए विकसित किए गए हैं।",
    },
    home: {
      kicker: "एकल विंडो हरित स्वीकृति मंच",
      title: "परिवेश 3.0",
      description:
        "आवेदन दायर करने, स्क्रूटनी, बैठक कार्यप्रवाह, भुगतान-आधारित सबमिशन, ऑडिट योग्य इतिहास और अंतिम प्रकाशन के लिए एकीकृत पर्यावरण स्वीकृति पोर्टल।",
      notice:
        "नया पोर्टल कार्यप्रवाह: प्रारूप आवेदन केवल ईसी शुल्क पूर्ण होने के बाद ही जमा किए जा सकते हैं। प्रस्तावक, स्क्रूटनी टीम, मोम टीम और प्रशासक एकीकृत कार्यप्रवाह में काम करते हैं।",
      aboutKicker: "परिवेश 3.0 के बारे में",
      aboutTitle: "हरित स्वीकृतियों के लिए एकीकृत पोर्टल",
      aboutDescription:
        "परिवेश 3.0 एक एकीकृत डिजिटल प्लेटफॉर्म है जो पर्यावरण स्वीकृति की पूरी प्रक्रिया को एक स्थान पर लाता है। इसमें प्रस्ताव जमा करना, स्क्रूटनी, बैठक परिणाम, अनुपालन ट्रैकिंग और प्रशासनिक निगरानी शामिल है।",
      about: {
        workflowTitle: "एकल कार्यप्रवाह",
        workflowNote: "ड्राफ्ट आवेदन से अंतिम निर्णय तक हर चरण एक ही जुड़ी हुई प्रक्रिया में संचालित होता है।",
        rolesTitle: "भूमिका आधारित पहुंच",
        rolesNote: "प्रस्तावक, स्क्रूटनी अधिकारी, मोम टीम और प्रशासक अपनी-अपनी डैशबोर्ड आधारित भूमिकाओं में कार्य करते हैं।",
        transparencyTitle: "ट्रेसेबल निर्णय",
        transparencyNote: "स्थिति इतिहास और दर्ज टिप्पणियां प्रत्येक आवेदन के लिए पूर्ण निर्णय-पथ उपलब्ध कराती हैं।",
        digitalTitle: "डिजिटल-फर्स्ट प्रोसेसिंग",
        digitalNote: "ऑनलाइन दस्तावेज, भुगतान आधारित सबमिशन और डिजिटल कार्यवाहियां मैनुअल निर्भरता और देरी कम करती हैं।",
      },
      trackProposal: "अपना प्रस्ताव ट्रैक करें",
      knowApproval: "अपनी स्वीकृति जानें",
      openDashboard: "डैशबोर्ड खोलें",
      modulesKicker: "हरित स्वीकृति मॉड्यूल",
      modulesBanner:
        "मंत्रालय-शैली डैशबोर्ड, स्थिति दृश्यता और ऑडिट योग्य ट्रांजिशन प्रमाणित उपयोगकर्ता अनुभव में उपलब्ध हैं।",
      modules: {
        environmentalTitle: "पर्यावरण स्वीकृति",
        environmentalNote: "प्रस्ताव सबमिशन और मूल्यांकन कार्यप्रवाह",
        forestTitle: "वन स्वीकृति",
        forestNote: "एकीकृत समीक्षा और निर्णय समर्थन",
        wildlifeTitle: "वन्यजीव स्वीकृति",
        wildlifeNote: "संरक्षित क्षेत्र प्रस्ताव ट्रैकिंग",
        crzTitle: "सीआरजेड स्वीकृति",
        crzNote: "तटीय विनियमन अनुपालन प्रबंधन",
      },
      featuresKicker: "पोर्टल विशेषताएं",
      featuresTitle: "सम्पूर्ण पर्यावरण शासन कार्यप्रवाह",
      featuresDescription:
        "फ्रंटेंड अब आधिकारिक पोर्टल-प्रेरित लेआउट भाषा का पालन करता है, जिसमें स्पष्ट सरकारी पहचान, संरचित सूचना पदानुक्रम और प्रशासनिक कार्यप्रवाह से मेल खाते अनुभाग शामिल हैं।",
      features: {
        submissionTitle: "आवेदन सबमिशन",
        submissionDesc:
          "दस्तावेज अपलोड, शुल्क गणना और भुगतान-आधारित सबमिशन के साथ ईसी आवेदनों के लिए बहु-चरण विज़ार्ड।",
        scrutinyTitle: "स्क्रूटनी और समीक्षा",
        scrutinyDesc:
          "स्क्रूटनी अधिकारियों के लिए आवश्यक दस्तावेज़ मांगने और प्रस्ताव आगे बढ़ाने हेतु समर्पित समीक्षा कार्यक्षेत्र।",
        momTitle: "मोम जनरेशन",
        momDesc:
          "संदर्भित आवेदनों के लिए बैठक निर्माण, एजेंडा लिंकिंग, परिणाम ड्राफ्टिंग, अंतिमकरण और प्रकाशन।",
        analyticsTitle: "डैशबोर्ड और विश्लेषण",
        analyticsDesc:
          "भूमिका-आधारित चार्ट, रीयल-टाइम स्थिति वितरण और प्रशासनिक निगरानी के लिए दृश्य।",
      },
    },
    auth: {
      loginTitle: "अपने खाते में साइन इन करें",
      loginSubtitle: "परिवेश कार्यप्रवाह डैशबोर्ड तक पहुंचें",
      email: "ईमेल पता",
      emailPlaceholder: "you@example.com",
      password: "पासवर्ड",
      passwordPlaceholder: "••••••••",
      signIn: "साइन इन",
      signingIn: "साइन इन हो रहा है...",
      noAccount: "क्या आपका खाता नहीं है?",
      registerHere: "यहां पंजीकरण करें",
      demoAdmin: "डेमो एडमिन: admin@parivesh.gov.in / Admin@123",
      registerTitle: "अपना प्रोजेक्ट प्रोपोनेंट खाता बनाएं",
      registerSubtitle: "परिवेश में प्रस्ताव जमा करने और ट्रैक करने के लिए पंजीकरण करें",
      fullName: "पूरा नाम",
      fullNamePlaceholder: "John Doe",
      phone: "फोन (10 अंक)",
      phonePlaceholder: "9876543210",
      organization: "संगठन",
      organizationPlaceholder: "आपकी कंपनी / संगठन",
      createAccount: "खाता बनाएं",
      creatingAccount: "खाता बनाया जा रहा है...",
      alreadyAccount: "क्या आपके पास पहले से खाता है?",
      signInLink: "साइन इन करें",
      confirmPassword: "पासवर्ड की पुष्टि करें",
      confirmPasswordPlaceholder: "पासवर्ड पुनः दर्ज करें",
      passwordRules: "कम से कम 8 अक्षर, 1 अपरकेस, 1 संख्या",
      passwordsMismatch: "पासवर्ड मेल नहीं खाते",
      passwordLength: "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए",
      loginSuccess: "लॉगिन सफल रहा!",
      loginFailed: "लॉगिन विफल रहा",
      registrationSuccess: "पंजीकरण सफल रहा!",
      registrationFailed: "पंजीकरण विफल रहा",
    },
  },
};

function getNestedValue(object, path) {
  return path.split(".").reduce((accumulator, segment) => accumulator?.[segment], object);
}

export function PortalUiProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("portal-language");
    const storedFontScale = window.localStorage.getItem("portal-font-scale");

    if (storedLanguage === "en" || storedLanguage === "hi") {
      setLanguage(storedLanguage);
    }

    if (storedFontScale) {
      const parsedScale = Number.parseFloat(storedFontScale);
      if (!Number.isNaN(parsedScale)) {
        setFontScale(Math.min(FONT_MAX, Math.max(FONT_MIN, parsedScale)));
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
    window.localStorage.setItem("portal-language", language);
    window.localStorage.setItem("portal-font-scale", String(fontScale));
  }, [fontScale, language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    fontScale,
    increaseFontSize: () => setFontScale((current) => Math.min(FONT_MAX, Number((current + FONT_STEP).toFixed(2)))),
    decreaseFontSize: () => setFontScale((current) => Math.max(FONT_MIN, Number((current - FONT_STEP).toFixed(2)))),
    resetFontSize: () => setFontScale(1),
    t: (key, fallback) => getNestedValue(translations[language], key) ?? fallback ?? key,
  }), [fontScale, language]);

  return <PortalUiContext.Provider value={value}>{children}</PortalUiContext.Provider>;
}

export function usePortalUi() {
  const context = useContext(PortalUiContext);

  if (!context) {
    throw new Error("usePortalUi must be used within PortalUiProvider");
  }

  return context;
}