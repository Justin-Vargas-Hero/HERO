import { type NextAuthOptions, SessionStrategy } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import { checkEnvVars } from "@/lib/env-check";
import "@/lib/env-loader"; // Force load environment variables

// Check environment variables on load
if (typeof window === 'undefined') {
    checkEnvVars();
}

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Use case-insensitive email search
                const user = await prisma.user.findFirst({
                    where: { 
                        email: {
                            equals: credentials.email,
                            mode: 'insensitive'
                        }
                    },
                });

                if (!user) return null;

                // Check if email is verified
                if (!user.emailVerified) {
                    throw new Error("Please verify your email before logging in");
                }

                const valid = await compare(credentials.password, user.password);
                if (!valid) return null;

                return {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    username: user.username,
                    profilePicture: user.profilePicture,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.profilePicture = user.profilePicture;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.profilePicture = token.profilePicture as string;
            }
            return session;
        },
    },
    // 👇 Prevent redirecting to /api/auth/error
    pages: {
        signIn: "/", // keep user on main page
        error: "/",  // prevents /api/auth/error redirect
    },
    session: {
        strategy: "jwt" as SessionStrategy,
    },
    secret: process.env.NEXTAUTH_SECRET,
};
