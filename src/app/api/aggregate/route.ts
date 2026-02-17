import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deployHook = process.env.VERCEL_DEPLOY_HOOK;
  if (!deployHook) {
    return NextResponse.json(
      { error: "VERCEL_DEPLOY_HOOK not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(deployHook, { method: "POST" });

    if (!res.ok) {
      throw new Error(`Deploy hook returned ${res.status}`);
    }

    return NextResponse.json({ success: true, message: "Deploy triggered" });
  } catch (error) {
    console.error("Failed to trigger deploy:", error);
    return NextResponse.json(
      { error: "Failed to trigger deploy" },
      { status: 500 }
    );
  }
}
