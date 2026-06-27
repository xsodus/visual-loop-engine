import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type Point = {
  x: number;
  y: number;
};

export type MacAppControllerOptions = {
  commandTimeoutMs?: number;
};

export class MacAppController {
  readonly commandTimeoutMs: number;

  constructor(options: MacAppControllerOptions = {}) {
    this.commandTimeoutMs = options.commandTimeoutMs ?? 15_000;
  }

  async launchViaSpotlight(query = "Tree of Savior M Extreme"): Promise<void> {
    await this.runAppleScript([
      'tell application "System Events"',
      "key code 49 using {command down}",
      "delay 0.5",
      `keystroke ${appleScriptString(query)}`,
      "delay 1",
      "key code 36",
      "end tell",
    ]);
  }

  async click(point: Point): Promise<void> {
    assertCoordinate(point.x, "x");
    assertCoordinate(point.y, "y");
    await this.runAppleScript([
      'tell application "System Events"',
      `click at {${point.x}, ${point.y}}`,
      "end tell",
    ]);
  }

  async pressKey(keyCode: number, modifiers: string[] = []): Promise<void> {
    assertCoordinate(keyCode, "keyCode");
    const using =
      modifiers.length > 0 ? ` using {${modifiers.map((item) => `${item} down`).join(", ")}}` : "";
    await this.runAppleScript([
      'tell application "System Events"',
      `key code ${keyCode}${using}`,
      "end tell",
    ]);
  }

  async screenshot(outputPath: string): Promise<string> {
    await mkdir(dirname(outputPath), { recursive: true });
    await this.run("/usr/sbin/screencapture", ["-x", outputPath]);
    return outputPath;
  }

  private async runAppleScript(lines: string[]): Promise<void> {
    const args = lines.flatMap((line) => ["-e", line]);
    await this.run("/usr/bin/osascript", args);
  }

  private async run(command: string, args: string[]): Promise<void> {
    try {
      await execFileAsync(command, args, { timeout: this.commandTimeoutMs });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `macOS automation command failed. Check Accessibility and Screen Recording permissions. ${detail}`,
        { cause: error },
      );
    }
  }
}

function appleScriptString(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function assertCoordinate(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative integer`);
  }
}
