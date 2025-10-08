// src/app/api/user/profile-picture/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { uploadProfilePicture, deleteProfilePicture } from "@/lib/s3-service";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { profilePicture } = await request.json();

        if (!profilePicture) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Get user from database
        const user = await prisma.user.findFirst({
            where: { 
                email: {
                    equals: session.user.email,
                    mode: 'insensitive'
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Delete old image if exists
        if (user.profilePicture) {
            try {
                await deleteProfilePicture(user.id);
            } catch (error) {
                console.error("Failed to delete old profile picture:", error);
            }
        }

        // Upload new image
        const imageUrl = await uploadProfilePicture(user.id, profilePicture);

        // Update user's profile picture URL in database
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { profilePicture: imageUrl },
            select: { 
                id: true, 
                profilePicture: true 
            }
        });

        return NextResponse.json({ 
            message: "Profile picture updated successfully",
            profilePicture: updatedUser.profilePicture 
        });
    } catch (error: any) {
        console.error("Profile picture update error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update profile picture" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findFirst({
            where: { 
                email: {
                    equals: session.user.email,
                    mode: 'insensitive'
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Delete image from storage
        if (user.profilePicture) {
            try {
                await deleteProfilePicture(user.id);
            } catch (error) {
                console.error("Failed to delete profile picture:", error);
            }
        }

        // Remove profile picture URL from database
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { profilePicture: null },
            select: { 
                id: true, 
                profilePicture: true 
            }
        });

        return NextResponse.json({ 
            message: "Profile picture removed successfully",
            profilePicture: updatedUser.profilePicture 
        });
    } catch (error: any) {
        console.error("Profile picture removal error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to remove profile picture" },
            { status: 500 }
        );
    }
}