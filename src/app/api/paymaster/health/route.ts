import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.AVNU_API_KEY?.trim();
  const looksLikePlaceholder =
    !apiKey ||
    apiKey.length < 10 ||
    apiKey === "YOUR_AVNU_PAYMASTER_API_KEY" ||
    apiKey.startsWith("YOUR_");

  return NextResponse.json({
    ok: !looksLikePlaceholder,
    reason: looksLikePlaceholder ? "AVNU_API_KEY missing/placeholder" : null,
  });
}

