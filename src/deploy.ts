import * as fs from "fs-extra";
import * as proc from "child_process";
import * as vscode from "vscode";

export function deploy(
  outputChannel: vscode.OutputChannel,
  deploymentDirectory: string
): void {
  const testOptions = [
    {
      label: "No Tests",
      description: "Doesn't run any tests",
      value: "No Tests",
    },
    {
      label: "All Tests",
      description: "Runs all tests",
      value: "All Tests",
    },
    {
      label: "Specified Tests",
      description: "Runs specified tests",
      value: "Specified Tests",
    },
  ];
  vscode.window
    .showQuickPick(testOptions, { title: "Run Tests?" })
    .then((runTests) => {
      console.log(runTests);
      if (runTests === null || runTests === undefined) {
        return null;
      } else if (runTests.value === "No Tests") {
        const dep = proc.spawn(
          `sfdx force:source:deploy -p ./${deploymentDirectory} -l NoTestRun`,
          { shell: true }
        );
        outputChannel.show();
        dep.stdout.on("data", (data) => {
          outputChannel.appendLine(data);
        });
        dep.stderr.on("data", (data) => {
          outputChannel.appendLine(data);
        });
      } else if (runTests.value === "All Tests") {
        const dep = proc.spawn(
          `sfdx force:source:deploy -p ./${deploymentDirectory} -l RunLocalTests`,
          { shell: true }
        );
        outputChannel.show();
        dep.stdout.on("data", (data) => {
          outputChannel.appendLine(data);
        });
        dep.stderr.on("data", (data) => {
          outputChannel.appendLine(data);
        });
      } else {
        vscode.window
          .showInputBox({
            title: "Enter Tests",
            prompt: "Enter Tests",
            validateInput: (value) => {
              if (value.indexOf(" ") >= 0) {
                return "Do not include spaces";
              }
              return null;
            },
          })
          .then((tests) => {
            if (tests === null || tests === undefined) {
              return null;
            }
            const dep = proc.spawn(
              `sfdx force:source:deploy -p ./${deploymentDirectory} -l RunSpecifiedTests -r ${tests}`,
              { shell: true }
            );
            outputChannel.show();
            dep.stdout.on("data", (data) => {
              outputChannel.appendLine(data);
            });
            dep.stderr.on("data", (data) => {
              outputChannel.appendLine(data);
            });
          });
      }
      const removeDirectorySetting = vscode.workspace
        .getConfiguration("salesforce-deployment-generator")
        .get("removeDeploymentDirectoryAfterDeploy");
      if (removeDirectorySetting === "Always remove directory") {
        fs.rm(deploymentDirectory, { recursive: true });
      } else if (removeDirectorySetting === "Prompt for removal") {
        const removeOptions = [
          {
            label: "Keep Directory",
            description: `Keep the ${deploymentDirectory} directory`,
            value: false,
          },
          {
            label: "Remove Directory",
            description: `Remove the ${deploymentDirectory} directory`,
            value: true,
          },
        ];
        vscode.window
          .showQuickPick(removeOptions, {
            title: `Keep or Remove ${deploymentDirectory} Directory`,
          })
          .then((removeDirectory) => {
            if (removeDirectory) {
              fs.rm(deploymentDirectory, { recursive: true });
            }
          });
      }
    });
}
