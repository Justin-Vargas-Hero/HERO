// src/app/api/user/email/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { authOptions } from "@/lib/auth";

const ses = new SESv2Client({ region: process.env.REGION || process.env.AWS_REGION || 'us-east-1' });

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email: newEmail } = await request.json();

        if (!newEmail) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }

        // Check if new email is already taken (case-insensitive)
        const existingUser = await prisma.user.findFirst({
            where: { 
                email: {
                    equals: newEmail,
                    mode: 'insensitive'
                },
                NOT: {
                    email: {
                        equals: session.user.email,
                        mode: 'insensitive'
                    }
                }
            }
        });

        if (existingUser) {
            return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }

        // Find the current user first to get their ID
        const currentUser = await prisma.user.findFirst({
            where: { 
                email: {
                    equals: session.user.email,
                    mode: 'insensitive'
                }
            }
        });

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Update user's email (store lowercase)
        const updatedUser = await prisma.user.update({
            where: { id: currentUser.id },
            data: { 
                email: newEmail.toLowerCase(),
                emailVerified: null // Reset email verification
            }
        });

        // Create new verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

        await prisma.verificationToken.create({
            data: {
                identifier: newEmail.toLowerCase(),
                token: verificationToken,
                expires
            }
        });

        // Send verification email to new address
        const verifyUrl = `${process.env.APP_URL}/api/verify-email?token=${verificationToken}&email=${encodeURIComponent(newEmail.toLowerCase())}`;

        await ses.send(
            new SendEmailCommand({
                FromEmailAddress: process.env.EMAIL_FROM!,
                Destination: { ToAddresses: [newEmail.toLowerCase()] },
                Content: {
                    Simple: {
                        Subject: { Data: "Verify your new email address - HERO" },
                        Body: {
                            Text: { 
                                Data: `Your email address has been updated.\n\nPlease verify your new email address by clicking the link below:\n\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't request this change, please contact support immediately.` 
                            }
                        }
                    }
                }
            })
        );

        return NextResponse.json({ 
            message: "Email updated successfully. Please check your new email for verification.",
            requiresVerification: true 
        });
    } catch (error) {
        console.error("Email update error:", error);
        return NextResponse.json(
            { error: "Failed to update email" },
            { status: 500 }
        );
    }
}