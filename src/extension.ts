import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  console.log("FluCa Generator is now active!");

  let disposable = vscode.commands.registerCommand(
    "fluca-generator.createFeature",
    async () => {
      
      // 1. التحقق من وجود مشروع مفتوح
      if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage("Please open a Flutter project folder first.");
        return;
      }

      // 2. طلب الأسماء
      const input = await vscode.window.showInputBox({
        prompt: 'Enter Feature Names separated by space (e.g. "auth home settings")',
        placeHolder: "auth home profile",
      });

      if (!input || input.trim() === "") {
        return;
      }

      const featureNames = input.split(" ").filter((name) => name.trim() !== "");

      // تحديد مسار الروت (جذر المشروع) لاستخدامه لاحقاً
      const projectRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

      // 3. اقتراح مكان الفيتشرز
      let defaultUri: vscode.Uri | undefined;
      const featuresPath = path.join(projectRoot, "lib", "features");
      if (fs.existsSync(featuresPath)) {
        defaultUri = vscode.Uri.file(featuresPath);
      } else {
        defaultUri = vscode.Uri.file(path.join(projectRoot, "lib"));
      }

      // 4. فتح نافذة اختيار مكان الفيتشرز
      const folderResult = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        defaultUri: defaultUri,
        openLabel: "Select Location",
      });

      if (!folderResult || folderResult.length === 0) {
        return;
      }

      // هذا المسار اللي اختاره المستخدم عشان يحط فيه الفيتشرز
      const targetDirectory = folderResult[0].fsPath;

      // --- 5. منطق إنشاء Core Layer (التعديل الجديد) ---
      // هنا اجبرناه يمشي لـ lib/core مباشرة اعتماداً على جذر المشروع
      const corePath = path.join(projectRoot, "lib", "core");

      if (!fs.existsSync(corePath)) {
        const coreFolders = [
          corePath,
          path.join(corePath, "error"),
          path.join(corePath, "utils"),
          path.join(corePath, "network"),
          path.join(corePath, "api"),
          path.join(corePath, "widgets"),
        ];

        try {
          coreFolders.forEach((folder) =>
            fs.mkdirSync(folder, { recursive: true })
          );
          vscode.window.showInformationMessage(
            "✨ Core layer created successfully in lib/core!"
          );
        } catch (e) {
          console.error("Error creating core:", e);
        }
      }
      // -----------------------------------------------

      // 6. إنشاء الفيتشرز (في المكان اللي اختاره المستخدم)
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
          folders.forEach((folder) =>
            fs.mkdirSync(folder, { recursive: true })
          );
          createdCount++;
        } catch (err) {
          vscode.window.showErrorMessage(`Error creating "${featureName}"`);
        }
      });

      if (createdCount > 0) {
        vscode.window.showInformationMessage(
          `🚀 Successfully created ${createdCount} feature(s) with Clean Architecture!`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}