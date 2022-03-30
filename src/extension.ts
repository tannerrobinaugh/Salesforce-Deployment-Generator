import * as vscode from "vscode";
import * as compile from "./compile";

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel(
    "Salesforce Deployment Compilation Report"
  );
  let disposable = vscode.commands.registerCommand(
    "salesforce-deployment-generator.generateDeployment",
    () => {
      if (vscode.workspace.workspaceFolders !== undefined) {
        let wf = vscode.workspace.workspaceFolders[0].uri.fsPath;
        process.chdir(wf);
        outputChannel.clear();
        compile.compile(outputChannel);
      } else {
        return null;
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
