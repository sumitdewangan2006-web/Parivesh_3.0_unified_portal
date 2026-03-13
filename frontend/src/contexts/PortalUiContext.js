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
      clearanceKicker: "Clearance Streams",
      clearanceTitle: "Clearance Modules And Their Purpose",
      clearanceDescription:
        "Each clearance stream in PARIVESH 3.0 is grouped into a dedicated operational area so proposal handling, scrutiny, and outcomes stay structured and traceable.",
      clearanceLabel: "Module",
      clearance: {
        environmentalDetail:
          "Handles end-to-end environmental proposal submission, document review, fee completion, and committee-ready appraisal workflow.",
        forestDetail:
          "Supports forest-related proposals with structured scrutiny, status movement, supporting document validation, and decision tracking.",
        wildlifeDetail:
          "Provides a dedicated path for proposals involving wildlife and protected-area review requirements with auditable remarks and actions.",
        crzDetail:
          "Covers coastal regulation zone applications with workflow checkpoints for compliance review, documentation, and final processing updates.",
      },
      downloadsKicker: "Downloads & Resources",
      downloadsTitle: "Reference Material For Portal Use",
      downloadsDescription:
        "These resources summarize the demo environment, evaluation framing, health validation, and reset operations that support the portal walkthrough.",
      downloads: {
        demoScriptTitle: "Demo Walkthrough Script",
        demoScriptNote: "Role-by-role walkthrough covering proposal submission, scrutiny actions, meeting processing, and administrative review flow.",
        scorecardTitle: "Evaluation Scorecard",
        scorecardNote: "Assessment reference that maps the portal experience to demonstration criteria and judging checkpoints.",
        healthCheckTitle: "Service Health Check",
        healthCheckNote: "Operational reference for verifying Docker services, API reachability, and runtime readiness before the demo starts.",
        resetTitle: "Environment Reset",
        resetNote: "Reset procedure for restoring the demo flow, seeded data, and service state between walkthrough runs.",
      },
      guideKicker: "User Guide",
      guideTitle: "How Each Team Uses The Portal",
      guideDescription:
        "The portal is organized around role-specific workflows so every team interacts only with the functions needed for its responsibilities.",
      guide: {
        proponentTitle: "Project Proponents",
        proponentNote: "Create proposals, upload documents, complete EC fee payment, and track application progress through the unified dashboard.",
        scrutinyTitle: "Scrutiny Officers",
        scrutinyNote: "Review assigned proposals, record remarks, seek essential documents, and move applications toward committee consideration.",
        momTitle: "MoM Teams",
        momNote: "Create meetings, attach referred proposals, draft outcomes, and finalize or publish the minutes of meeting records.",
        adminTitle: "Administrators",
        adminNote: "Manage users, categories, sectors, officer assignment, analytics visibility, and overall portal operations.",
      },
      contactKicker: "Contact & Support",
      contactTitle: "Need Assistance With The Portal?",
      contactDescription:
        "For demo use, support workflows begin through the sign-in and registration journey so users can be identified and routed correctly inside the portal.",
      contact: {
        supportTitle: "Access Support",
        supportNote: "Use the authentication flow to access proposal dashboards, guided actions, and role-based support paths inside the portal workspace.",
      },
      complaintKicker: "Complaint Handling",
      complaintTitle: "Raise A Portal Complaint",
      complaintDescription:
        "Complaint and issue reporting should be initiated by authenticated users so the portal can keep a clear record of identity, workflow context, and follow-up actions.",
      complaint: {
        primaryAction: "Sign In To Raise Complaint",
        secondaryAction: "Register A New Account",
      },
      vacanciesKicker: "Vacancies & Notices",
      vacanciesTitle: "Recruitment And Notice Board",
      vacanciesDescription:
        "This demo environment does not currently publish live vacancy notices, but the section is reserved for future announcements, circulars, and recruitment updates.",
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
      emailRequired: "Email is required",
      emailInvalid: "Enter a valid email address",
      passwordRequired: "Password is required",
      invalidCredentials: "Incorrect email or password",
      fixHighlightedFields: "Please review the highlighted fields and try again.",
      nameRequired: "Full name is required",
      phoneInvalid: "Phone must be exactly 10 digits",
      passwordUppercase: "Password must contain at least one uppercase letter",
      passwordNumber: "Password must contain at least one number",
      confirmPasswordRequired: "Please confirm your password",
      passwordsMismatch: "Passwords do not match",
      passwordLength: "Password must be at least 8 characters",
      loginSuccess: "Login successful!",
      loginFailed: "Login failed",
      loginServerIssue: "Unable to sign in right now. Please try again in a moment.",
      registrationSuccess: "Registration successful!",
      registrationFailed: "Registration failed",
      registrationServerIssue: "Unable to create your account right now. Please try again in a moment.",
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
      clearanceKicker: "क्लीयरेंस स्ट्रीम्स",
      clearanceTitle: "क्लीयरेंस मॉड्यूल और उनका उद्देश्य",
      clearanceDescription:
        "परिवेश 3.0 में प्रत्येक क्लीयरेंस स्ट्रीम को अलग परिचालन अनुभाग में व्यवस्थित किया गया है ताकि प्रस्ताव प्रबंधन, स्क्रूटनी और निर्णय सुव्यवस्थित और ट्रेस योग्य बने रहें।",
      clearanceLabel: "मॉड्यूल",
      clearance: {
        environmentalDetail:
          "यह पर्यावरण प्रस्तावों के लिए आवेदन, दस्तावेज समीक्षा, शुल्क पूर्णता और समिति-उन्मुख मूल्यांकन कार्यप्रवाह को संभालता है।",
        forestDetail:
          "यह वन संबंधी प्रस्तावों के लिए संरचित स्क्रूटनी, स्थिति परिवर्तन, दस्तावेज सत्यापन और निर्णय ट्रैकिंग प्रदान करता है।",
        wildlifeDetail:
          "यह वन्यजीव और संरक्षित क्षेत्र संबंधी प्रस्तावों के लिए टिप्पणियों और कार्रवाइयों सहित समर्पित समीक्षा पथ उपलब्ध कराता है।",
        crzDetail:
          "यह तटीय विनियमन क्षेत्र आवेदनों के लिए अनुपालन समीक्षा, दस्तावेज प्रबंधन और अंतिम प्रक्रिया अद्यतन हेतु कार्यप्रवाह बिंदु उपलब्ध कराता है।",
      },
      downloadsKicker: "डाउनलोड और संसाधन",
      downloadsTitle: "पोर्टल उपयोग के लिए संदर्भ सामग्री",
      downloadsDescription:
        "ये संसाधन डेमो वातावरण, मूल्यांकन ढांचे, सेवा सत्यापन और रीसेट संचालन का सार प्रस्तुत करते हैं।",
      downloads: {
        demoScriptTitle: "डेमो वॉकथ्रू स्क्रिप्ट",
        demoScriptNote: "भूमिका-आधारित वॉकथ्रू जिसमें प्रस्ताव जमा करना, स्क्रूटनी, बैठक प्रक्रिया और प्रशासनिक समीक्षा शामिल है।",
        scorecardTitle: "मूल्यांकन स्कोरकार्ड",
        scorecardNote: "यह संदर्भ पोर्टल अनुभव को प्रदर्शन मानदंडों और मूल्यांकन बिंदुओं से जोड़ता है।",
        healthCheckTitle: "सर्विस हेल्थ चेक",
        healthCheckNote: "डॉकर सेवाओं, एपीआई उपलब्धता और रनटाइम तैयारी की जांच के लिए परिचालन संदर्भ।",
        resetTitle: "एनवायरनमेंट रीसेट",
        resetNote: "डेमो प्रवाह, सीडेड डेटा और सेवा स्थिति को पुनर्स्थापित करने की रीसेट प्रक्रिया।",
      },
      guideKicker: "उपयोगकर्ता गाइड",
      guideTitle: "प्रत्येक टीम पोर्टल का उपयोग कैसे करती है",
      guideDescription:
        "पोर्टल को भूमिका-विशिष्ट कार्यप्रवाहों के अनुसार व्यवस्थित किया गया है ताकि प्रत्येक टीम केवल अपने आवश्यक कार्यों का उपयोग करे।",
      guide: {
        proponentTitle: "परियोजना प्रस्तावक",
        proponentNote: "प्रस्ताव बनाएं, दस्तावेज अपलोड करें, ईसी शुल्क पूरा करें और डैशबोर्ड पर प्रगति ट्रैक करें।",
        scrutinyTitle: "स्क्रूटनी अधिकारी",
        scrutinyNote: "आवंटित प्रस्तावों की समीक्षा करें, टिप्पणियां दर्ज करें, आवश्यक दस्तावेज मांगें और आवेदन आगे बढ़ाएं।",
        momTitle: "मोम टीमें",
        momNote: "बैठक बनाएं, प्रस्ताव जोड़ें, परिणाम तैयार करें और बैठक के मिनट अंतिम या प्रकाशित करें।",
        adminTitle: "प्रशासक",
        adminNote: "उपयोगकर्ता, श्रेणियां, सेक्टर, अधिकारी आवंटन, विश्लेषण दृश्यता और संपूर्ण पोर्टल संचालन प्रबंधित करें।",
      },
      contactKicker: "संपर्क और सहायता",
      contactTitle: "पोर्टल में सहायता चाहिए?",
      contactDescription:
        "डेमो उपयोग के लिए सहायता प्रवाह साइन-इन और रजिस्ट्रेशन यात्रा से शुरू होता है ताकि उपयोगकर्ता सही भूमिका और कार्यक्षेत्र तक पहुंच सकें।",
      contact: {
        supportTitle: "एक्सेस सहायता",
        supportNote: "प्रस्ताव डैशबोर्ड, निर्देशित कार्रवाइयों और भूमिका-आधारित सहायता पथों तक पहुंचने के लिए प्रमाणीकरण प्रवाह का उपयोग करें।",
      },
      complaintKicker: "शिकायत प्रबंधन",
      complaintTitle: "पोर्टल शिकायत दर्ज करें",
      complaintDescription:
        "शिकायत और समस्या रिपोर्टिंग प्रमाणित उपयोगकर्ताओं द्वारा शुरू की जानी चाहिए ताकि पोर्टल पहचान, संदर्भ और फॉलो-अप रिकॉर्ड रख सके।",
      complaint: {
        primaryAction: "शिकायत हेतु साइन इन करें",
        secondaryAction: "नया खाता पंजीकृत करें",
      },
      vacanciesKicker: "रिक्तियां और सूचनाएं",
      vacanciesTitle: "भर्ती और नोटिस बोर्ड",
      vacanciesDescription:
        "यह डेमो वातावरण वर्तमान में लाइव रिक्तियां प्रकाशित नहीं करता, लेकिन यह अनुभाग भविष्य की सूचनाओं और भर्ती अपडेट के लिए सुरक्षित है।",
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
      emailRequired: "ईमेल आवश्यक है",
      emailInvalid: "मान्य ईमेल पता दर्ज करें",
      passwordRequired: "पासवर्ड आवश्यक है",
      invalidCredentials: "ईमेल या पासवर्ड गलत है",
      fixHighlightedFields: "हाइलाइट किए गए फ़ील्ड जांचें और फिर से प्रयास करें।",
      nameRequired: "पूरा नाम आवश्यक है",
      phoneInvalid: "फोन नंबर ठीक 10 अंकों का होना चाहिए",
      passwordUppercase: "पासवर्ड में कम से कम एक अपरकेस अक्षर होना चाहिए",
      passwordNumber: "पासवर्ड में कम से कम एक संख्या होनी चाहिए",
      confirmPasswordRequired: "कृपया पासवर्ड की पुष्टि करें",
      passwordsMismatch: "पासवर्ड मेल नहीं खाते",
      passwordLength: "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए",
      loginSuccess: "लॉगिन सफल रहा!",
      loginFailed: "लॉगिन विफल रहा",
      loginServerIssue: "अभी साइन इन नहीं हो पा रहा है। कृपया थोड़ी देर बाद फिर प्रयास करें।",
      registrationSuccess: "पंजीकरण सफल रहा!",
      registrationFailed: "पंजीकरण विफल रहा",
      registrationServerIssue: "अभी खाता नहीं बनाया जा सका। कृपया थोड़ी देर बाद फिर प्रयास करें।",
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