/**
 * Server-side proxy for the public payment endpoints.
 * Routes are called from the phone browser — this keeps everything on
 * port 3000 so the phone never needs to reach port 5000 directly.
 *
 * GET  /api/mock-pay/[paymentId]      → fetch payment details
 * POST /api/mock-pay/[paymentId]      → confirm (pay) the payment
 */

const BACKEND =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://backend:5000/api";

export async function GET(request, { params }) {
  const { paymentId } = params;
  try {
    const res = await fetch(`${BACKEND}/payments/public/${paymentId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ error: "Backend unreachable" }, { status: 502 });
  }
}

export async function POST(request, { params }) {
  const { paymentId } = params;
  try {
    const res = await fetch(`${BACKEND}/payments/public/${paymentId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
