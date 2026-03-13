"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PortalBrandMark from "./PortalBrandMark";
import { usePortalUi } from "@/contexts/PortalUiContext";

function CaretDown() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UtilityFlag() {
  return (
    <div className="relative h-5 w-7 overflow-hidden rounded-[2px] border border-white/20 shadow-sm">
      <Image
        src="/branding/indian-flag.svg"
        alt="Flag of India"
        fill
        className="object-cover"
        sizes="28px"
      />
    </div>
  );
}

function NationalEmblemBadge() {
  return (
    <div className="flex items-center justify-center px-2 py-1">
      <div className="relative h-[74px] w-[46px] sm:h-[82px] sm:w-[52px]">
        <Image
          src="/branding/emblem-of-india.svg"
          alt="National Emblem of India"
          fill
          className="object-contain"
          sizes="52px"
        />
      </div>
    </div>
  );
}

export default function PublicHeader({ activeNav = "Home", activeAction }) {
  const {
    language,
    setLanguage,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    t,
  } = usePortalUi();
  const [isLanguageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef(null);

  const navItems = [
    { key: "home", href: "/" },
    { key: "about", href: "/#about" },
    { key: "clearance", href: "#", hasMenu: true },
    { key: "downloads", href: "#", hasMenu: true },
    { key: "guide", href: "#", hasMenu: true },
    { key: "contact", href: "#" },
    { key: "dashboard", href: "/dashboard" },
    { key: "complaint", href: "#" },
    { key: "vacancies", href: "#" },
  ];

  useEffect(() => {
    function handleOutsideClick(event) {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header className="border-b border-[var(--portal-border)] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <div className="bg-[linear-gradient(90deg,#3f8b31_0%,#3b8a33_20%,#295f83_100%)] text-white">
        <div className="portal-shell flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-2 font-semibold">
              <UtilityFlag />
              <span>भारत</span>
            </div>
            <span className="hidden opacity-70 sm:inline">|</span>
            <div className="font-medium">{t("header.governmentOfIndia")}</div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button className="font-medium hover:opacity-80" type="button" onClick={decreaseFontSize} aria-label="Decrease font size">
              A-
            </button>
            <button className="font-medium hover:opacity-80" type="button" onClick={resetFontSize} aria-label="Reset font size">
              A
            </button>
            <button className="font-medium hover:opacity-80" type="button" onClick={increaseFontSize} aria-label="Increase font size">
              A+
            </button>
            <div className="relative" ref={languageMenuRef}>
              <button
                className="inline-flex items-center gap-1 font-medium hover:opacity-80"
                type="button"
                onClick={() => setLanguageMenuOpen((current) => !current)}
              >
                {t("header.languageLabel")}
                <CaretDown />
              </button>
              {isLanguageMenuOpen ? (
                <div className="absolute right-0 top-full z-20 mt-2 min-w-[132px] overflow-hidden rounded-xl border border-white/20 bg-white text-[var(--portal-ink)] shadow-lg">
                  <button
                    type="button"
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-[var(--portal-soft)] ${language === "en" ? "bg-[var(--portal-soft)] font-semibold" : ""}`}
                    onClick={() => {
                      setLanguage("en");
                      setLanguageMenuOpen(false);
                    }}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-[var(--portal-soft)] ${language === "hi" ? "bg-[var(--portal-soft)] font-semibold" : ""}`}
                    onClick={() => {
                      setLanguage("hi");
                      setLanguageMenuOpen(false);
                    }}
                  >
                    हिंदी
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#f5f5f5]">
        <div className="portal-shell flex flex-col gap-5 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-1 items-center lg:pr-8">
            <PortalBrandMark
              subtitle=""
              priority
              framed={false}
              imageWidthClass="w-[280px] sm:w-[400px] md:w-[500px] lg:w-[560px] xl:w-[620px]"
              imageHeightClass="h-[88px] sm:h-[98px] md:h-[108px] lg:h-[116px]"
              className="w-full px-0 py-0 shadow-none"
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-4 pl-2 lg:justify-end lg:pl-6">
            <NationalEmblemBadge />
          </div>
        </div>
      </div>

      <nav className="border-t border-[var(--portal-border)] bg-white">
        <div className="portal-shell flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-1 flex-wrap items-center gap-1 md:gap-2">
            {navItems.map((item) => {
              const label = t(`header.nav.${item.key}`);
              const isActive = activeNav === (item.key.charAt(0).toUpperCase() + item.key.slice(1));
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`inline-flex items-center gap-1 rounded-sm px-4 py-3 text-[15px] font-semibold transition ${
                    isActive
                      ? "bg-[#4b8f34] text-white"
                      : "text-[#1f1f1f] hover:bg-[#f3f7ef] hover:text-[var(--portal-green-900)]"
                  }`}
                >
                  {label}
                  {item.hasMenu ? <CaretDown /> : null}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center rounded-sm bg-[#d7a63c] px-5 py-3 text-[15px] font-semibold text-white shadow-sm hover:bg-[#c59530]"
            >
              {t("header.search")}
            </button>
            <Link
              href="/auth/login"
              className={`inline-flex items-center gap-1 rounded-sm px-5 py-3 text-[15px] font-semibold shadow-sm ${
                activeAction === "login" ? "bg-[#356f2e] text-white" : "bg-[#4b8f34] text-white hover:bg-[#356f2e]"
              }`}
            >
              {t("header.login")}
              <CaretDown />
            </Link>
            <Link
              href="/auth/register"
              className={`inline-flex items-center gap-1 rounded-sm px-5 py-3 text-[15px] font-semibold shadow-sm ${
                activeAction === "register" ? "bg-[#356f2e] text-white" : "bg-[#4b8f34] text-white hover:bg-[#356f2e]"
              }`}
            >
              {t("header.register")}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}