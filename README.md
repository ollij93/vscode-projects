# vscode-projects README

This is a VSCode extension that provides some commands to quickly manage the setup of workspaces for git projects hosted on GitHub and maybe in future other host systems.

<!--
## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.
-->

<!--
## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.
-->

<!--
## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something
-->

## Known Issues

Missing features:

* GitHub key requires setup with no instructions
* No choice of templates for creating new projects
* Repository setup (e.g. requirements.txt install) not enabled

Problems:
*None*

## Release Notes

### 0.0.0

Initial release of vscode-projects

### 0.0.1

Extended functionality for private GitHub repos and extended set of color
codes now covering all 32 NFL teams.

### 0.0.2

Add configuration for locations to create project directories and
code-workspace files.

### 0.1.0

Add the capability to configure multiple github server APIs.
Display the full repository name when selecting project to split them by
the owner.

### 0.2.0

Add the "new project" command.
Add support for multiple root locations for cloning repositories.

### 0.2.1

Fix github API error handling.

### 0.2.2

Add a command to open the URL of the repo for the current workspace.

### 0.2.3

Convert to using axios and async functions to improve the http requests
handling.
