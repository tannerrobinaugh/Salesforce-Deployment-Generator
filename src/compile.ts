import * as fs from "fs-extra";
import * as proc from "child_process";
import * as vscode from "vscode";
import { rm } from "fs";

/**
 * Creates a folder and copies files into it with the correct folder structure to deploy to Salesforce based on Git commits
 * @param outputChannel The channel in VSCode to write the output from the deployment to
 * @param deploymentDirectory The directory that the files to deploy are stored in
 */
export function compile(
  outputChannel: vscode.OutputChannel,
  deploymentDirectory: string
): void {
  const options = [
    {
      label: "Yes",
      description: `Keeps the ${deploymentDirectory} directory`,
      value: true,
    },
    {
      label: "No",
      description: `Deletes the ${deploymentDirectory} directory`,
      value: false,
    },
  ];
  vscode.window
    .showQuickPick(options, { title: `Keep ${deploymentDirectory} directory` })
    .then((keepDirectory) => {
      if (keepDirectory === null || keepDirectory === undefined) {
        return null;
      } else if (keepDirectory.value === false) {
        fs.rm(deploymentDirectory, { recursive: true });
      }
      vscode.window
        .showInputBox({
          prompt: "Enter number of commits",
          title: "Enter number of commits",
          validateInput: (value) => {
            var commits = Number(value);
            if (commits === null || Number.isNaN(commits)) {
              return "Response must be a number";
            }
            return null;
          },
        })
        .then((commitString) => {
          if (commitString !== undefined) {
            var commits = Number(commitString);
            if (commits !== null && !Number.isNaN(commits)) {
              vscode.window.withProgress(
                {
                  location: vscode.ProgressLocation.Window,
                  title: "Compiling Deployment",
                },
                async () => {
                  proc.exec(
                    `git diff --name-only HEAD HEAD~${commits}`,
                    (error, stdout, stderr) => {
                      if (error) {
                        console.error(`Exec error: ${error}`);
                        return;
                      }
                      var missing = [];
                      var needsTest = [];
                      var staticResources = [];
                      var files = stdout.split("\n");
                      if (!fs.existsSync(deploymentDirectory)) {
                        fs.mkdirSync(deploymentDirectory);
                      }
                      for (const f of files) {
                        if (!f.startsWith("force-app/main/default/")) {
                          continue;
                        }
                        var folders = f
                          .replace("force-app/main/default/", "")
                          .split("/");
                        if (
                          !fs.existsSync(`${deploymentDirectory}/${folders[0]}`)
                        ) {
                          fs.mkdirSync(`${deploymentDirectory}/${folders[0]}`);
                        }
                        if (
                          ["aura", "lwc", "email"].indexOf(folders[0]) !== -1
                        ) {
                          if (f.endsWith("-meta.xml")) {
                            continue;
                          } else if (
                            folders[0] === "aura" ||
                            (folders[0] === "lwc" &&
                              folders[1] !== "jsconfig.json")
                          ) {
                            try {
                              fs.copySync(
                                `force-app/main/default/${folders[0]}/${folders[1]}`,
                                `${deploymentDirectory}/${folders[0]}/${folders[1]}`
                              );
                            } catch (err) {
                              if (
                                fs.readdirSync(
                                  `${deploymentDirectory}/${folders[0]}/${folders[1]}`
                                ).length === 0
                              ) {
                                fs.removeSync(
                                  `${deploymentDirectory}/${folders[0]}/${folders[1]}`
                                );
                              }
                              missing.push(f);
                            }
                          }
                          try {
                            fs.copyFileSync(
                              f,
                              `${deploymentDirectory}/${folders[0]}/${folders[1]}/${folders[2]}`
                            );
                          } catch (err) {
                            missing.push(f);
                          }
                          if (fs.existsSync(f + "-meta.xml")) {
                            try {
                              fs.copyFileSync(
                                f + "-meta.xml",
                                `${deploymentDirectory}/${folders[0]}/${folders[1]}/${folders[2]}`
                              );
                            } catch (err) {
                              continue;
                            }
                          }
                          if (
                            fs.existsSync(
                              `${deploymentDirectory}/${folders[0]}/${folders[1]}/__tests__/`
                            )
                          ) {
                            fs.removeSync(
                              `${deploymentDirectory}/${folders[0]}/${folders[1]}/__tests__/`
                            );
                          }
                        } else if (
                          [
                            "classes",
                            "components",
                            "contentassets",
                            "pages",
                            "triggers",
                            "customPermissions",
                            "wave",
                          ].indexOf(folders[0]) !== -1
                        ) {
                          if (
                            !fs.existsSync(
                              `${deploymentDirectory}/${folders[0]}`
                            )
                          ) {
                            fs.mkdirSync(
                              `${deploymentDirectory}/${folders[0]}`
                            );
                          }
                          if (f.endsWith("-meta.xml")) {
                            continue;
                          }
                          try {
                            fs.copyFileSync(
                              f,
                              `${deploymentDirectory}/${folders[0]}/${folders[1]}`
                            );
                            if (
                              ["classes", "triggers"].indexOf(folders[0]) !== -1
                            ) {
                              var file = fs.readFileSync(f);
                              var isTest = false;
                              try {
                                for (const l in file) {
                                  if (
                                    ["@istest", "testmethod"].indexOf(
                                      l.toLowerCase()
                                    ) !== -1
                                  ) {
                                    isTest = true;
                                    break;
                                  }
                                }
                              } catch (err) {
                                continue;
                              }
                              if (!isTest) {
                                needsTest.push(f);
                              }
                            }
                            if (fs.existsSync(`${f}-meta.xml`)) {
                              fs.copyFileSync(
                                `${f}-meta.xml`,
                                `${deploymentDirectory}/${folders[0]}/${folders[1]}-meta.xml`
                              );
                            }
                          } catch (err) {
                            missing.push(f);
                          }
                        } else if (folders[0] === "objects") {
                          if (
                            !fs.existsSync(
                              `${deploymentDirectory}/${folders[0]}/${folders[1]}`
                            )
                          ) {
                            fs.mkdirsSync(
                              `${deploymentDirectory}/${folders[0]}/${folders[1]}`
                            );
                          }
                          if (f.endsWith("object-meta.xml")) {
                            try {
                              fs.copyFileSync(
                                f,
                                `${deploymentDirectory}/${folders[0]}/${folders[1]}/${folders[2]}`
                              );
                            } catch (err) {
                              missing.push(f);
                            }
                          } else {
                            if (
                              !fs.existsSync(
                                `${deploymentDirectory}/${folders[0]}/${folders[1]}/${folders[2]}`
                              )
                            ) {
                              fs.mkdirSync(
                                `${deploymentDirectory}/${folders[0]}/${folders[1]}/${folders[2]}`
                              );
                            }
                            try {
                              fs.copyFileSync(
                                f,
                                `${deploymentDirectory}/${folders[0]}/${folders[1]}/${folders[2]}/${folders[3]}`
                              );
                            } catch (err) {
                              missing.push(f);
                            }
                          }
                        } else if (
                          ["reports", "dashboards"].indexOf(folders[0]) !== -1
                        ) {
                          if (f.endsWith("Folder-meta.xml")) {
                            if (
                              !fs.existsSync(
                                `${deploymentDirectory}/${folders[0]}`
                              )
                            ) {
                              fs.mkdirSync(
                                `${deploymentDirectory}/${folders[0]}`
                              );
                            }
                            try {
                              fs.copyFileSync(
                                f,
                                `${deploymentDirectory}/${folders[0]}/${folders[1]}`
                              );
                            } catch (err) {
                              missing.push(f);
                            }
                          } else {
                            if (
                              !fs.existsSync(
                                `${deploymentDirectory}/${folders[0]}/${folders[1]}`
                              )
                            ) {
                              fs.mkdirSync(
                                `${deploymentDirectory}/${folders[0]}/${folders[1]}`
                              );
                            }
                            try {
                              fs.copyFileSync(
                                f,
                                `${deploymentDirectory}/${folders[0]}/${folders[1]}/${folders[2]}`
                              );
                            } catch (err) {
                              missing.push(f);
                            }
                          }
                        } else if (folders[0] === "staticresources") {
                          staticResources.push(f);
                          continue;
                        } else {
                          if (
                            !fs.existsSync(
                              `${deploymentDirectory}/${folders[0]}`
                            )
                          ) {
                            fs.mkdirSync(
                              `${deploymentDirectory}/${folders[0]}`
                            );
                          }
                          try {
                            fs.copyFileSync(
                              f,
                              `${deploymentDirectory}/${folders[0]}/${folders[1]}`
                            );
                          } catch (err) {
                            missing.push(f);
                          }
                        }
                      }
                      if (missing.length > 0) {
                        outputChannel.appendLine("Missing Files:");
                        for (const s of missing) {
                          outputChannel.appendLine(s);
                        }
                      }
                      if (needsTest.length > 0) {
                        outputChannel.appendLine("Needs Testing:");
                        for (const s of needsTest) {
                          outputChannel.appendLine(s);
                        }
                      }
                      if (staticResources.length > 0) {
                        outputChannel.appendLine("Static Resources:");
                        for (const s of staticResources) {
                          outputChannel.appendLine(s);
                        }
                      }
                    }
                  );
                }
              );
            } else {
              vscode.window.showErrorMessage(
                "The value you entered is not a number"
              );
            }
          }
        });
    });
}
