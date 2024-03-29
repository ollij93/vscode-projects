import axios from "axios";
import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export module github {
    // Allow snake case names here as that's what the github api returns.
    /* eslint-disable @typescript-eslint/naming-convention */
    export interface Repo {
        name: string;
        full_name: string;
        ssh_url: string;
        owner: {
            login: string;
            type: string;
        };
        is_template: boolean;
    }
    /* eslint-enable */

    export function getAPIs(
        config: vscode.WorkspaceConfiguration
    ): Array<string> {
        return config.get("githubServerAPIs") || [];
    }

    export function getToken(
        config: vscode.WorkspaceConfiguration,
        host: string
    ): string {
        // Get the configured keys path
        let keysFile: string | undefined = config.get("githubKeysPath");
        if (keysFile === undefined) {
            const msg = "No item configured for githubKeysPath";
            vscode.window.showErrorMessage(msg);
            throw new Error(msg);
        }

        // Check the configured file exists
        let path: string = keysFile;
        if (!fs.existsSync(path)) {
            const msg = "The configured path for githubKeysPath does not exist: " + path;
            vscode.window.showErrorMessage(msg);
            throw new Error(msg);
        }

        // Read the file and parse the content
        try {
            let data = fs.readFileSync(path);
            let obj = JSON.parse(data.toString());
            return (obj[host]);
        } catch (error) {
            if (error instanceof SyntaxError) {
                vscode.window.showErrorMessage(error.toString());
            } else {
                console.error(error);
            }
            throw error;
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
                        vscode.window.showErrorMessage(
                            "Failed to clone the repo"
                        );
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

    type Method = "GET" | "POST";

    async function makeApiRequest<T>(
        token: string,
        host: string,
        path: string,
        method: Method = "GET",
        data?: string
    ): Promise<T> {

        const headers = {
            /* eslint-disable @typescript-eslint/naming-convention */
            authorization: "token " + token,
            "User-Agent": "other",
            Accept: "application/vnd.github.baptiste-preview+json",
            /* eslint-enable */
        };
        const origReq = axios.request<T>({
            method: method,
            url: `https://${host}${path}`,
            headers: headers,
            data: data,
        });
        const paginationloop = (currData: any, req: any) =>
            req.then((resp: any) => {
                var nextLink = null;
                if ("link" in resp.headers) {
                    const links = resp.headers["link"].split(",");
                    const next = links.find((link: string) => link.endsWith('rel="next"'))
                    if (next !== undefined) {
                        nextLink = next.split(";")[0].trim().slice(1, -1);
                    }
                }
                var newData;
                if (currData === null) {
                    newData = resp.data;
                } else {
                    newData = currData.concat(resp.data);
                }

                if (nextLink === null) {
                    return newData;
                } else {
                    return paginationloop(newData, axios.request<T>({
                        method: method,
                        url: nextLink,
                        headers: headers,
                        data: data,
                    }));
                }
            });

        return paginationloop(null, origReq);
    }

    export async function getRepos(token: string, host: string): Promise<Array<Repo>> {
        return makeApiRequest<Repo[]>(token, host, "/user/repos?visibility=all");
    }

    export async function createRepo(
        token: string,
        host: string,
        name: string,
        templateRepo?: github.Repo
    ): Promise<Repo> {
        let requestPath = templateRepo
            ? `/repos/${templateRepo.full_name}/generate`
            : "/user/repos";
        return makeApiRequest<Repo>(
            token,
            host,
            requestPath,
            "POST",
            JSON.stringify({
                name: name,
                private: true,
            })
        ).then((repo) => {
            console.log("New repo:");
            console.log(repo);

            // Check that the message recieved has the expected content.
            if (repo.ssh_url !== undefined) {
                return repo;
            } else {
                throw new Error("Created repository returned no ssh_url");
            }
        });
    }
}
