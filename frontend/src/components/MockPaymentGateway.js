"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/api";
import toast from "react-hot-toast";

/**
 * Mock UPI Payment Gateway component.
 *
 * Flow:
 *  1. Show fee breakdown â†’ "Pay Fee" button
 *  2. Click Pay Fee â†’ initiate payment â†’ show scannable QR
 *     QR encodes LAN IP URL so phones on the same network can open it
 *  3. User scans QR on phone â†’ opens /mock-pay/[paymentId] â†’ sees amount + Pay button
 *  4. Desktop polls for completion â†’ shows "Payment Successful (Mock)"
 *
 * Props:
 *  - applicationId (string): UUID of the application
 *  - onPaymentSuccess (function): callback after successful payment
 *  - onCancel (function): callback to close/cancel
 */

const POLL_INTERVAL_MS = 2000;

const isLocalhost = (host) => host === "localhost" || host === "127.0.0.1";

export default function MockPaymentGateway({ applicationId, onPaymentSuccess, onCancel }) {
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  // step: "fee" | "qr" | "success"
  const [step, setStep] = useState("fee");
  const [initiating, setInitiating] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [phoneHost, setPhoneHost] = useState("");

  const pollRef = useRef(null);

  useEffect(() => {
    api
      .get(`/payments/calculate-fee/${applicationId}`)
      .then(({ data }) => setFeeData(data))
      .catch(() => toast.error("Failed to calculate fee"))
      .finally(() => setLoading(false));
  }, [applicationId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.localStorage.getItem("mockPayPhoneHost") || "";
    setPhoneHost(host);
  }, []);

  // Start polling once QR is shown
  useEffect(() => {
    if (step !== "qr" || !paymentId) return;

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/application/${applicationId}`);
        const completed = data.find((p) => p.id === paymentId && p.status === "completed");
        if (completed) {
          clearInterval(pollRef.current);
          setStep("success");
          toast.success("Payment successful! Application submitted.");
          setTimeout(() => onPaymentSuccess?.(), 1800);
        }
      } catch {
        // Ignore polling errors and keep trying.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [step, paymentId, applicationId, onPaymentSuccess]);

  const buildBaseUrl = () => {
    if (typeof window === "undefined") return "";

    const { protocol, hostname, port } = window.location;
    if (!isLocalhost(hostname)) {
      return window.location.origin;
    }

    const cleaned = (phoneHost || "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (!cleaned) return "";

    // Allow host with optional port in the input.
    if (cleaned.includes(":")) {
      return `${protocol}//${cleaned}`;
    }
    return `${protocol}//${cleaned}:${port || "3000"}`;
  };

  const handlePayFee = async () => {
    const baseUrl = buildBaseUrl();
    const runningOnLocalhost = typeof window !== "undefined" && isLocalhost(window.location.hostname);

    if (runningOnLocalhost && !baseUrl) {
      toast.error("Enter your PC LAN IP first (example: 192.168.1.10)");
      return;
    }

    setInitiating(true);
    try {
      if (typeof window !== "undefined" && phoneHost.trim()) {
        window.localStorage.setItem("mockPayPhoneHost", phoneHost.trim());
      }

      const { data: payment } = await api.post("/payments/initiate", {
        application_id: applicationId,
        payment_method: "upi",
      });

      const url = `${baseUrl}/mock-pay/${payment.payment_id}`;
      setPaymentId(payment.payment_id);
      setQrUrl(url);
      setStep("qr");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not initiate payment");
    } finally {
      setInitiating(false);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val || 0));

  const runningOnLocalhost =
    typeof window !== "undefined" && isLocalhost(window.location.hostname);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-green-700">Payment Successful (Mock)</h3>
          <p className="text-sm text-gray-500 mt-1">
            {formatCurrency(feeData?.total_fee)} paid · Application auto-submitted
          </p>
        </div>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Scan to Pay</h3>
          <p className="text-sm text-gray-500 mt-1">Open your phone camera and scan the QR code below</p>
        </div>

        {runningOnLocalhost && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Using localhost on desktop. Phone must use your PC LAN IP (example: 192.168.1.10).
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 inline-block shadow-sm">
            <QRCodeSVG
              value={qrUrl}
              size={200}
              bgColor="#ffffff"
              fgColor="#1a1a1a"
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-gray-400">parivesh@gov</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Amount Due</p>
          <p className="text-2xl font-bold text-green-700 mt-0.5">{formatCurrency(feeData?.total_fee)}</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Waiting for payment on phone...
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Payment URL</p>
          <a
            href={qrUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 underline break-all"
          >
            {qrUrl}
          </a>
        </div>

        {onCancel && (
          <button
            onClick={() => {
              clearInterval(pollRef.current);
              onCancel();
            }}
            className="w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-3">
          <span className="text-2xl font-bold text-green-700" style={{ fontFamily: "sans-serif" }}>
            &#x20B9;
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Environmental Clearance Fee</h3>
        <p className="text-sm text-gray-500 mt-1">Ref: {feeData?.reference_number}</p>
        <p className="text-xs text-gray-400 mt-1.5">Pay the mandatory fee to submit your draft for scrutiny.</p>
      </div>

      {runningOnLocalhost && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
          <p className="text-xs text-blue-800">
            Enter your PC LAN IP so your phone can open the QR URL.
          </p>
          <input
            value={phoneHost}
            onChange={(e) => setPhoneHost(e.target.value)}
            placeholder="192.168.1.10 or 192.168.1.10:3000"
            className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <p className="text-xs text-blue-700">Find IP using: ipconfig (IPv4 Address)</p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Estimated Project Cost</span>
          <span className="font-medium">
            {feeData?.estimated_cost ? formatCurrency(feeData.estimated_cost) : "Not specified"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Fee Slab</span>
          <span className="text-xs text-gray-500">
            {feeData?.estimated_cost && Number(feeData.estimated_cost) < 50_00_00_000
              ? "< INR 50 Cr"
              : Number(feeData?.estimated_cost) <= 100_00_00_000
              ? "INR 50 Cr - INR 100 Cr"
              : "> INR 100 Cr"}
          </span>
        </div>
        <hr className="border-gray-200" />
        <div className="flex justify-between text-base font-semibold">
          <span>Total Fee</span>
          <span className="text-green-700">{formatCurrency(feeData?.total_fee)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handlePayFee}
          disabled={initiating}
          className="w-full py-3 text-sm font-semibold rounded-lg transition-colors
            bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {initiating ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Generating QR...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m0 14v1m8-8h-1M5 12H4m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
              </svg>
              Pay Fee - {formatCurrency(feeData?.total_fee)}
            </>
          )}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={initiating}
            className="w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>

      <p className="text-xs text-center text-gray-400">Mock payment gateway - No real money is deducted</p>
    </div>
  );
}
