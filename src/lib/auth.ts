import { type NextAuthOptions, SessionStrategy } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

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
                    timezone: user.timezone || 'UTC',
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Handle manual session updates
            if (trigger === "update" && session) {
                // Update token with new session data
                return { ...token, ...session.user };
            }

            // On initial sign in
            if (user) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                        firstName: true,
                        lastName: true,
                        timezone: true,
                    }
                });

                if (dbUser) {
                    token.id = dbUser.id;
                    token.username = dbUser.username;
                    token.profilePicture = dbUser.profilePicture;
                    token.name = `${dbUser.firstName} ${dbUser.lastName}`;
                    token.timezone = dbUser.timezone || 'UTC';
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user && token) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.profilePicture = token.profilePicture as string;
                session.user.name = token.name as string;
                session.user.timezone = token.timezone as string || 'UTC';
            }
            return session;
        }
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
