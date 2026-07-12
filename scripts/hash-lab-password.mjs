import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { hashLabPassword } from "../netlify/functions/_shared/lab-security.mjs";

function hiddenQuestion(prompt) {
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    const terminal = createInterface({ input, output });
    return terminal.question(prompt).finally(() => terminal.close());
  }

  output.write(prompt);
  input.setRawMode(true);
  input.resume();

  return new Promise((resolve, reject) => {
    let value = "";
    const finish = () => {
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
      output.write("\n");
    };
    const onData = (buffer) => {
      for (const character of buffer.toString("utf8")) {
        if (character === "\u0003") {
          finish();
          reject(new Error("Password generation cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
        } else if (character >= " ") {
          value += character;
        }
      }
    };
    input.on("data", onData);
  });
}

try {
  const password = await hiddenQuestion("Lab password (minimum 10 characters): ");
  const confirmation = await hiddenQuestion("Confirm password: ");
  if (password !== confirmation) throw new Error("The passwords do not match.");

  const hash = await hashLabPassword(password);
  output.write("\nSet this value as LAB_PASSWORD_HASH in Netlify:\n\n");
  output.write(`${hash}\n`);
  output.write("\nAlso create a random LAB_SESSION_SECRET containing at least 32 characters.\n");
} catch (error) {
  output.write(`\n${error.message}\n`);
  process.exitCode = 1;
}
