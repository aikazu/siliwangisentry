
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn, type ChildProcess } from 'child_process';
import AdmZip from 'adm-zip';
import { logInfo, logError } from '@/lib/logger';

const TOOLS_DIR = path.join(process.cwd(), 'tools');

const toolConfig = {
    subfinder: {
        repo: 'projectdiscovery/subfinder',
        assetKeyword: 'subfinder',
    },
    httpx: {
        repo: 'projectdiscovery/httpx',
        assetKeyword: 'httpx',
    },
    nuclei: {
        repo: 'projectdiscovery/nuclei',
        assetKeyword: 'nuclei',
    },
};

type ToolName = keyof typeof toolConfig;
const TOOL_NAMES = Object.keys(toolConfig) as ToolName[];

export function runCommand(command: string, args: string[], stdinData?: string) {
  logInfo(`[Command Runner] Spawning: ${command} ${args.join(' ')}`);
  
  let promise: Promise<string>;
  const child = spawn(command, args, { 
    shell: os.platform() === 'win32',
    stdio: 'pipe'
  });

  promise = new Promise<string>((resolve, reject) => {
    let stdoutData = '';
    let stderrData = '';
    let killedIntentionally = false;
    
    child.on('exit', (code, signal) => {
        if (signal === 'SIGTERM') {
           logInfo(`[Command Runner] Received SIGTERM, marking process for ${command} as intentionally killed.`);
           killedIntentionally = true;
        }
    });
    
    child.stdout.on('data', (data) => {
        stdoutData += data.toString();
    });
    
    child.stderr.on('data', (data) => {
        stderrData += data.toString();
        // Log stderr in real-time for debugging purposes
        logInfo(`[${path.basename(command)} STDERR]: ${data.toString().trim()}`);
    });

    child.on('close', (code) => {
      if (killedIntentionally) {
        const message = `Command was intentionally killed: ${command}`
        logInfo(`[Command Runner] ${message}`);
        resolve(stdoutData);
        return;
      }
      if (code !== 0) {
        const errorMsg = `Command failed with code ${code}: ${command} ${args.join(' ')}\nStderr: ${stderrData}`;
        logError(errorMsg);
        reject(new Error(errorMsg));
      } else {
        logInfo(`[Command Runner] Command finished successfully: ${command}`);
        resolve(stdoutData);
      }
    });

    child.on('error', (err) => {
      const errorMsg = `Failed to start command: ${command}`;
      logError(errorMsg, err);
      reject(err);
    });

    if (stdinData) {
        try {
            child.stdin.write(stdinData);
            child.stdin.end();
        } catch(e) {
            logError(`[Command Runner] Failed to write to stdin for ${command}`, e);
        }
    }
  });

  return { promise, child };
}

function getPlatformIdentifier() {
    const platform = os.platform();
    const arch = os.arch();

    let osName: string;
    switch (platform) {
        case 'linux':
            osName = 'linux';
            break;
        case 'darwin':
            osName = 'macOS';
            break;
        case 'win32':
            osName = 'windows';
            break;
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }

    let archName: string;
    switch (arch) {
        case 'x64':
            archName = 'amd64';
            break;
        case 'arm64':
            archName = 'arm64';
            break;
        default:
            throw new Error(`Unsupported architecture: ${arch}`);
    }
    
    return `${osName}_${archName}`;
}

async function getLatestReleaseAssetUrl(repo: string, assetKeyword: string): Promise<string> {
    const platformIdentifier = getPlatformIdentifier();
    const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
    
    logInfo(`[ToolManager] Fetching latest release from ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
        if (rateLimitRemaining === '0') {
             const errorMessage = `GitHub API rate limit exceeded. Please try again later or set a GITHUB_TOKEN environment variable.`;
             logError(errorMessage);
             throw new Error(errorMessage);
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch latest release for ${repo}: ${response.statusText}. Response: ${errorText}`);
    }
    
    const release = await response.json();
    const asset = release.assets.find((a: any) => 
        a.name.includes(assetKeyword) && a.name.includes(platformIdentifier) && a.name.endsWith('.zip')
    );

    if (!asset) {
        throw new Error(`Could not find a suitable asset for ${assetKeyword} on ${platformIdentifier} in repo ${repo}`);
    }

    logInfo(`[ToolManager] Found asset: ${asset.browser_download_url}`);
    return asset.browser_download_url;
}

export function getToolPath(toolName: ToolName | 'nuclei-templates'): string {
    if (toolName === 'nuclei-templates') {
        return path.join(TOOLS_DIR, 'nuclei-templates');
    }
    const isWindows = os.platform() === 'win32';
    const exe = isWindows ? '.exe' : '';
    return path.join(TOOLS_DIR, `${toolName}${exe}`);
}

async function downloadAndUnzip(url: string, dest: string, isRepo: boolean = false) {
    const zipPath = path.join(os.tmpdir(), `${path.basename(dest)}-${Date.now()}.zip`);
    
    logInfo(`[ToolManager] Downloading ${url} to ${zipPath}`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download file from ${url}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(zipPath, buffer);
    
    logInfo(`[ToolManager] Unzipping ${zipPath} to ${dest}`);
    const zip = new AdmZip(zipPath);
    
    if (isRepo) {
        const tempExtractDir = path.join(path.dirname(dest), `temp-templates-${Date.now()}`);
        fs.mkdirSync(tempExtractDir, { recursive: true });
        zip.extractAllTo(tempExtractDir, true);

        // Find the directory inside the temp extraction folder (e.g., 'nuclei-templates-main')
        const extractedFolders = fs.readdirSync(tempExtractDir, { withFileTypes: true });
        const repoFolder = extractedFolders.find(f => f.isDirectory());
        
        if (!repoFolder) {
            fs.rmSync(tempExtractDir, { recursive: true, force: true });
            throw new Error('Could not find the main folder in the nuclei-templates zip.');
        }
        
        const sourcePath = path.join(tempExtractDir, repoFolder.name);
        
        if (fs.existsSync(dest)) {
            fs.rmSync(dest, { recursive: true, force: true });
        }
        fs.renameSync(sourcePath, dest);
        
        fs.rmSync(tempExtractDir, { recursive: true, force: true });

    } else {
        zip.extractAllTo(dest, true);
    }
    
    fs.unlinkSync(zipPath); // Clean up zip file
}


async function ensureTool(toolName: ToolName) {
    const toolPath = getToolPath(toolName);

    if (fs.existsSync(toolPath)) {
        logInfo(`[ToolManager] Tool '${toolName}' already exists at ${toolPath}`);
        return;
    }

    logInfo(`[ToolManager] Tool '${toolName}' not found. Starting download...`);
    
    if (!fs.existsSync(TOOLS_DIR)) {
        fs.mkdirSync(TOOLS_DIR, { recursive: true });
    }

    const config = toolConfig[toolName];
    try {
        const assetUrl = await getLatestReleaseAssetUrl(config.repo, config.assetKeyword);
        await downloadAndUnzip(assetUrl, TOOLS_DIR);
        
        const expectedPath = getToolPath(toolName);

        if (!fs.existsSync(expectedPath)) {
           const files = fs.readdirSync(TOOLS_DIR);
           const foundFile = files.find(f => 
                f.toLowerCase().startsWith(toolName) && 
                !f.endsWith('.zip') &&
                !fs.statSync(path.join(TOOLS_DIR, f)).isDirectory()
           );

           if (foundFile) {
               logInfo(`[ToolManager] Renaming ${foundFile} to ${path.basename(expectedPath)}`);
               fs.renameSync(path.join(TOOLS_DIR, foundFile), expectedPath);
           } else {
               throw new Error(`Tool binary for ${toolName} not found in the unzipped files.`);
           }
        }

        if (os.platform() !== 'win32') {
            logInfo(`[ToolManager] Making ${toolName} executable...`);
            fs.chmodSync(expectedPath, '755');
        }

        logInfo(`[ToolManager] Tool '${toolName}' is ready.`);

    } catch (error) {
        logError(`[ToolManager] Failed to ensure tool '${toolName}'`, error);
        throw error; // Re-throw the error to be caught by the caller
    }
}

async function ensureNucleiTemplates() {
    const templatesPath = getToolPath('nuclei-templates');
    if (fs.existsSync(templatesPath)) {
        logInfo(`[ToolManager] Nuclei templates already exist at ${templatesPath}`);
        // Optionally, add logic here to check if they are outdated and need updating.
        return;
    }

    logInfo(`[ToolManager] Nuclei templates not found. Starting download...`);
    const repoUrl = 'https://github.com/projectdiscovery/nuclei-templates/archive/refs/heads/main.zip';
    
    try {
        await downloadAndUnzip(repoUrl, templatesPath, true);
        logInfo(`[ToolManager] Nuclei templates are ready at ${templatesPath}`);
    } catch (error) {
        logError(`[ToolManager] Failed to download or extract nuclei templates`, error);
        throw error;
    }
}


export async function ensureTools() {
    for (const tool of TOOL_NAMES) {
        await ensureTool(tool);
    }
    await ensureNucleiTemplates();
}

export async function verifyTools(): Promise<Record<string, string>> {
  const status: Record<string, string> = {};
  const isWindows = os.platform() === 'win32';

  for (const tool of TOOL_NAMES) {
    const toolPath = getToolPath(tool);
    if (!fs.existsSync(toolPath)) {
      status[tool] = 'Missing';
      continue;
    }

    try {
      if (!isWindows) {
        fs.accessSync(toolPath, fs.constants.X_OK);
      }
      
      let stderr = '';
      await new Promise<void>((resolve, reject) => {
        const child = spawn(toolPath, ['-version']);
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
          if (code === 0) {
            status[tool] = 'OK';
            resolve();
          } else {
            status[tool] = `Execution failed (code ${code}): ${stderr}`;
            reject(new Error(status[tool]));
          }
        });
        child.on('error', (err) => {
          status[tool] = `Spawn error: ${err.message}`;
          reject(err);
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('EACCES')) {
        status[tool] = 'Not executable';
      } else if (error instanceof Error) {
        status[tool] = error.message; 
      } else {
        status[tool] = 'Verification failed';
      }
    }
  }

  const templatesPath = getToolPath('nuclei-templates');
  if (!fs.existsSync(templatesPath)) {
    status['nuclei-templates'] = 'Missing';
  } else {
    status['nuclei-templates'] = 'OK';
  }

  return status;
}
