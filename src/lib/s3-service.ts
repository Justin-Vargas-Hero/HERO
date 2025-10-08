// src/lib/s3-service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

// Initialize S3 client
const s3Client = process.env.USE_S3 === "true" ? new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
}) : null;

// Configuration for different content types
export const UPLOAD_CONFIG = {
    profilePicture: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
        s3Path: "profile/avatars",
        localPath: "profile-pictures"
    },
    postImage: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        s3Path: "posts/images",
        localPath: "post-images"
    },
    chart: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ["image/jpeg", "image/png", "image/svg+xml"],
        s3Path: "posts/charts",
        localPath: "charts"
    }
};

/**
 * Extract base64 data and validate image
 */
function parseBase64Image(base64String: string) {
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
        throw new Error("Invalid base64 image format");
    }
    return {
        mimeType: matches[1],
        base64Data: matches[2],
        buffer: Buffer.from(matches[2], "base64")
    };
}

/**
 * Get file extension from mime type
 */
function getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/svg+xml": "svg"
    };
    return mimeToExt[mimeType] || "jpg";
}

/**
 * Upload to S3
 */
async function uploadToS3(
    key: string,
    buffer: Buffer,
    mimeType: string
): Promise<string> {
    if (!s3Client) throw new Error("S3 client not initialized");

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: "max-age=31536000, public", // 1 year cache
    });

    await s3Client.send(command);

    // Return URL based on environment configuration
    if (process.env.CLOUDFRONT_DOMAIN) {
        return `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
    }
    if (process.env.CLOUDFLARE_DOMAIN) {
        return `https://${process.env.CLOUDFLARE_DOMAIN}/${key}`;
    }
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Delete from S3
 */
async function deleteFromS3(key: string): Promise<void> {
    if (!s3Client) throw new Error("S3 client not initialized");

    try {
        // Check if object exists first
        const headCommand = new HeadObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: key
        });
        await s3Client.send(headCommand);

        // Delete if exists
        const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: key,
        });
        await s3Client.send(deleteCommand);
    } catch (error: any) {
        if (error.name !== "NotFound") {
            throw error;
        }
    }
}

/**
 * Upload to local filesystem (for development)
 */
async function uploadToLocal(
    subPath: string,
    filename: string,
    buffer: Buffer
): Promise<string> {
    const uploadDir = path.join(process.cwd(), "public", "uploads", subPath);
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, buffer);
    
    return `/uploads/${subPath}/${filename}`;
}

/**
 * Delete from local filesystem
 */
async function deleteFromLocal(subPath: string, filename: string): Promise<void> {
    try {
        const filepath = path.join(process.cwd(), "public", "uploads", subPath, filename);
        await fs.unlink(filepath);
    } catch (error) {
        // Ignore if file doesn't exist
    }
}

/**
 * Main upload function - handles both S3 and local uploads
 */
export async function uploadFile(
    type: keyof typeof UPLOAD_CONFIG,
    entityId: string,
    base64Image: string,
    customFilename?: string
): Promise<string> {
    const config = UPLOAD_CONFIG[type];
    
    // Parse and validate image
    const { mimeType, buffer } = parseBase64Image(base64Image);
    
    // Validate mime type
    if (!config.allowedTypes.includes(mimeType)) {
        throw new Error(`File type ${mimeType} not allowed. Allowed types: ${config.allowedTypes.join(", ")}`);
    }
    
    // Validate size
    if (buffer.length > config.maxSize) {
        throw new Error(`File size exceeds maximum of ${config.maxSize / (1024 * 1024)}MB`);
    }
    
    // Generate filename
    const ext = getExtensionFromMimeType(mimeType);
    const filename = customFilename || `${entityId}-${Date.now()}.${ext}`;
    
    // Upload based on environment
    if (process.env.USE_S3 === "true") {
        const key = `${config.s3Path}/${entityId}/${filename}`;
        return await uploadToS3(key, buffer, mimeType);
    } else {
        return await uploadToLocal(config.localPath, filename, buffer);
    }
}

/**
 * Main delete function - handles both S3 and local deletions
 */
export async function deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;
    
    if (process.env.USE_S3 === "true") {
        // Extract S3 key from URL
        let key = "";
        if (fileUrl.includes("amazonaws.com/")) {
            key = fileUrl.split("amazonaws.com/")[1];
        } else if (fileUrl.includes(process.env.CLOUDFRONT_DOMAIN!)) {
            key = fileUrl.replace(`https://${process.env.CLOUDFRONT_DOMAIN}/`, "");
        } else if (fileUrl.includes(process.env.CLOUDFLARE_DOMAIN!)) {
            key = fileUrl.replace(`https://${process.env.CLOUDFLARE_DOMAIN}/`, "");
        }
        
        if (key) {
            await deleteFromS3(key);
        }
    } else {
        // Extract local path from URL
        const matches = fileUrl.match(/\/uploads\/(.+)\/(.+)$/);
        if (matches) {
            await deleteFromLocal(matches[1], matches[2]);
        }
    }
}

/**
 * Specialized function for profile pictures
 */
export async function uploadProfilePicture(userId: string, base64Image: string): Promise<string> {
    // Use just the userId as filename (overwrites previous)
    const { mimeType, buffer } = parseBase64Image(base64Image);
    const ext = getExtensionFromMimeType(mimeType);
    const filename = `avatar.${ext}`;
    
    return uploadFile("profilePicture", userId, base64Image, filename);
}

/**
 * Delete all profile pictures for a user (different extensions)
 */
export async function deleteProfilePicture(userId: string): Promise<void> {
    const extensions = ["jpg", "jpeg", "png", "webp", "gif"];
    
    for (const ext of extensions) {
        if (process.env.USE_S3 === "true") {
            const key = `${UPLOAD_CONFIG.profilePicture.s3Path}/${userId}/avatar.${ext}`;
            try {
                await deleteFromS3(key);
            } catch (error) {
                // Continue trying other extensions
            }
        } else {
            try {
                await deleteFromLocal(UPLOAD_CONFIG.profilePicture.localPath, `avatar.${ext}`);
            } catch (error) {
                // Continue trying other extensions
            }
        }
    }
}