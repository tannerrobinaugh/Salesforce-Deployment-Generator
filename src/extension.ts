import * as vscode from "vscode";
import * as compile from "./compile";
import * as deploy from "./deploy";

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel(
    "Salesforce Deployment Compilation Report"
  );
  const deploymentDirectory = vscode.workspace
    .getConfiguration("salesforce-deployment-generator")
    .get("deploymentDirectoryName", "tmp");

  let generateDeployment = vscode.commands.registerCommand(
    "salesforce-deployment-generator.generateDeployment",
    () => {
      if (vscode.workspace.workspaceFolders !== undefined) {
        let wf = vscode.workspace.workspaceFolders[0].uri.fsPath;
        process.chdir(wf);
        outputChannel.clear();
        compile.compile(outputChannel, deploymentDirectory);
      } else {
        vscode.window.showErrorMessage("Must have a workspace open");
        return null;
      }
    }
  );

  let deployment = vscode.commands.registerCommand(
    "salesforce-deployment-generator.deployment",
    () => {
      if (vscode.workspace.workspaceFolders !== undefined) {
        let wf = vscode.workspace.workspaceFolders[0].uri.fsPath;
        process.chdir(wf);
        outputChannel.clear();
        deploy.deploy(outputChannel, deploymentDirectory);
      } else {
        vscode.window.showErrorMessage("Must have a workspace open");
        return null;
      }
    }
  );

  context.subscriptions.push(generateDeployment);
  context.subscriptions.push(deployment);
}

export function deactivate() {}
