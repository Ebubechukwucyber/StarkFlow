import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.AVNU_API_KEY?.trim();
  const looksLikePlaceholder =
    !apiKey ||
    apiKey.length < 10 ||
    apiKey === "YOUR_AVNU_PAYMASTER_API_KEY" ||
    apiKey.startsWith("YOUR_");

  if (looksLikePlaceholder) {
    return NextResponse.json(
      {
        error:
          "Missing AVNU_API_KEY. Get it from AVNU Portal and set it in .env.local.",
      },
      { status: 500 },
    );
  }

  const avnuUrl = "https://starknet.paymaster.avnu.fi";

  const contentType =
    request.headers.get("content-type") ?? "application/json";

  const body = await request.text();

  const upstream = await fetch(avnuUrl, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      "x-paymaster-api-key": apiKey,
    },
    body,
  });

  const data = await upstream.text();

  // AVNU returns JSON; forward it as-is.
  return new NextResponse(data, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

