import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

function runPythonDownloader(args) {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(process.cwd(), 'server/downloader.py');
    
    console.log(`[MediaDrop Next Server] Running: ${pythonPath} ${scriptPath} ${args.join(' ')}`);
    const pyProcess = spawn(pythonPath, [scriptPath, ...args]);
    
    let stdout = '';
    let stderr = '';
    
    pyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`[MediaDrop Subprocess] Error (Code ${code}):`, stderr);
        return reject(new Error(stderr.trim() || `Subprocess failed with code ${code}`));
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse downloader output: ${err.message}. Output was: ${stdout}`));
      }
    });
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, formatId } = body;
    
    if (!url || !formatId) {
      return NextResponse.json({ success: false, error: 'URL and formatId are required' }, { status: 400 });
    }
    
    const token = crypto.randomUUID();
    const tempSubdir = path.join(process.cwd(), 'temp', token);
    
    // Ensure the temp directory exists
    if (!fs.existsSync(tempSubdir)) {
      fs.mkdirSync(tempSubdir, { recursive: true });
    }
    
    const result = await runPythonDownloader([
      '--action', 'download',
      '--url', url,
      '--format', formatId,
      '--output-dir', tempSubdir
    ]);
    
    if (!result.success) {
      // Clean up empty folder
      try {
        fs.rmSync(tempSubdir, { recursive: true, force: true });
      } catch (_) {}
      return NextResponse.json({ success: false, error: result.error || 'Failed to download media' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      token,
      filename: result.filename
    });
  } catch (error) {
    console.error('[MediaDrop Next Server] Prepare download error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
