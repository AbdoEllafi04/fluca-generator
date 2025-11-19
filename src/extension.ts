import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  console.log("FluCa Generator is now active!");

  let disposable = vscode.commands.registerCommand(
    "fluca-generator.createFeature",
    async () => {
      const input = await vscode.window.showInputBox({
        prompt:
          'Enter Feature Names separated by space (e.g. "auth home settings")',
        placeHolder: "auth home profile",
      });

      if (!input || input.trim() === "") {
        return;
      }

      const featureNames = input
        .split(" ")
        .filter((name) => name.trim() !== "");

      let defaultUri: vscode.Uri | undefined;
      if (vscode.workspace.workspaceFolders) {
        const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const featuresPath = path.join(rootPath, "lib", "features");
        if (fs.existsSync(featuresPath)) {
          defaultUri = vscode.Uri.file(featuresPath);
        } else {
          defaultUri = vscode.Uri.file(path.join(rootPath, "lib"));
        }
      }

      const folderResult = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        defaultUri: defaultUri,
        openLabel: "Select Features Location",
      });

      if (!folderResult || folderResult.length === 0) {
        return;
      }

      const targetDirectory = folderResult[0].fsPath;
      let createdCount = 0;

      featureNames.forEach((rawName) => {
        const featureName = rawName.toLowerCase().trim();
        const featurePath = path.join(targetDirectory, featureName);

        if (fs.existsSync(featurePath)) {
          vscode.window.showWarningMessage(
            `⚠️ Feature "${featureName}" already exists. Skipped.`
          );
          return;
        }

        const folders = [
          featurePath,
          path.join(featurePath, "data", "datasources"),
          path.join(featurePath, "data", "models"),
          path.join(featurePath, "data", "repositories"),
          path.join(featurePath, "domain", "entities"),
          path.join(featurePath, "domain", "repositories"),
          path.join(featurePath, "domain", "usecases"),
          path.join(featurePath, "presentation", "state_management"),
          path.join(featurePath, "presentation", "pages"),
          path.join(featurePath, "presentation", "widgets"),
        ];

        try {
          folders.forEach((folder) => {
            fs.mkdirSync(folder, { recursive: true });
          });
          createdCount++;
        } catch (err) {
          vscode.window.showErrorMessage(`Error creating "${featureName}"`);
          console.error(err);
        }
      });

      if (createdCount > 0) {
        vscode.window.showInformationMessage(
          `🚀 Successfully created ${createdCount} feature(s)!`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
