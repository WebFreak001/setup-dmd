"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const path = __importStar(require("path"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const dmdVersion = core.getInput('dmd-version');
            let bin;
            if (process.platform == "win32") {
                bin = "dmd2\\windows\\bin";
            }
            else if (process.platform == "linux") {
                if (process.arch == "ia32")
                    bin = "dmd2/linux/bin32";
                else
                    bin = "dmd2/linux/bin64";
            }
            else if (process.platform == "darwin") {
                bin = "dmd2/osx/bin";
            }
            else
                throw new Error(`Failed to determine dmd output directory`);
            const dmd = yield installDMD(dmdVersion);
            core.exportVariable("D_HOME", dmd);
            core.addPath(path.join(dmd, bin));
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function installDMD(dmdVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        const match = /^(?:2\.(\d{3})(\.\d+(-[-+_.a-zA-Z0-9]+)?)?|master)$/.exec(dmdVersion);
        if (!match)
            throw new Error("Invalid DMD version " + dmdVersion);
        if (process.platform != "win32" && process.platform != "linux" && process.platform != "darwin") {
            throw new Error("Unsupported platform to install dmd on: " + process.platform);
        }
        if (dmdVersion !== "master") {
            const existingPath = tc.find("dmd", dmdVersion);
            if (existingPath) {
                return existingPath;
            }
        }
        let url = "";
        let type = undefined;
        const dst = path.join(process.cwd(), "dmd_" + dmdVersion);
        if (dmdVersion == "master") {
            switch (process.platform) {
                case "win32":
                    type = "7z";
                    url = `http://downloads.dlang.org/nightlies/dmd-master/dmd.master.windows.7z`;
                    break;
                case "linux":
                    type = "tarxz";
                    url = `http://downloads.dlang.org/nightlies/dmd-master/dmd.master.linux.tar.xz`;
                    break;
                case "darwin":
                    type = "tarxz";
                    url = `http://downloads.dlang.org/nightlies/dmd-master/dmd.master.osx.tar.xz`;
                    break;
            }
        }
        else {
            const minor = parseInt(match[1]);
            if (minor < 65) {
                type = "zip";
                let effective = dmdVersion;
                if (effective.endsWith(".0"))
                    effective = effective.slice(0, -2);
                url = `http://downloads.dlang.org/releases/2.x/${effective}/dmd.${effective}.windows.zip`;
            }
            else if (minor < 69) {
                if (process.platform == "win32") {
                    type = "zip";
                    url = `http://downloads.dlang.org/releases/2.x/${dmdVersion}/dmd.${dmdVersion}.windows.zip`;
                }
                else if (process.platform == "linux") {
                    type = "tarxz";
                    url = `http://downloads.dlang.org/releases/2.x/${dmdVersion}/dmd.${dmdVersion}.linux.tar.xz`;
                }
                else if (process.platform == "darwin") {
                    type = "zip";
                    url = `http://downloads.dlang.org/releases/2.x/${dmdVersion}/dmd.${dmdVersion}.osx.zip`;
                }
            }
            else {
                if (process.platform == "win32") {
                    type = "7z";
                    url = `http://downloads.dlang.org/releases/2.x/${dmdVersion}/dmd.${dmdVersion}.windows.7z`;
                }
                else if (process.platform == "linux") {
                    type = "tarxz";
                    url = `http://downloads.dlang.org/releases/2.x/${dmdVersion}/dmd.${dmdVersion}.linux.tar.xz`;
                }
                else if (process.platform == "darwin") {
                    type = "tarxz";
                    url = `http://downloads.dlang.org/releases/2.x/${dmdVersion}/dmd.${dmdVersion}.osx.tar.xz`;
                }
            }
        }
        if (!url.length || type === undefined)
            throw new Error(`Failed to determine dmd download URL for version ${dmdVersion}`);
        core.debug("Downloading DMD from " + url);
        const tmppath = yield tc.downloadTool(url);
        let dstdir;
        switch (type) {
            case "tarxz":
                dstdir = yield tc.extractTar(tmppath, undefined, "xJ");
                break;
            case "7z":
                dstdir = yield tc.extract7z(tmppath);
                break;
            case "zip":
                dstdir = yield tc.extractZip(tmppath);
                break;
            default: throw new Error("unexpected program state");
        }
        if (dmdVersion !== "master")
            tc.cacheDir(dstdir, "dmd", dmdVersion);
        return dstdir;
    });
}
exports.installDMD = installDMD;
run();
