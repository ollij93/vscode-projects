import axios from "axios";
import * as cp from "child_process";
import * as fs from "fs";
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
        is_template: boolean;
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
        host: string,
        path: string,
        method: Method = "GET",
        data?: string
    ): Promise<T> {
        let pass: string = getToken(host);
        return await axios
            .request<T>({
                method: method,
                url: `https://${host}${path}`,
                headers: {
                    authorization: "token " + pass,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    "User-Agent": "other",
                },
                data: data,
            })
            .then((resp) => resp.data);
    }

    export async function getRepos(host: string): Promise<Array<Repo>> {
        let reposArray: Repo[] = await makeApiRequest<Repo[]>(
            host,
            "/user/repos?visibility=all"
        );
        console.log(reposArray);
        return reposArray;
    }

    export async function createRepo(
        host: string,
        name: string,
        templateRepo?: github.Repo
    ): Promise<Repo> {
        let requestPath = templateRepo
            ? `/repos/${templateRepo.full_name}/generate`
            : "/user/repos";
        console.log(requestPath);
        let repo = await makeApiRequest<Repo>(
            host,
            requestPath,
            "POST",
            JSON.stringify({
                name: name,
                private: true,
            })
        );
        console.log("New repo:");
        console.log(repo);

        // Check that the message recieved has the expected content.
        if (repo.ssh_url !== undefined) {
            return repo;
        } else {
            throw new Error("Created repository returned no ssh_url");
        }
    }
}
