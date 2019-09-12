import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as path from "path";

async function run() {
  try {
    const dmdVersion = core.getInput('dmd-version');

    let bin: string;
    if (process.platform == "win32") {
      bin = "dmd2\\windows\\bin";
    } else if (process.platform == "linux") {
      if (process.arch == "ia32")
        bin = "dmd2/linux/bin32";
      else
        bin = "dmd2/linux/bin64";
    } else if (process.platform == "darwin") {
      bin = "dmd2/osx/bin";
    } else
      throw new Error(`Failed to determine dmd output directory`);

    const dmd = await installDMD(dmdVersion);
    core.exportVariable("D_HOME", dmd);
    core.addPath(path.join(dmd, bin));
  } catch (error) {
    core.setFailed(error.message);
  }
}

export async function installDMD(dmdVersion: string): Promise<string> {
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

  let url: string = "";
  let type: "7z" | "zip" | "tarxz" | undefined = undefined;
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
  } else {
    const minor = parseInt(match[1]);

    if (minor < 65) {
      type = "zip";
      let effective = dmdVersion;
      if (effective.endsWith(".0"))
        effective = effective.slice(0, -2);
      url = `http://downloads.dlang.org/releases/2.x/${effective}/dmd.${effective}.windows.zip`;
    } else if (minor < 69) {
      if (process.platform == "win32") {
        type = "zip";
        url = `http://downloads.dlang.org/releases/2.x/${dmdVersion}/dmd.${dmdVersion}.windows.zip`;
      } else if (process.platform == "linux") {
        type = "tarxz";
        url = `http://downloads.dlang.org/releases/2.x/${dmdVersion}/dmd.${dmdVersion}.linux.tar.xz`;
      } else if (process.platform == "darwin") {
        type = "zip";
        url = `http://downloads.dlang.org/releases/2.x/${dmdVersion}/dmd.${dmdVersion}.osx.zip`;
      }
    } else {
      if (process.platform == "win32") {
        type = "7z";
        url = `http://downloads.dlang.org/releases/2.x/${dmdVersion}/dmd.${dmdVersion}.windows.7z`;
      } else if (process.platform == "linux") {
        type = "tarxz";
        url = `http://downloads.dlang.org/releases/2.x/${dmdVersion}/dmd.${dmdVersion}.linux.tar.xz`;
      } else if (process.platform == "darwin") {
        type = "tarxz";
        url = `http://downloads.dlang.org/releases/2.x/${dmdVersion}/dmd.${dmdVersion}.osx.tar.xz`;
      }
    }
  }

  if (!url.length || type === undefined)
    throw new Error(`Failed to determine dmd download URL for version ${dmdVersion}`);

  core.debug("Downloading DMD from " + url);
  const tmppath = await tc.downloadTool(url);
  let dstdir: string;
  switch (type) {
    case "tarxz":
      dstdir = await tc.extractTar(tmppath, undefined, "xJ");
      break;
    case "7z":
      dstdir = await tc.extract7z(tmppath);
      break;
    case "zip":
      dstdir = await tc.extractZip(tmppath);
      break;
    default: throw new Error("unexpected program state");
  }

  if (dmdVersion !== "master")
    tc.cacheDir(dstdir, "dmd", dmdVersion);

  return dstdir;
}

run();
