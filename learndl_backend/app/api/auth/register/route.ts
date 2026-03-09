import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid token" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;
    const name = decodedToken.name || null;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { firebaseUid },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists", user: existingUser },
        { status: 200 }
      );
    }

    const user = await prisma.user.create({
      data: {
        firebaseUid,
        email,
        name,
      },
    });

    return NextResponse.json(
      { message: "User registered successfully", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}