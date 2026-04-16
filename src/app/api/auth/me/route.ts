import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE, accountToUser } from "@/lib/auth";
import type { User } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(AUTH_USER_COOKIE)?.value;
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    if (!userCookie) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user: User = JSON.parse(decodeURIComponent(userCookie));

    if (user.departmentId) {
      return NextResponse.json({ user });
    }

    if (!token) {
      return NextResponse.json({ user });
    }

    const BACKEND_URL = process.env.BACKEND_URL;
    const meUrl = new URL(`${BACKEND_URL}/api/auth/me`);
    meUrl.searchParams.set("jwt", token);

    const backendResponse = await fetch(meUrl.toString(), {
      method: "GET",
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      return NextResponse.json({ user });
    }

    const payload = await backendResponse.json().catch(() => null);
    const account = payload?.data?.account || payload?.data || payload;

    if (!account || !account.accountId) {
      return NextResponse.json({ user });
    }

    const refreshedUser = accountToUser(account);

    cookieStore.set(
      AUTH_USER_COOKIE,
      encodeURIComponent(JSON.stringify(refreshedUser)),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      },
    );

    return NextResponse.json({ user: refreshedUser });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
