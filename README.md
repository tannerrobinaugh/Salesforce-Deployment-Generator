# Salesforce Deployment Generator

The Salesforce Deployment Generator simplifies your deployments by compiling all the files that have been recently changed (and the files they depend on) into a folder that can be deployed.

## Installation

Install through VS Code extensions or by downloading the .VSIX file from the [repository](https://github.com/tannerrobinaugh/Salesforce-Deployment-Generator) and installing manually.

## Dependencies

Installing the extension should also install all npm related dependencies, but in case not this extension depends on the [sfdx-cli](https://www.npmjs.com/package/sfdx-cli). This extension also depends on [Git](https://git-scm.com/) being installed on your machine.

## Usage

This extension comes with two commands that can be executed through the command palette. Generally speaking, they should be executed in the order they are explained:

### Salesforce: Generate Deployment

This command creates the deployment folder for you. The command executes as follows:

1. Asks if you would like the deployment directory to be deleted or not.
    - If this is a new deployment, typically the answer would be yes you want it deleted. However, if you've only made a small change to fix an issue that was preventing deployment, you would keep the deployment directory and that new change will just be added to it.
2. Asks how many commits you would like to retrieve changes from
3. Using `git diff`, all the files that have been added or modified in the number of commits specified are identified. Those files are then copied into the deployment directory in the correct Salesforce folder structure along with any files they depend on.
    - For example, to deploy a class or trigger you always need the class/trigger and the metadata file, even if only one of them changed. This extension will copy both files to the deployment directory if either of them change.

### Salesforce: Deploy

This command deploys the files in the deployment directory to the Salesforce instance you are currently pointed to. If you're doing Salesforce development and are using this extension, more than likely you also have the Salesforce Extension Pack which includes a feature to tell you what instance you are pointed to and gives the ability to change it. If you are not using that pack, it is strongly recommended.

The command executes as follows:

1. Asks if you would like to run no tests, all tests, or specified tests
2. If you select no tests or all tests, a deployment is started with the appropriate option.
3. If you select specified tests, then you are prompted to enter the tests you would like to run. These tests must be comma separated with no spaces.
4. The output from this deployment is displayed in an output window called Salesforce Deployment Compilation Report.

## Settings

This extension comes with two settings that can be edited either in the UI or the JSON settings file.

### Deployment Directory Name

This setting indicates what the deployment directory should be called. This value is a string and will be referenced throughout the extension. It is recommend that whatever you call this directory be added to your .gitignore file

**Note:** If you run the generate deployment command, then change the directory name, and then finally try to deploy, you will run into errors.

### Remove Deployment Directory After Deploy

This setting indicates whether the deployment directory generated by the first command should be deleted or not after the deployment command is run. The options are:

- Always keep directory (i.e. don't prompt the user, don't delete the directory)
- Always remove directory (i.e. don't prompt the user, delete the directory)
- Prompt for removal