import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({ region: process.env.REGION || process.env.AWS_REGION || 'us-east-1' });

export async function POST(req: Request) {
    const body = await req.json();
    const { firstName, lastName, username, email, password, confirmPassword, dobMonth, dobDay, dobYear, timezone, token } = body;

    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${token}`,
    });
    const data = await verify.json();

    if (!data.success) {
        return Response.json({ error: "Captcha failed" }, { status: 400 });
    }

    // Check for existing email - case insensitive
    const existingEmail = await prisma.user.findFirst({
        where: {
            email: {
                equals: email,
                mode: 'insensitive'
            }
        }
    });
    if (existingEmail) return Response.json({ error: "Email already registered" }, { status: 409 });

    // Check for existing username - case insensitive
    const existingUsername = await prisma.user.findFirst({
        where: {
            username: {
                equals: username,
                mode: 'insensitive'
            }
        }
    });
    if (existingUsername) return Response.json({ error: "Username already taken" }, { status: 409 });

    const hashed = await hash(password, 10);
    const user = await prisma.user.create({
        data: {
            firstName,              // Preserve case as entered
            lastName,               // Preserve case as entered
            username,               // Preserve case as entered
            email: email.toLowerCase(),  // ALWAYS store lowercase
            password: hashed,
            dobMonth: Number(dobMonth),
            dobDay: Number(dobDay),
            dobYear: Number(dobYear),
            timezone: timezone || 'UTC',  // Default to UTC if not provided
        },
    });

    const vt = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    // Store verification token with lowercase email
    await prisma.verificationToken.create({
        data: {
            identifier: email.toLowerCase(),
            token: vt,
            expires
        }
    });

    // Use lowercase email for verification URL
    const verifyUrl = `${process.env.APP_URL}/api/verify-email?token=${vt}&email=${encodeURIComponent(email.toLowerCase())}`;

    // Send email to lowercase version
    await ses.send(
        new SendEmailCommand({
            FromEmailAddress: process.env.EMAIL_FROM!,
            Destination: { ToAddresses: [email.toLowerCase()] },
            Content: {
                Simple: {
                    Subject: { Data: "Verify your HERO account" },
                    Body: {
                        Text: { Data: `Welcome to HERO!\n\nClick to verify:\n${verifyUrl}\n\nExpires in 24 hours.` },
                    },
                },
            },
        })
    );

    return Response.json({ ok: true });
}