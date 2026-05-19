import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { Buffer } from 'node:buffer';
import { EvidenceType } from '@prisma/client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('1. [Upload] API Hit: Parsing FormData...');
    const formData = await req.formData();

    // 1. Data Extraction & Type Casting
    const type = formData.get('type') as EvidenceType;
    const uploadedById = formData.get('uploadedById') as string | null;
    const manifestId = formData.get('manifestId') as string | null;
    const returnItemId = formData.get('returnItemId') as string | null;
    const reason = formData.get('reason') as string || 'General Evidence';

    const files: { key: string, file: File }[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push({ key, file: value });
      }
    }

    if (files.length === 0) {
      console.error('Error: No files provided in FormData');
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    console.log(`[Upload] Found ${files.length} files. Evidence Type Context: ${type || 'Not Provided'}`);

    console.log('2. [Upload] Resolving common Meta Data...');

    let validUserId = uploadedById;
    if (!validUserId) {
      console.log('  -> No uploadedById provided. Fetching fallback user...');
      const fallbackUser = await prisma.user.findFirst();
      if (fallbackUser) {
        validUserId = fallbackUser.id;
      } else {
        throw new Error("No users in DB to link evidence to.");
      }
    } else {
      const userExists = await prisma.user.findUnique({ where: { id: validUserId } });
      if (!userExists) {
        console.log('  -> Invalid uploadedById. Fetching fallback user...');
        const fallbackUser = await prisma.user.findFirst();
        if (fallbackUser) {
          validUserId = fallbackUser.id;
        } else {
          throw new Error("No users in DB to link evidence to.");
        }
      }
    }

    let validManifestId: string | null = null;
    let validReturnItemId: string | null = null;
    let rawRefParts: string[] = [];

    if (manifestId) {
      const manifestExists = await prisma.manifest.findUnique({ where: { id: manifestId } });
      if (manifestExists) {
        validManifestId = manifestExists.id;
      } else {
        rawRefParts.push(`Manifest: ${manifestId}`);
      }
    }

    if (returnItemId) {
      const returnItemExists = await prisma.returnItem.findUnique({ where: { id: returnItemId } });
      if (returnItemExists) {
        validReturnItemId = returnItemExists.id;
      } else {
        rawRefParts.push(`ReturnItem: ${returnItemId}`);
      }
    }

    const awb = formData.get('awb') as string || formData.get('orderId') as string;
    if (awb && !validManifestId) {
        rawRefParts.push(`AWB/Order: ${awb}`);
    }

    const rawRef = rawRefParts.length > 0 ? rawRefParts.join(', ') : null;

    // 3. Dynamic Google Drive Routing
    const targetFolderId = type === 'RECEIVER_REJECTION' 
      ? process.env.GOOGLE_DRIVE_REJECTIONS_FOLDER_ID 
      : process.env.GOOGLE_DRIVE_FOLDER_ID;
      
    console.log(`4. [Upload] Target Google Drive Folder ID: ${targetFolderId}`);

    if (!targetFolderId) {
      throw new Error(`Configuration Error: Missing Folder ID.`);
    }

    // ==========================================
    // 🚨 DIAGNOSTIC BLOCK: CHECKING CREDENTIALS
    // ==========================================
    console.log("🔍 DIAGNOSTIC: Checking Auth Credentials...");
    console.log("- Client ID length:", process.env.GOOGLE_CLIENT_ID?.length || 0);
    console.log("- Secret length:", process.env.GOOGLE_CLIENT_SECRET?.length || 0);
    console.log("- Refresh Token length:", process.env.GOOGLE_REFRESH_TOKEN?.length || 0);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    try {
      await oauth2Client.getAccessToken();
      console.log("✅ DIAGNOSTIC: Google Auth is PERFECT!");
    } catch (authErr: any) {
      console.error("❌ DIAGNOSTIC AUTH CRASH:", authErr.response?.data || authErr.message);
      throw new Error("Google Auth Failed before upload even started.");
    }
    // ==========================================

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const createdEvidenceIds: string[] = [];
    const uploadedLinks: string[] = [];

    console.log(`5. [Upload] Processing and uploading ${files.length} files synchronously...`);
    for (const { key, file } of files) {
      console.log(`[Upload] Processing file from key: ${key}`);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const isVideo = key === 'file' || file.type.startsWith('video/');
      const originalExt = file.name ? path.extname(file.name) : (isVideo ? '.webm' : '.jpg');
      const tempFileName = `Upload-[${crypto.randomUUID()}]${originalExt}`;
      const tempFilePath = path.join(os.tmpdir(), tempFileName);

      await fsp.writeFile(tempFilePath, buffer);
      console.log(`  -> Buffer saved to local OS temp path: ${tempFilePath}`);

      try {
        console.log(`  -> Executing Google Drive upload for ${key}...`);
        const driveRes = await drive.files.create({
          requestBody: { name: tempFileName, parents: targetFolderId ? [targetFolderId] : undefined },
          media: { mimeType: file.type || 'application/octet-stream', body: fs.createReadStream(tempFilePath) },
          fields: 'id, webViewLink',
        });

        const fileId = driveRes.data.id || '';
        const fileLink = driveRes.data.webViewLink || '';
        console.log(`  -> GDrive Upload Success: ${fileLink}`);
        
        const evidenceType = type === 'RECEIVER_REJECTION' 
          ? 'RECEIVER_REJECTION' 
          : (isVideo ? 'INSPECTION_VIDEO' : 'PRODUCT_DAMAGE_PHOTO');
          
        const currentReason = type === 'RECEIVER_REJECTION' 
          ? reason 
          : (isVideo ? 'Continuous Inspection Video' : `Snapshot: ${key}`);

        console.log(`  -> Executing Prisma write for ${key}...`);
        const evidence = await prisma.evidence.create({
          data: {
            driveFileId: fileId,
            driveLink: fileLink,
            type: evidenceType as EvidenceType,
            reason: currentReason,
            rawReference: rawRef,
            manifestId: validManifestId,
            returnItemId: validReturnItemId,
            uploadedById: validUserId!,
          }
        });
        createdEvidenceIds.push(evidence.id);
        uploadedLinks.push(fileLink);

      } finally {
        try {
          await fsp.unlink(tempFilePath);
          console.log(`  -> Cleaned up OS temp file: ${tempFilePath}`);
        } catch (cleanupError) {
          console.error(`  -> Failed to delete temp file ${tempFilePath}:`, cleanupError);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${files.length} files uploaded successfully.`, 
      evidenceIds: createdEvidenceIds,
      links: uploadedLinks
    }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 UPLOAD CRASHED:", error);
    return NextResponse.json({ error: error.message || 'Server error processing file' }, { status: 500 });
  }
}