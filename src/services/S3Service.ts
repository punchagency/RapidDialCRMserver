import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

/**
 * S3 Service Class
 * Handles all AWS S3 file upload operation
 */
export class S3Service {
  private s3Client: S3Client | null = null;
  private bucketName: string | undefined;
  private region: string | undefined;
  private accessKeyId: string | undefined;
  private secretAccessKey: string | undefined;

  constructor() {
    this.bucketName = process.env.S3_DESTINATION_BUCKET;
    this.region = process.env.S3_BUCKET_REGION || "us-east-1";
    this.accessKeyId = process.env.S3_ACCESS_KEY;
    this.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    const missingCredentials: string[] = [];
    if (!this.bucketName) missingCredentials.push("S3_DESTINATION_BUCKET");
    if (!this.accessKeyId) missingCredentials.push("S3_ACCESS_KEY");
    if (!this.secretAccessKey) missingCredentials.push("S3_SECRET_ACCESS_KEY");

    if (missingCredentials.length > 0) {
      console.warn(
        `S3 credentials not fully configured. Missing: ${missingCredentials.join(
          ", "
        )}`
      );
    } else {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId!,
          secretAccessKey: this.secretAccessKey!,
        },
      });
    }
  }

  /**
   * Check if S3 is configured
   */
  isConfigured(): boolean {
    return !!(
      this.bucketName &&
      this.accessKeyId &&
      this.secretAccessKey &&
      this.s3Client
    );
  }

  /**
   * Upload file to S3
   * @param localFilePath - Path to local file
   * @param key - S3 object key (filename in bucket)
   * @param folder - Optional folder path in bucket
   * @returns S3 URL of uploaded file
   */
  async uploadFile(
    localFilePath: string,
    key: string,
    folder?: string
  ): Promise<string> {
    if (!this.s3Client || !this.bucketName) {
      throw new Error("S3 client not initialized. Check your AWS credentials.");
    }

    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File not found: ${localFilePath}`);
    }

    try {
      const fileContent = fs.readFileSync(localFilePath);
      const s3Key = folder ? `${folder}/${key}` : key;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileContent,
        ContentType: this.getContentType(localFilePath),
      });

      await this.s3Client.send(command);

      // Return the S3 URLs
      const s3Url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
      console.log(`File uploaded to S3: ${s3Url}`);
      return s3Url;
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw error;
    }
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".mp4": "video/mp4",
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    };
    return contentTypes[ext] || "application/octet-stream";
  }

  /**
   * Get bucket name
   */
  getBucketName(): string | undefined {
    return this.bucketName;
  }

  /**
   * Get region
   */
  getRegion(): string | undefined {
    return this.region;
  }
}

// Singleton instance
let s3ServiceInstance: S3Service | null = null;

/**
 * Get singleton instance of S3Service
 */
export function getS3Service(): S3Service {
  if (!s3ServiceInstance) {
    s3ServiceInstance = new S3Service();
  }
  return s3ServiceInstance;
}
