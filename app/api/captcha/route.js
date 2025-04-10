// app/api/captcha/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateCaptcha } from "@/lib/captcha";

export async function GET() {
  try {
    // Generate a captcha image and code
    const { image, code } = await generateCaptcha();

    // Store the captcha code in a cookie for verification
    const cookieStore = cookies();
    cookieStore.set({
      name: "captcha_code",
      value: code,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
      sameSite: "lax",
    });

    // Set the content type to image/svg+xml for our SVG captcha
    return new NextResponse(image, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("Captcha generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate captcha" },
      { status: 500 }
    );
  }
}
