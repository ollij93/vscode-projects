# Change Log

All notable changes to the "vscode-projects" extension will be documented in this file.

## 0.0.0

- Initial release

## 0.0.1

- Extended set of color codes now covers all 32 NFL teams
- Private GitHub repos are now accessible via github api token usage

## 0.0.2

- Use configuration for file and repository locations
- Use the username of the OS user when contacting github

## 0.1.0

- Support multiple configured github server APIs
- Display full repository name to separate repositories by owner

## 0.2.0

- Add the "new project" command
- Add support for multiple root locations for cloning repositories
- Improve code structure and documentation

## 0.2.1

- Fix handling when one configured github server is not available

## 0.2.2

- Added the Open Github Page command

## 0.2.3

- Convert to using axios for requests
- Change many functions to async functions to improve flow and structure

## 0.2.4

- Fixed github API template usage which currently needs a preview

## 0.2.5

- Add config option for where github keys are stored
- Add activity bar coloring
- Provide default color for projects

## 0.3.0

- Add the "Update Project Colors" command

## 0.3.1

- Add placeholder text to user input fields
- Add empty template option for new project creation
- Fix cancelling new project creation on the template selection

## 0.3.2

- Rename Washington Commanders color scheme
- Extend the open github page command to open the active file and line

## 0.3.3

- Add inverted color schemes

## 0.3.4

- Add the project icon
- Color the status bar along with the title and activity bar

## 0.3.5

- Add pagination support for github allowing >30 repos to be supported

## 0.3.6

- Add configurable color codes

## 0.3.7

- Fix failure to clone repositories that already exist locally
