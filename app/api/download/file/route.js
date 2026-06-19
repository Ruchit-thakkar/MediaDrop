import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const filename = searchParams.get('filename');
    
    if (!token || !filename) {
      return new Response('Missing token or filename', { status: 400 });
    }
    
    const filepath = path.join(process.cwd(), 'temp', token, filename);
    const tempSubdir = path.join(process.cwd(), 'temp', token);
    
    if (!fs.existsSync(filepath)) {
      return new Response('File not found', { status: 404 });
    }
    
    // Create Node read stream
    const fileStream = fs.createReadStream(filepath);
    
    // Wrap in standard Web ReadableStream to support automatic cleanup on finish/cancel
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        
        fileStream.on('end', () => {
          controller.close();
          // Cleanup temporary folder
          try {
            if (fs.existsSync(tempSubdir)) {
              fs.rmSync(tempSubdir, { recursive: true, force: true });
              console.log(`[MediaDrop Next Server] Cleaned up temporary directory: ${tempSubdir}`);
            }
          } catch (cleanupErr) {
            console.error('[MediaDrop Next Server] Error during cleanup:', cleanupErr);
          }
        });
        
        fileStream.on('error', (err) => {
          console.error('[MediaDrop Next Server] Stream read error:', err);
          controller.error(err);
          try {
            if (fs.existsSync(tempSubdir)) {
              fs.rmSync(tempSubdir, { recursive: true, force: true });
            }
          } catch (_) {}
        });
      },
      cancel() {
        console.log('[MediaDrop Next Server] Stream download cancelled by user');
        fileStream.destroy();
        try {
          if (fs.existsSync(tempSubdir)) {
            fs.rmSync(tempSubdir, { recursive: true, force: true });
          }
        } catch (_) {}
      }
    });
    
    // Return file stream with correct headers for download attachment
    return new Response(webStream, {
      headers: {
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error('[MediaDrop Next Server] File stream route error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
