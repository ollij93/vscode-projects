import * as cp from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

export module github {
    export interface Repo {
        name: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        full_name: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ssh_url: string;
        owner: {
            login: string;
            type: string;
        }
    }

    export function getAPIs(): Array<string> {
        let config = vscode.workspace.getConfiguration('vscode-projects');
        return config.get('githubServerAPIs') || [];
    }

    export function getToken(host: string): string {
        // @@@ - TODO: Error handling
        try {
            return JSON.parse(
                fs.readFileSync(
                    os.homedir() + path.sep + '.ollij93.githubkeys'
                ).toString()
            )[host];
        } catch (error) {
            console.error(error);
            return "";
        }
    }

    export function clone(repo: Repo, root: string): string | null {
        let checkout: string | null = [root, repo.name].join(path.sep);
    
        // @@@ - TODO: Handle ssh issues
        try {
            vscode.window.setStatusBarMessage("Cloning " + repo.ssh_url + ' to ' + checkout + ' ...');
            cp.execSync('git clone ' + repo.ssh_url + ' ' + checkout);
        } catch (error) {
            checkout = null;
        }
    
        return checkout;
    }

    export function getRepos(host: string, append: Array<Repo> = []): Promise<Array<Repo>> {
        return new Promise((resolve, reject) => {
            // @@@ - TODO: Handle case where git isn't available - use local checkouts
            let user: string = os.userInfo().username;
            let pass: string = getToken(host);
            let auth: string = Buffer.from(user + ':' + pass).toString('base64');
            let hostParts: Array<string> = host.split('/');
            host = hostParts[0];
            hostParts.shift();
            let hostUrlPath: string = hostParts.join('/');
            if (hostUrlPath !== "") {
                hostUrlPath = '/' + hostUrlPath;
            }
            let options = {
                method: 'GET',
                hostname: host,
                path: hostUrlPath + '/user/repos?visibility=all',
                port: 443,
                headers: {
                    authorization: 'token ' + pass,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    "User-Agent": 'other'
                }
            };
            let req = https.request(
                options,
                (res: http.IncomingMessage) => {
                    let content: string = "";
                    res.on('data', function (chunk) {
                        content += chunk.toString();
                    });
                    res.on('end', () => {
                        // Parse the repository JSON and convert into a Map for later use.
                        let reposArray: Array<Repo> = JSON.parse(content);
                        resolve(append.concat(reposArray));
                    });
                }
            );
            req.on('error', (e) => {
                console.error(e);
                reject(e);
            });
            req.end();
        });
    }
}