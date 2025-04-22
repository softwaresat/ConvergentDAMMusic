#!/usr/bin/env node

/**
 * This script is used to reset the project to a blank state.
 * It deletes or moves the /app, /components, /hooks, /scripts, and /constants directories to /app-example based on user input and creates a new /app directory with an index.tsx and _layout.tsx file.
 * You can remove the `reset-project` script from package.json and safely delete this file after running it.
 */

const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Project directories to clean
const dirsToDelete = ["app", ".expo"];

// Example directories to copy
const exampleDirs = [
  { src: "examples/minimal-app", dest: "app" },
  { src: "examples/vanilla-app", dest: "app" },
];

async function resetProject() {
  try {
    console.log("\nThis script will reset your project by:");
    console.log("1. Removing your app directory and any Expo cache");
    console.log("2. Creating a new app directory with example files");
    console.log("3. Cleaning up any previous builds\n");

    const answer = await askQuestion(
      "Are you sure you want to proceed? This action cannot be undone! (Y/n) "
    );

    if (answer.toLowerCase() !== "y" && answer !== "") {
      console.log("Reset cancelled. Your project remains unchanged.");
      process.exit(0);
    }

    // Stop any running Metro bundlers
    try {
      execSync("npx kill-port 8081");
      console.log("Metro bundler stopped.");
    } catch (err) {
      // It's okay if this fails - might not be running
    }

    // Clean up example selection logic
    const selectedExample = await selectExample();
    const exampleDir = exampleDirs.find((dir) => dir.src === selectedExample).src;

    // Delete directories first
    for (const dir of dirsToDelete) {
      try {
        await fs.rm(path.join(__dirname, "..", dir), { recursive: true, force: true });
        console.log(`/${dir} deleted.`);
      } catch (error) {
        // Ignore errors if directory doesn't exist
      }
    }

    // Create the app directory
    await fs.mkdir(path.join(__dirname, "..", "app"));
    console.log(`/${exampleDir} directory created.`);

    // Copy example files to app directory
    const srcDir = path.join(__dirname, "..", exampleDir);
    const destDir = path.join(__dirname, "..", "app");
    await copyDirectory(srcDir, destDir);

    console.log("\nNew /app directory created.");

    // Optional: Clean node_modules and reinstall dependencies
    if (await askQuestion("Would you like to clean node_modules and reinstall? (y/N) ") === "y") {
      console.log("Cleaning node_modules...");
      await fs.rm(path.join(__dirname, "..", "node_modules"), { recursive: true, force: true });
      console.log("Installing dependencies...");
      execSync("npm install", { stdio: "inherit" });
    }

    console.log("\nProject reset complete. Next steps:");
    console.log("1. Run 'npm start' to start your project");
    console.log("2. Begin customizing your app files");
    console.log("3. Consider version controlling your changes\n");
  } catch (error) {
    console.error(`Error during script execution: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      if (question.includes("Y/n") && answer === "") {
        resolve("y");
      } else if (question.includes("y/N") && answer === "") {
        resolve("n");
      } else if (["y", "yes", "n", "no"].includes(answer.toLowerCase())) {
        resolve(answer.toLowerCase()[0]);
      } else {
        console.log("Invalid input. Please enter 'Y' or 'N'.");
        resolve(askQuestion(question));
      }
    });
  });
}

async function selectExample() {
  console.log("\nAvailable examples:");
  exampleDirs.forEach((dir, index) => {
    console.log(`${index + 1}. ${dir.src}`);
  });

  const answer = await askQuestion("\nSelect an example (1): ");
  const selection = parseInt(answer) || 1;

  if (selection < 1 || selection > exampleDirs.length) {
    return exampleDirs[0].src;
  }
  return exampleDirs[selection - 1].src;
}

async function copyDirectory(src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// Run the reset script
resetProject();
