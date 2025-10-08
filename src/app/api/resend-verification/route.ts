import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({ region: process.env.REGION || process.env.AWS_REGION || 'us-east-1' });

export async function POST(req: Request) {
    const { email } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) return Response.json({ ok: true });

    const vt = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await prisma.verificationToken.upsert({
        where: { identifier: email },
        update: { token: vt, expires },
        create: { identifier: email, token: vt, expires },
    });

    const verifyUrl = `${process.env.APP_URL}/api/verify-email?token=${vt}&email=${encodeURIComponent(email)}`;

    await ses.send(
        new SendEmailCommand({
            FromEmailAddress: process.env.EMAIL_FROM!,
            Destination: { ToAddresses: [email] },
            Content: {
                Simple: {
                    Subject: { Data: "Verify your HERO account" },
                    Body: { Text: { Data: `Click to verify your HERO account:\n${verifyUrl}` } },
                },
            },
        })
    );

    return Response.json({ ok: true });
}