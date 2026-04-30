import { NextResponse } from "next/server";
import { APP_NAME } from "@/lib/constants";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database timeout")), 2000)),
    ]);
    return NextResponse.json({
      status: "ok",
      app: APP_NAME,
      database: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        app: APP_NAME,
        database: "unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
