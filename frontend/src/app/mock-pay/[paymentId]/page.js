"use client";
import { useState, useEffect } from "react";

export default function MockPayPage({ params }) {
  const { paymentId } = params;

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Call the Next.js proxy route (same origin / port 3000).
    // The phone never needs to reach port 5000 directly.
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000);

    fetch(`/api/mock-pay/${paymentId}`, { signal: controller.signal })
      .then(async (res) => {
        clearTimeout(tid);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load payment");
        if (data.status === "completed") setDone(true);
        setPayment(data);
      })
      .catch((err) => {
        clearTimeout(tid);
        setError(
          err.name === "AbortError"
            ? "Request timed out. Please try again."
            : "Payment not found or server unreachable."
        );
      })
      .finally(() => setLoading(false));
  }, [paymentId]);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch(`/api/mock-pay/${paymentId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Payment failed");
      setDone(true);
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load Payment</h2>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 shadow">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-green-700 mb-1">Payment Successful</h1>
        <p className="text-sm text-green-600 font-medium mb-4">(Mock)</p>

        {payment?.reference_number && (
          <p className="text-xs text-gray-500 mb-1">Ref: {payment.reference_number}</p>
        )}
        <p className="text-gray-700 font-semibold text-lg">
          {payment?.amount ? formatCurrency(payment.amount) : ""} paid to parivesh@gov
        </p>

        <p className="text-xs text-gray-400 mt-6">
          Your application has been automatically submitted for scrutiny.
          You may close this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header bar */}
        <div className="bg-green-600 px-6 py-4 text-center">
          <p className="text-white text-xs font-semibold uppercase tracking-widest opacity-80">
            PARIVESH · Mock UPI
          </p>
          <p className="text-white text-sm mt-0.5 opacity-70">parivesh@gov</p>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Application reference */}
          {payment?.reference_number && (
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Application</p>
              <p className="text-sm font-medium text-gray-700">{payment.reference_number}</p>
            </div>
          )}

          {/* Amount */}
          <div className="text-center py-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Amount Due</p>
            <p className="text-4xl font-bold text-gray-900">
              {payment?.amount ? formatCurrency(payment.amount) : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Environmental Clearance Fee</p>
          </div>

          {/* UPI indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-0.5 border border-gray-200 rounded text-green-700 font-bold text-xs">
              UPI
            </span>
            <span>Secure Mock Payment</span>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full py-4 rounded-xl font-bold text-base text-white transition-all
              bg-green-600 hover:bg-green-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 shadow-sm"
          >
            {paying ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Processing…
              </>
            ) : (
              <>
                Pay {payment?.amount ? formatCurrency(payment.amount) : ""}
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            This is a mock payment. No real money is transferred.
          </p>
        </div>
      </div>
    </div>
  );
}
