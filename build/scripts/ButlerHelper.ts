import * as fs from "fs";
import archiver from "archiver";
import { execSync } from "child_process";
import { zip } from "three/examples/jsm/libs/fflate.module.min";

const args = process.argv.slice(2);
const version = JSON.parse(fs.readFileSync('./package.json', "utf8")).version;
const config = {
    username: "samlynch",
    gamename: "the-diagnosis-game",
    pathToButler: ""
};

async function main() {
    // ts-node thisscript ./a/path/to/directory
    // .\butler.exe push dist2.zip slynch2203/the-diagnosis-game:default
    // zip files
    // upload zip

    const directoryPath = args[0];
    const channelName = args[1];
    if(!directoryPath) throw new Error("Missing directory path argument!");
    if(!channelName) throw new Error("Missing channel name argument!");

    if(
        !fs.existsSync(directoryPath)
    ) {
        throw new Error("Directory path points to nothing!");
    }

    const filepath = __dirname + `/diagnosis-game-${version}.zip`;
    await new Promise<void>((res, rej) => {
        const output = fs.createWriteStream(filepath);
        const zipArchive = archiver('zip', {
            zlib: { level: 9 }
        });
        zipArchive.on('error', (err) => {
            rej(err);
        });
        zipArchive.on('close', () => {
            res();
        });
        zipArchive.on('end', () => {
            res();
        });
        zipArchive.pipe(output);

        zipArchive.directory(directoryPath, false);
        zipArchive.finalize();
    });

    if(!fs.existsSync(filepath)) {
        throw new Error("Something went wrong making the zip file!");
    }

    console.log("Created zip file successfully");

    // upload zip here
    const code = execSync(`butler push ${filepath} ${config.username}/${config.gamename}:${channelName}`);
    // console.log(code);
    return;
}

main()
    .catch((err) => console.error("Fatal error occurred: " + err?.toString()))
    .then(() => console.log("Closing"));

