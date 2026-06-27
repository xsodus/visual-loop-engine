import { resolve } from "node:path";
import { MacAppController } from "./macos-controller.ts";

const controller = new MacAppController();
const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "launch":
    await controller.launchViaSpotlight(args.join(" ") || undefined);
    console.log("Spotlight launch sequence sent.");
    break;
  case "screenshot": {
    const output = resolve(args[0] ?? "artifacts/tos-screen.png");
    await controller.screenshot(output);
    console.log(output);
    break;
  }
  case "click": {
    const x = Number(args[0]);
    const y = Number(args[1]);
    await controller.click({ x, y });
    console.log(`Clicked ${x},${y}.`);
    break;
  }
  default:
    console.log(`Usage:
  pnpm tos launch [Spotlight query]
  pnpm tos screenshot [output.png]
  pnpm tos click <x> <y>`);
    process.exitCode = command ? 1 : 0;
}
