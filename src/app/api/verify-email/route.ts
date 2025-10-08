import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    if (!token || !email) return new Response("Invalid link", { status: 400 });

    const vt = await prisma.verificationToken.findUnique({ where: { token } });
    if (!vt || vt.identifier !== email) return new Response("Invalid or used token", { status: 400 });
    if (vt.expires < new Date()) return new Response("Token expired", { status: 400 });

    await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
    await prisma.verificationToken.delete({ where: { token } });

    return Response.redirect(`${process.env.APP_URL}/?verified=1`, 302);
}