"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePortalUi } from "@/contexts/PortalUiContext";

/* ── Knowledge Base ────────────────────────────────────────────── */
const OFFICERS = [
  { name: "Shri Leena Nandan", designation: "Secretary", dept: "Ministry of Environment, Forest and Climate Change (MoEFCC)", detail: "Oversees all environmental policy and clearance operations at the ministry level." },
  { name: "Shri C.K. Mishra", designation: "Director General of Forests (DGF)", dept: "MoEFCC", detail: "Heads the forest services division and coordinates forest clearance approvals across states." },
  { name: "Dr. S. P. Singh Parihar", designation: "Chairperson, CPCB", dept: "Central Pollution Control Board", detail: "Leads pollution monitoring, environmental standards enforcement, and compliance audits." },
  { name: "Shri R. P. Gupta", designation: "Joint Secretary (EC Division)", dept: "MoEFCC – Environmental Clearance Division", detail: "Manages environmental clearance processing, EIA appraisals, and expert committee coordination." },
  { name: "Shri Soumitra Dasgupta", designation: "Inspector General of Forests", dept: "MoEFCC – Wildlife Division", detail: "Oversees wildlife clearances, protected area management, and NBWL coordination." },
  { name: "Dr. Rajiv Kumar", designation: "Scientist-E", dept: "MoEFCC – CRZ Division", detail: "Handles Coastal Regulation Zone clearance reviews and coastal ecosystem compliance." },
  { name: "Smt. Richa Sharma", designation: "Director (Forest Conservation)", dept: "MoEFCC – Forest Conservation Division", detail: "Coordinates forest diversion proposals under FC Act and monitors compensatory afforestation." },
  { name: "Shri A.K. Jain", designation: "Adviser (RE & Climate Change)", dept: "MoEFCC – Climate Change Division", detail: "Advises on renewable energy policy, carbon neutrality targets, and climate adaptation strategies." },
];

const DEPARTMENTS = [
  { name: "Environmental Clearance Division", role: "Processes Environmental Impact Assessment (EIA) proposals, manages Expert Appraisal Committees, and issues EC letters." },
  { name: "Forest Conservation Division", role: "Handles forest diversion proposals under the Forest Conservation Act, monitors compensatory afforestation, and coordinates with state forest departments." },
  { name: "Wildlife Division", role: "Manages wildlife clearance applications, coordinates with the National Board for Wildlife (NBWL), and monitors proposals affecting protected areas." },
  { name: "CRZ Division", role: "Reviews Coastal Regulation Zone proposals, ensures compliance with CRZ notifications, and coordinates with coastal state authorities." },
  { name: "Central Pollution Control Board (CPCB)", role: "Monitors national pollution standards, conducts environmental audits, and enforces emission/effluent compliance." },
  { name: "Climate Change Division", role: "Manages India's UNFCCC obligations, NDC targets, carbon credit programs, and climate adaptation initiatives." },
  { name: "PARIVESH Portal Cell", role: "Manages the technical operations of the PARIVESH portal, handles user onboarding, system administration, and digital workflow maintenance." },
];

const PROCESS_INFO = {
  submission: "To submit a proposal on PARIVESH 3.0:\n1. Register as a Project Proponent\n2. Fill the application form with project details\n3. Upload required documents (EIA report, Form-1, etc.)\n4. Complete the EC fee payment via the payment gateway\n5. Submit the proposal — it enters the 'Submitted' stage",
  scrutiny: "During Scrutiny:\n1. A Scrutiny Officer is assigned to your proposal\n2. The officer reviews documents and project details\n3. They may raise queries or request Essential Site Documents (ESD)\n4. Once satisfied, the proposal is forwarded to the Expert Appraisal Committee",
  meeting: "Minutes of Meeting (MoM) process:\n1. An EAC/SEAC meeting is scheduled with an agenda\n2. Referred proposals are discussed by committee members\n3. Outcomes are drafted (Approved / Deferred / Rejected)\n4. MoM is finalized and published on the portal",
  payment: "EC Fee Payment:\n• The fee is calculated based on project category and area\n• Payment is made through the integrated payment gateway\n• Payment receipt is generated and attached to the proposal\n• Proposals can only be submitted after successful payment",
  tracking: "To track your proposal:\n1. Login to your Proponent Dashboard\n2. View the 'My Proposals' section\n3. Each proposal shows its current workflow stage\n4. Click on a proposal to see detailed status history and remarks",
};

const NEWS_ITEMS = [
  { id: 1, date: "2026-03-14", category: "Policy Update", title: "MoEFCC Issues New EIA Notification Amendment 2026", description: "The Ministry has notified amendments to the EIA Notification 2006, streamlining Category B1 project appraisals and introducing digital-first processing for SEIAAs." },
  { id: 2, date: "2026-03-12", category: "NGT Order", title: "NGT Directs Strict Compliance on Coastal Zone Violations", description: "The National Green Tribunal has issued directives to all coastal states to submit compliance reports on CRZ violations within 60 days, emphasizing PARIVESH-based monitoring." },
  { id: 3, date: "2026-03-10", category: "Forest Conservation", title: "Compensatory Afforestation Fund Crosses ₹50,000 Crore", description: "CAMPA fund utilization has been accelerated with new guidelines allowing states to use funds for urban forestry and mangrove restoration projects." },
  { id: 4, date: "2026-03-08", category: "Wildlife", title: "NBWL Approves New Eco-Sensitive Zone Boundaries", description: "The National Board for Wildlife has approved revised eco-sensitive zone boundaries for 12 national parks, strengthening wildlife corridor protection." },
  { id: 5, date: "2026-03-06", category: "Digital Initiative", title: "PARIVESH 3.0 Unified Portal Goes Live Nationwide", description: "All environmental, forest, wildlife, and CRZ clearance applications are now processed through the unified PARIVESH 3.0 portal with real-time status tracking." },
  { id: 6, date: "2026-03-04", category: "Climate Action", title: "India Submits Updated NDC Roadmap to UNFCCC", description: "India's updated Nationally Determined Contributions include a 50% reduction in emissions intensity by 2030 and net-zero target by 2070 with enhanced forest carbon sinks." },
  { id: 7, date: "2026-03-02", category: "Clearance Update", title: "Over 15,000 EC Applications Processed in Q4 FY26", description: "The Environmental Clearance division reports a 22% increase in processing efficiency, with average clearance time reduced to 85 days through digital scrutiny workflows." },
  { id: 8, date: "2026-02-28", category: "Training", title: "Capacity Building Program for SEIAA Members Launched", description: "MoEFCC launches a nationwide training program for State Expert Appraisal Committee members on using the PARIVESH portal for transparent and timely appraisals." },
];

/* ── Response Matching (English + Hindi/Hinglish) ──────────────── */
function matchResponse(input) {
  const q = input.toLowerCase().trim();

  // Greeting (English + Hindi + Hinglish)
  if (/^(hi|hello|hey|namaste|namaskar|namaskte|kaise ho|kya hal|suprabhat|pranam)/i.test(q)) {
    return "Namaste! 🙏 Welcome to the PARIVESH 3.0 Assistant.\nपरिवेश 3.0 सहायक में आपका स्वागत है।\n\nI can help you with / मैं इनमें मदद कर सकता हूं:\n• Officer & department info / अधिकारी और विभाग की जानकारी\n• Clearance process guidance / क्लीयरेंस प्रक्रिया मार्गदर्शन\n• Proposal submission & tracking / प्रस्ताव सबमिशन और ट्रैकिंग\n\nAsk in English, Hindi, or Hinglish!";
  }

  // Officers — specific
  for (const officer of OFFICERS) {
    const keywords = [officer.name.toLowerCase(), officer.designation.toLowerCase()];
    if (keywords.some((kw) => q.includes(kw.split(" ").pop()) && q.includes(kw.split(" ")[0])) || q.includes(officer.designation.toLowerCase())) {
      return `**${officer.name}**\n*${officer.designation}*\n${officer.dept}\n\n${officer.detail}`;
    }
  }

  // Officers — general (English + Hindi/Hinglish)
  if (/officer|official|who (is|are)|staff|designat|director|secretary|chairman|chairperson|inspector|scientist|adviser|adhikari|अधिकारी|kaun hai|kon hai|officer kaun|karmchari|कर्मचारी|padadhikari|पदाधिकारी|sachiv|सचिव/i.test(q)) {
    const list = OFFICERS.map((o) => `• **${o.name}** — ${o.designation}, ${o.dept}`).join("\n");
    return `Here are the key officers / प्रमुख अधिकारी:\n\n${list}\n\nAsk about any officer by name for details.\nकिसी भी अधिकारी का नाम पूछें।`;
  }

  // Departments — specific
  for (const dept of DEPARTMENTS) {
    const deptLower = dept.name.toLowerCase();
    const words = deptLower.split(/[\s()]+/).filter((w) => w.length > 3);
    if (words.some((w) => q.includes(w))) {
      return `**${dept.name}**\n\n${dept.role}`;
    }
  }

  // Departments — general (English + Hindi/Hinglish)
  if (/department|division|section|wing|unit|branch|cell|organization|vibhag|विभाग|shakha|शाखा|anubhag|अनुभाग|karyalay|कार्यालय|konsa department|kaun sa vibhag/i.test(q)) {
    const list = DEPARTMENTS.map((d) => `• **${d.name}** — ${d.role.split(".")[0]}.`).join("\n");
    return `PARIVESH departments / परिवेश विभाग:\n\n${list}\n\nAsk about any department for details.\nकिसी भी विभाग के बारे में पूछें।`;
  }

  // Process queries (English + Hindi/Hinglish)
  if (/submit|apply|application|proposal|file|new (proposal|application)|avedan|आवेदन|prस्ताव|prastav|प्रस्ताव|jama|जमा|dakhil|दाखिल|kaise bhare|kaise submit|kaise apply|form bhar/i.test(q)) return PROCESS_INFO.submission;
  if (/scrutin|review|check|inspect|apprais|jaanch|जांच|samiksha|समीक्षा|pareeksha|परीक्षा|nireekshan|nirikshan|निरीक्षण/i.test(q)) return PROCESS_INFO.scrutiny;
  if (/mom|meeting|minute|committee|eac|seac|baithak|बैठक|samiti|समिति|karyavahi|कार्यवाही/i.test(q)) return PROCESS_INFO.meeting;
  if (/pay|fee|amount|cost|charge|bhugtan|भुगतान|shulk|शुल्क|paisa|paise|kitna lagta|kitna paisa|fees kitni/i.test(q)) return PROCESS_INFO.payment;
  if (/track|status|progress|where.*(my|proposal)|check.*status|sthiti|स्थिति|kahan tak|kahan pahuncha|kya hua|mera proposal|mera avedan/i.test(q)) return PROCESS_INFO.tracking;

  // EIA / Environmental (English + Hindi/Hinglish)
  if (/eia|environment.*impact|assessment|clearance.*environment|paryavaran|पर्यावरण|prabhav mulyankan|प्रभाव मूल्यांकन|environment clearance kya|ec kya hai/i.test(q)) {
    return "Environmental Impact Assessment (EIA) / पर्यावरण प्रभाव मूल्यांकन:\n\nA mandatory process for projects under EIA Notification 2006.\n\n• **Category A** — Central-level appraisal by EAC / केंद्रीय स्तर पर EAC द्वारा\n• **Category B** — State level by SEAC/SEIAA / राज्य स्तर पर SEAC द्वारा\n• Process: Screening → Scoping → Public Hearing → Appraisal → Decision\n• प्रक्रिया: स्क्रीनिंग → स्कोपिंग → जनसुनवाई → मूल्यांकन → निर्णय";
  }

  // Forest (English + Hindi/Hinglish)
  if (/forest|fc act|compensatory|afforestation|campa|van|वन|jungle|jangal|ped|पेड़|vriksha|वृक्ष|forest clearance kya|van manzuri/i.test(q)) {
    return "Forest Clearance / वन स्वीकृति:\n\nUnder FC Act 1980 / वन संरक्षण अधिनियम 1980:\n• Required for forest land diversion / वन भूमि परिवर्तन हेतु आवश्यक\n• Two-stage approval: Stage I → Stage II / दो चरण: चरण I → चरण II\n• CA and NPV must be deposited / प्रतिपूरक वनीकरण और NPV जमा करना अनिवार्य\n• Monitored via PARIVESH / परिवेश पोर्टल से निगरानी";
  }

  // Wildlife (English + Hindi/Hinglish)
  if (/wildlife|nbwl|protected.*area|national.*park|sanctuary|eco.?sensitive|vanyjiv|वन्यजीव|abhyaranya|अभयारण्य|rashtriy udyan|राष्ट्रीय उद्यान|janwar|जानवर/i.test(q)) {
    return "Wildlife Clearance / वन्यजीव स्वीकृति:\n\n• Required near Protected Areas / संरक्षित क्षेत्रों के पास आवश्यक\n• Approved by NBWL Standing Committee / NBWL स्थायी समिति द्वारा अनुमोदित\n• Covers National Parks, Sanctuaries, ESZs\n• राष्ट्रीय उद्यान, अभयारण्य, ईको-सेंसिटिव ज़ोन शामिल\n• Applications via PARIVESH / परिवेश पोर्टल से आवेदन";
  }

  // CRZ (English + Hindi/Hinglish)
  if (/crz|coastal|coast.*regulation|coast.*zone|tatiy|तटीय|samudra|समुद्र|kinara|किनारा|beach|sagar|सागर/i.test(q)) {
    return "CRZ Clearance / तटीय विनियमन क्षेत्र स्वीकृति:\n\n• Governed by CRZ Notification 2019 / CRZ अधिसूचना 2019\n• CRZ-I: Eco-Sensitive / पारिस्थितिक रूप से संवेदनशील\n• CRZ-II: Urban areas / शहरी क्षेत्र\n• CRZ-III: Rural areas / ग्रामीण क्षेत्र\n• CRZ-IV: Aquatic / जलीय क्षेत्र\n• Via PARIVESH with SCZMA/NCZMA coordination";
  }

  // Help (English + Hindi/Hinglish)
  if (/help|what can you|what do you|how.*use|guide|madad|मदद|sahayata|सहायता|kya kar sakte|kaise use kare|batao|बताओ|samjhao|समझाओ/i.test(q)) {
    return "I can help with / मैं मदद कर सकता हूं:\n\n🏛️ **Officers / अधिकारी** — Ask about PARIVESH officials\n🏢 **Departments / विभाग** — Learn about divisions\n📋 **Processes / प्रक्रिया** — Submission, scrutiny, MoM, payment\n🌿 **Clearances / स्वीकृतियां** — EC, Forest, Wildlife, CRZ\n📰 **News / समाचार** — Switch to News tab\n\nTry: \"officers batao\" or \"proposal kaise submit kare?\"";
  }

  // Hindi/Hinglish generic thanks
  if (/thank|dhanyavad|धन्यवाद|shukriya|शुक्रिया|bahut accha|bohot accha/i.test(q)) {
    return "You're welcome! 🙏 / आपका स्वागत है!\n\nAgar koi aur sawal ho toh zaroor puchiye.\nIf you have more questions, feel free to ask!";
  }

  // Fallback (bilingual)
  return "I didn't quite understand that. / मैं यह समझ नहीं पाया।\n\nYou can try / आप पूछ सकते हैं:\n• \"Tell me about officers\" / \"अधिकारियों के बारे में बताओ\"\n• \"Departments kya hain?\" / \"विभाग क्या हैं?\"\n• \"Proposal kaise submit kare?\" / \"How to submit?\"\n• \"EIA kya hai?\" / \"What is EIA?\"\n• \"Scrutiny process batao\" / \"Explain scrutiny\"\n\nOr switch to **News & Events** tab! / या समाचार टैब देखें!";
}

/* ── Icons ─────────────────────────────────────────────────────── */
function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function SpeakerMuteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

/* ── Main Component ────────────────────────────────────────────── */
export default function PariveshAssistant() {
  const { t } = usePortalUi();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("assistant"); // "assistant" | "news"
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize with greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          role: "bot",
          text: t("assistant.greeting"),
          time: new Date(),
        },
      ]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Stop speech when muted
  useEffect(() => {
    if (isMuted && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isMuted]);

  const speak = useCallback((text) => {
    if (isMuted) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const plainText = text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/•/g, "").replace(/\n/g, ". ");
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const handleSend = useCallback(
    (overrideText) => {
      const text = (overrideText || input).trim();
      if (!text) return;

      const userMsg = { id: Date.now() + "-u", role: "user", text, time: new Date() };
      const botResponse = matchResponse(text);
      const botMsg = { id: Date.now() + "-b", role: "bot", text: botResponse, time: new Date() };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInput("");

      // Auto-speak response (unless muted)
      speak(botResponse);
    },
    [input, speak]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // Render formatted bot text
  const renderBotText = (text) => {
    return text.split("\n").map((line, i) => {
      let formatted = line
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
      return (
        <span
          key={i}
          dangerouslySetInnerHTML={{ __html: formatted }}
          style={{ display: "block", minHeight: line === "" ? "8px" : undefined }}
        />
      );
    });
  };

  return (
    <>
      {/* ── FAB Button ── */}
      <button
        id="parivesh-assistant-fab"
        type="button"
        onClick={() => {
          setIsOpen((v) => !v);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 350);
        }}
        className="assistant-fab"
        aria-label={isOpen ? t("assistant.close") : t("assistant.open")}
      >
        {isOpen ? <CloseIcon /> : <HeadsetIcon />}
      </button>

      {/* ── Panel ── */}
      {isOpen && (
        <div className="assistant-panel" role="dialog" aria-label="PARIVESH Assistant">
          {/* Header */}
          <div className="assistant-panel-header">
            <div className="flex items-center gap-2">
              <div className="assistant-header-dot" />
              <span className="text-sm font-bold tracking-wide text-white">
                {t("assistant.title")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Mute / Unmute toggle */}
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                className="assistant-mute-btn"
                title={isMuted ? t("assistant.unmute") : t("assistant.mute")}
                aria-label={isMuted ? "Unmute auto-read" : "Mute auto-read"}
              >
                {isMuted ? <SpeakerMuteIcon /> : <SpeakerIcon />}
              </button>
              <span className="text-[10px] font-medium text-white/60 uppercase tracking-widest">
                MoEFCC
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="assistant-tabs">
            <button
              type="button"
              onClick={() => setActiveTab("assistant")}
              className={`assistant-tab ${activeTab === "assistant" ? "assistant-tab-active" : ""}`}
            >
              💬 {t("assistant.tabAssistant")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("news")}
              className={`assistant-tab ${activeTab === "news" ? "assistant-tab-active" : ""}`}
            >
              📰 {t("assistant.tabNews")}
            </button>
          </div>

          {/* ── Assistant Tab ── */}
          {activeTab === "assistant" && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="assistant-chat-area">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`assistant-msg ${msg.role === "user" ? "assistant-msg-user" : "assistant-msg-bot"}`}
                  >
                    <div className={`assistant-bubble ${msg.role === "user" ? "assistant-bubble-user" : "assistant-bubble-bot"}`}>
                      {msg.role === "bot" ? renderBotText(msg.text) : msg.text}
                    </div>
                    <div className={`assistant-msg-meta ${msg.role === "user" ? "text-right" : "text-left"}`}>
                      <span>{formatTime(msg.time)}</span>
                      {msg.role === "bot" && (
                        <button
                          type="button"
                          className="assistant-speak-btn"
                          onClick={() => speak(msg.text)}
                          aria-label="Read aloud"
                          title={isMuted ? t("assistant.mutedTooltip") : "Read aloud"}
                        >
                          {isMuted ? <SpeakerMuteIcon /> : <SpeakerIcon />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="assistant-input-area">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("assistant.placeholder")}
                  className="assistant-text-input"
                  aria-label="Type your question"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="assistant-send-btn"
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          )}

          {/* ── News Tab ── */}
          {activeTab === "news" && (
            <div className="assistant-news-area">
              <div className="px-4 pt-3 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--portal-gold)]">
                  {t("assistant.newsHeading")}
                </h3>
              </div>
              <div className="assistant-news-list">
                {NEWS_ITEMS.map((item) => (
                  <article key={item.id} className="assistant-news-card">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="assistant-news-badge">{item.category}</span>
                      <span className="text-[10px] text-[var(--portal-muted)]">{formatDate(item.date)}</span>
                    </div>
                    <h4 className="text-[13px] font-semibold leading-snug text-[var(--portal-green-900)]">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-[11px] leading-[1.5] text-[var(--portal-muted)]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Footer branding */}
          <div className="assistant-panel-footer">
            {isSpeaking && (
              <span className="text-[10px] text-green-600 font-medium animate-pulse mr-auto">
                🔊 Speaking…
              </span>
            )}
            {isMuted && (
              <span className="text-[10px] text-orange-500 font-medium mr-auto">
                🔇 {t("assistant.mutedLabel")}
              </span>
            )}
            <span className="text-[10px] text-[var(--portal-muted)] ml-auto">
              PARIVESH 3.0 • MoEFCC
            </span>
          </div>
        </div>
      )}
    </>
  );
}
