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

### 0.0.0

New Issues:
* Limited to public repositories
* Reduced set of color codes
* No SSH error handling for git commands
* Repository setup (e.g. requirements.txt install) not enabled
* Username not configurable
* File and repository locations not configurable
* No error handling for github API connection

### 0.0.1

Fixed Issues from previous version:
* Private GitHub repos now supported
* Full set of NFL color codes included

New Issues:

## Release Notes

### 0.0.0

Initial release of vscode-projects

### 0.0.1

Extended functionality for private GitHub repos and extended set of color
codes now covering all 32 NFL teams.