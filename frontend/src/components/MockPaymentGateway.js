"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

/**
 * Mock UPI Payment Gateway component.
 * Collects the mandatory draft-stage EC fee and then auto-submits the
 * application once payment is confirmed.
 *
 * Props:
 *  - applicationId (string): UUID of the application
 *  - onPaymentSuccess (function): callback after successful payment
 *  - onCancel (function): callback to close/cancel
 */
export default function MockPaymentGateway({ applicationId, onPaymentSuccess, onCancel }) {
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    api
      .get(`/payments/calculate-fee/${applicationId}`)
      .then(({ data }) => setFeeData(data))
      .catch(() => toast.error("Failed to calculate fee"))
      .finally(() => setLoading(false));
  }, [applicationId]);

  const handleSimulatePayment = async () => {
    setProcessing(true);
    try {
      // Step 1: Initiate the payment
      const { data: payment } = await api.post("/payments/initiate", {
        application_id: applicationId,
        payment_method: "upi",
      });

      // Step 2: Simulate 2-second bank gateway delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: Confirm the payment (triggers auto-submit on backend)
      await api.post(`/payments/${payment.payment_id}/confirm`);

      setPaymentDone(true);
      toast.success("Payment successful! Application submitted.");

      // Brief pause to show success state, then notify parent
      setTimeout(() => {
        onPaymentSuccess?.();
      }, 1200);
    } catch (err) {
      toast.error(err.response?.data?.error || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (val) =>
    `₹${Number(val).toLocaleString("en-IN")}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Draft-Stage Environmental Clearance Fee
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Ref: {feeData?.reference_number}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Payment is mandatory before this draft can be submitted for scrutiny.
        </p>
      </div>

      {/* Fee Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Estimated Project Cost</span>
          <span className="font-medium">
            {feeData?.estimated_cost
              ? formatCurrency(feeData.estimated_cost)
              : "Not specified"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Fee Slab</span>
          <span className="text-xs text-gray-500">
            {feeData?.estimated_cost && Number(feeData.estimated_cost) < 50_00_00_000
              ? "< ₹50 Cr"
              : Number(feeData?.estimated_cost) <= 100_00_00_000
              ? "₹50 Cr – ₹100 Cr"
              : "> ₹100 Cr"}
          </span>
        </div>
        <hr className="border-gray-200" />
        <div className="flex justify-between text-base font-semibold">
          <span>Total Fee</span>
          <span className="text-green-700">
            {formatCurrency(feeData?.total_fee)}
          </span>
        </div>
      </div>

      {/* Mock QR Code */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          Scan QR Code to Pay via UPI
        </p>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-3 inline-block">
          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            xmlns="http://www.w3.org/2000/svg"
            className="block"
          >
            {/* QR-style pattern - outer frame */}
            <rect x="0" y="0" width="180" height="180" fill="white" />
            {/* Top-left finder */}
            <rect x="10" y="10" width="50" height="50" rx="4" fill="#1a1a1a" />
            <rect x="16" y="16" width="38" height="38" rx="2" fill="white" />
            <rect x="22" y="22" width="26" height="26" rx="2" fill="#1a1a1a" />
            {/* Top-right finder */}
            <rect x="120" y="10" width="50" height="50" rx="4" fill="#1a1a1a" />
            <rect x="126" y="16" width="38" height="38" rx="2" fill="white" />
            <rect x="132" y="22" width="26" height="26" rx="2" fill="#1a1a1a" />
            {/* Bottom-left finder */}
            <rect x="10" y="120" width="50" height="50" rx="4" fill="#1a1a1a" />
            <rect x="16" y="126" width="38" height="38" rx="2" fill="white" />
            <rect x="22" y="132" width="26" height="26" rx="2" fill="#1a1a1a" />
            {/* Data modules (mock pattern) */}
            {[
              [70,10],[80,10],[90,10],[100,10],
              [70,20],[90,20],[110,20],
              [70,30],[80,30],[100,30],[110,30],
              [70,40],[90,40],[100,40],
              [10,70],[20,70],[30,70],[40,70],[50,70],[70,70],[80,70],[90,70],[100,70],[110,70],[120,70],[130,70],[140,70],[150,70],[160,70],
              [10,80],[30,80],[50,80],[70,80],[90,80],[120,80],[140,80],[160,80],
              [10,90],[20,90],[30,90],[40,90],[50,90],[70,90],[80,90],[90,90],[100,90],[110,90],[120,90],[130,90],[140,90],[150,90],[160,90],
              [10,100],[30,100],[50,100],[70,100],[90,100],[120,100],[140,100],[160,100],
              [10,110],[20,110],[30,110],[40,110],[50,110],[70,110],[80,110],[90,110],[100,110],[110,110],[120,110],[130,110],[140,110],[150,110],[160,110],
              [70,120],[80,120],[90,120],[100,120],[110,120],
              [70,130],[100,130],[110,130],[120,130],[140,130],[150,130],[160,130],
              [70,140],[80,140],[90,140],[120,140],[150,140],
              [70,150],[100,150],[110,150],[130,150],[140,150],[160,150],
              [70,160],[80,160],[90,160],[100,160],[110,160],[120,160],[130,160],[140,160],[150,160],[160,160],
            ].map(([x, y], i) => (
              <rect key={i} x={x} y={y} width="8" height="8" fill="#1a1a1a" />
            ))}
            {/* Center logo area */}
            <rect x="70" y="70" width="40" height="40" rx="6" fill="white" stroke="#e5e7eb" strokeWidth="1" />
            <text x="90" y="95" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#16a34a">
              UPI
            </text>
          </svg>
        </div>
        <p className="text-xs text-gray-400">parivesh@gov</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">OR</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Simulate Payment Button */}
      {paymentDone ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Payment Successful — Auto-Submitting Draft…
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleSimulatePayment}
            disabled={processing}
            className="w-full py-3 text-sm font-semibold rounded-lg transition-colors
              bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Processing via Bank Gateway…
              </>
            ) : (
              <>💳 Simulate Payment — {formatCurrency(feeData?.total_fee)}</>
            )}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={processing}
              className="w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-center text-gray-400">
        This is a mock payment gateway for demonstration purposes.
        No actual money is deducted, but the draft will be submitted automatically.
      </p>
    </div>
  );
}
