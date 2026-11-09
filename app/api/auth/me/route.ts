import { NextResponse } from "next/server";
import { getAuthenticatedWalletFromRequest } from "@/lib/evm/auth";

export async function GET(request: Request) {
  const address = getAuthenticatedWalletFromRequest(request);
  if (!address) {
    return NextResponse.json({ authenticated: false, address: null }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, address });
}
