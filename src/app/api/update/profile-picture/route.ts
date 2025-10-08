// src/app/api/update/profile-picture/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const prisma = new PrismaClient();

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function POST(req: NextRequest) {
    try {
        // Get the current session
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the profile picture from request
        const { profilePicture } = await req.json();
        
        if (!profilePicture) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Convert base64 to buffer
        const base64Data = profilePicture.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Determine file extension
        const mimeMatch = profilePicture.match(/^data:image\/(\w+);base64,/);
        const fileExtension = mimeMatch ? mimeMatch[1] : "jpg";

        // Create S3 key
        const key = `profile/avatars/${session.user.id}/avatar.${fileExtension}`;

        // Upload to S3
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: key,
            Body: buffer,
            ContentType: `image/${fileExtension}`,
        });

        await s3Client.send(uploadCommand);

        // Construct the S3 URL
        const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

        // Update user in database
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { profilePicture: s3Url },
        });

        return NextResponse.json({
            success: true,
            profilePictureUrl: updatedUser.profilePicture,
        });
    } catch (error) {
        console.error("Profile picture upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload profile picture" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // Get the current session
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current user to find their profile picture
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { profilePicture: true },
        });

        // If they have a profile picture, delete it from S3
        if (user?.profilePicture) {
            // Extract key from S3 URL
            const urlParts = user.profilePicture.split(".amazonaws.com/");
            if (urlParts.length > 1) {
                const key = urlParts[1];
                
                try {
                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: process.env.S3_BUCKET_NAME!,
                        Key: key,
                    });
                    await s3Client.send(deleteCommand);
                } catch (s3Error) {
                    console.error("S3 deletion error:", s3Error);
                    // Continue even if S3 deletion fails
                }
            }
        }

        // Clear profile picture in database
        await prisma.user.update({
            where: { id: session.user.id },
            data: { profilePicture: null },
        });

        return NextResponse.json({
            success: true,
            message: "Profile picture removed",
        });
    } catch (error) {
        console.error("Profile picture removal error:", error);
        return NextResponse.json(
            { error: "Failed to remove profile picture" },
            { status: 500 }
        );
    }
}
