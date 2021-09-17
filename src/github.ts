import * as cp from "child_process";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

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
        };
    }

    export function getAPIs(): Array<string> {
        let config = vscode.workspace.getConfiguration("vscode-projects");
        return config.get("githubServerAPIs") || [];
    }

    export function getToken(host: string): string {
        // @@@ - TODO: Error handling
        try {
            return JSON.parse(
                fs
                    .readFileSync(
                        os.homedir() + path.sep + ".ollij93.githubkeys"
                    )
                    .toString()
            )[host];
        } catch (error) {
            console.error(error);
            return "";
        }
    }

    export function clone(repo: Repo, root: string): Promise<string> {
        let checkout: string = [root, repo.name].join(path.sep);
        return new Promise((resolve, reject) => {
            let msg: string = `Cloning ${repo.ssh_url} to ${checkout} ...`;
            console.log(msg);
            vscode.window.setStatusBarMessage(msg);
            cp.exec(
                `git clone ${repo.ssh_url} ${checkout}`,
                (err, _, stderr) => {
                    if (err) {
                        vscode.window.showErrorMessage("Failed to clone the repo");
                        console.error(err);
                        console.error(stderr);
                        reject(err);
                    } else {
                        vscode.window.setStatusBarMessage("");
                        resolve(checkout);
                    }
                }
            );
        });
    }

    function makeApiRequest<T>(
        host: string,
        path: string,
        cb: (
            resolve: (value: T | PromiseLike<T>) => void,
            reject: (reason?: any) => void,
            content: string
        ) => void,
        method: string = "GET",
        data?: string
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            // @@@ - TODO: Handle case where git isn't available - use local checkouts
            let pass: string = getToken(host);
            let hostParts: Array<string> = host.split("/");
            host = hostParts[0];
            hostParts.shift();
            let hostUrlPath: string = hostParts.join("/");
            if (hostUrlPath !== "") {
                hostUrlPath = "/" + hostUrlPath;
            }
            let options = {
                method: method,
                hostname: host,
                path: hostUrlPath + path,
                port: 443,
                headers: {
                    authorization: "token " + pass,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    "User-Agent": "other",
                },
            };
            let req = https.request(options, (res: http.IncomingMessage) => {
                let content: string = "";
                res.on("data", function (chunk) {
                    content += chunk.toString();
                });
                res.on("end", () => {
                    cb(resolve, reject, content);
                });
            });
            if (data !== undefined) {
                req.write(data);
            }
            req.on("error", (e) => {
                console.error(e);
                reject(e);
            });
            req.end();
        });
    }

    export function getRepos(
        host: string,
    ): Promise<Array<Repo>> {
        return makeApiRequest(
            host,
            "/user/repos?visibility=all",
            (resolve, reject, content) => {
                // Parse the repository JSON and convert into a Map for later use.
                let reposArray: Array<Repo> = JSON.parse(content);
                console.log(reposArray);
                resolve(reposArray);
            }
        );
    }

    export function createRepo(host: string, name: string): Promise<Repo> {
        return makeApiRequest(
            host,
            "/user/repos",
            (resolve, reject, content) => {
                let repo: Repo = JSON.parse(content);
                console.log("New repo:");
                console.log(repo);

                // Check that the message recieved has the expected content.
                if (repo.ssh_url !== undefined) {
                    resolve(repo);
                } else {
                    reject(repo);
                }
            },
            "POST",
            JSON.stringify({
                name: name,
                private: true,
            })
        );
    }
}
