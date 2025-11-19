import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  console.log("FluCa Generator is now active!");

  let disposable = vscode.commands.registerCommand(
    "fluca-generator.createFeature",
    async () => {
      // 1. Check Workspace
      if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage(
          "Please open a Flutter project folder first."
        );
        return;
      }

      // 2. Get Feature Names
      const input = await vscode.window.showInputBox({
        prompt: 'Enter Feature Names (e.g. "auth home settings")',
        placeHolder: "auth home profile",
      });

      if (!input || input.trim() === "") return;

      const featureNames = input
        .split(" ")
        .filter((name) => name.trim() !== "");
      const projectRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

      // 3. Select Location
      let defaultUri: vscode.Uri | undefined;
      const featuresPath = path.join(projectRoot, "lib", "features");
      if (fs.existsSync(featuresPath)) {
        defaultUri = vscode.Uri.file(featuresPath);
      } else {
        defaultUri = vscode.Uri.file(path.join(projectRoot, "lib"));
      }

      const folderResult = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        defaultUri: defaultUri,
        openLabel: "Select Location",
      });

      if (!folderResult || folderResult.length === 0) return;

      const targetDirectory = folderResult[0].fsPath;

      // 4. Generate Core Layer (Always in lib/core)
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

      // 5. Loop through features
      let createdCount = 0;
      featureNames.forEach((rawName) => {
        const featureName = rawName.toLowerCase().trim(); // e.g. "auth"
        const pascalCaseName =
          rawName.charAt(0).toUpperCase() + rawName.slice(1); // e.g. "Auth"
        const featurePath = path.join(targetDirectory, featureName);

        if (fs.existsSync(featurePath)) {
          vscode.window.showWarningMessage(
            `⚠️ Feature "${featureName}" already exists. Skipped.`
          );
          return;
        }

        // Define Paths
        const dataPath = path.join(featurePath, "data");
        const domainPath = path.join(featurePath, "domain");
        const presentationPath = path.join(featurePath, "presentation");

        // Define Folders
        const folders = [
          featurePath,
          path.join(dataPath, "datasources"),
          path.join(dataPath, "models"),
          path.join(dataPath, "repositories"),
          path.join(domainPath, "entities"),
          path.join(domainPath, "repositories"),
          path.join(domainPath, "usecases"),
          path.join(presentationPath, "manager"),
          path.join(presentationPath, "pages"),
          path.join(presentationPath, "widgets"),
        ];

        try {
          // Create Folders
          folders.forEach((folder) =>
            fs.mkdirSync(folder, { recursive: true })
          );

          // --- إنشاء الملفات المطلوبة فقط ---

          // 1. Domain Layer: Entity
          createFile(
            path.join(domainPath, "entities", `${featureName}_entity.dart`),
            `class ${pascalCaseName}Entity {\n  const ${pascalCaseName}Entity();\n}`
          );

          // 2. Domain Layer: Repository Interface
          createFile(
            path.join(
              domainPath,
              "repositories",
              `${featureName}_repository.dart`
            ),
            `abstract class ${pascalCaseName}Repository {\n  // Future<void> exampleMethod();\n}`
          );

          // (اختياري) UseCase - لو تبي تلغيه امسح السطرين الجايين
          createFile(
            path.join(
              domainPath,
              "usecases",
              `get_${featureName}_usecase.dart`
            ),
            `class Get${pascalCaseName}UseCase {\n  const Get${pascalCaseName}UseCase();\n}`
          );

          // 3. Data Layer: Model
          createFile(
            path.join(dataPath, "models", `${featureName}_model.dart`),
            `import '../../domain/entities/${featureName}_entity.dart';\n\nclass ${pascalCaseName}Model extends ${pascalCaseName}Entity {\n  const ${pascalCaseName}Model();\n  \n  factory ${pascalCaseName}Model.fromJson(Map<String, dynamic> json) {\n    return ${pascalCaseName}Model();\n  }\n}`
          );

          // 4. Data Layer: Remote Data Source
          createFile(
            path.join(
              dataPath,
              "datasources",
              `${featureName}_remote_data_source.dart`
            ),
            `abstract class ${pascalCaseName}RemoteDataSource {\n  // Future<void> exampleMethod();\n}`
          );

          // 5. Data Layer: Local Data Source
          createFile(
            path.join(
              dataPath,
              "datasources",
              `${featureName}_local_data_source.dart`
            ),
            `abstract class ${pascalCaseName}LocalDataSource {\n  // Future<void> cacheData();\n}`
          );

          // 6. Data Layer: Repository Implementation
          createFile(
            path.join(
              dataPath,
              "repositories",
              `${featureName}_repository_impl.dart`
            ),
            `import '../../domain/repositories/${featureName}_repository.dart';\nimport '../datasources/${featureName}_remote_data_source.dart';\n\nclass ${pascalCaseName}RepositoryImpl implements ${pascalCaseName}Repository {\n  final ${pascalCaseName}RemoteDataSource remoteDataSource;\n\n  ${pascalCaseName}RepositoryImpl({required this.remoteDataSource});\n}`
          );

          // ملاحظة: تم إزالة كود إنشاء الصفحات (Pages) كما طلبت ✅

          createdCount++;
        } catch (err) {
          vscode.window.showErrorMessage(`Error creating "${featureName}"`);
        }
      });

      if (createdCount > 0) {
        vscode.window.showInformationMessage(
          `🚀 Created ${createdCount} features (Entities, Models, Repos, DataSources)!`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

// Helper Function
function createFile(filePath: string, content: string) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
  }
}

export function deactivate() {}
