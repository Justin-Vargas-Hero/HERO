import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ taken: false });
        }

        // CRITICAL: Check case-insensitively
        const existingUser = await prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive' // Case-insensitive comparison
                }
            }
        });

        return NextResponse.json({ taken: !!existingUser });
    } catch (error) {
        console.error("Error checking email:", error);
        return NextResponse.json({ taken: false });
    }
}