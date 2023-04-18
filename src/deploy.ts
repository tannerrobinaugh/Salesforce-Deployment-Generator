import * as fs from "fs-extra";
import * as proc from "child_process";
import * as vscode from "vscode";

export function deploy(
  outputChannel: vscode.OutputChannel,
  deploymentDirectory: string
): void {
  const dryRunOptions = [
    {
      label: "Dry Run",
      description:
        "Validate deploy and run Apex tests but does not save to the org",
      value: "Dry Run",
    },
    {
      label: "Real Deployment",
      description: "Does a real deployment (not a dry run)",
      value: "Real Deployment",
    },
  ];
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
    .showQuickPick(dryRunOptions, { title: "Dry Run or Real Deployment" })
    .then((dryRunResponse) => {
      vscode.window
        .showQuickPick(testOptions, { title: "Run Tests?" })
        .then((runTests) => {
          var deployCommand: string = "";
          var useSFCommands = vscode.workspace
            .getConfiguration("salesforce-deployment-generator")
            .get("useSFCommands");
          if (runTests === undefined) {
            return null;
          } else if (runTests.value === "No Tests") {
            if (useSFCommands) {
              deployCommand = `sf project deploy start -d ./${deploymentDirectory} -l NoTestRun`;
            } else {
              deployCommand = `sfdx force:source:deploy -p ./${deploymentDirectory} -l NoTestRun`;
            }
          } else if (runTests.value === "All Tests") {
            if (useSFCommands) {
              deployCommand = `sf project deploy start -d ./${deploymentDirectory} -l RunLocalTests`;
            } else {
              deployCommand = `sfdx force:source:deploy -p ./${deploymentDirectory} -l RunLocalTests`;
            }
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
                if (tests === undefined) {
                  return null;
                }
                if (useSFCommands) {
                  deployCommand = `sf project deploy start -d ./${deploymentDirectory} -l RunSpecifiedTests -t ${tests}`;
                } else {
                  deployCommand = `sfdx force:source:deploy -p ./${deploymentDirectory} -l RunSpecifiedTests -r ${tests}`;
                }
              });
          }
          if (
            dryRunResponse === undefined ||
            dryRunResponse.value === "Dry Run"
          ) {
            if (useSFCommands) {
              deployCommand += " --dry-run";
            } else {
              deployCommand += " -c";
            }
          }
          const dep = proc.spawn(deployCommand, { shell: true });
          dep.stdout.on("data", (data) => {
            outputChannel.appendLine(data);
          });
          dep.stderr.on("data", (data) => {
            outputChannel.appendLine(data);
          });
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
    });
}
