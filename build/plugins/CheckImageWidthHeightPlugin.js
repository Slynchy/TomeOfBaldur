const fs = require("fs");
const path = require("path");
const sizeOf = require("image-size");

let verbose = false;
function log(_msg, _force) {
    if(_force || verbose)
        // eslint-disable-next-line no-undef
        console.log("[CheckImageWidthHeightPlugin] " + _msg);
}

// https://stackoverflow.com/questions/41462606/get-all-files-recursively-in-directories-nodejs
function ThroughDirectory(Directory, Files) {
    if(!Files) Files = [];
    fs.readdirSync(Directory).forEach(File => {
        const Absolute = path.join(Directory, File);
        if (fs.statSync(Absolute).isDirectory())
            return ThroughDirectory(Absolute, Files);
        else
            return Files.push(Absolute);
    });
    return Files;
}

class CheckImageWidthHeightPlugin {

    /**
     *
     * @param options
     * @param options.directory string
     * @param options.enabled boolean
     * @param options.throw boolean
     * @param options.verbose boolean
     */
    constructor(options) {
        if (!options)
            throw new Error("Must provide options!");

        this.directory = options.directory;
        this.enabled = options.enabled;
        this.throw = options.throw;
        // this.outputPath = options.outputPath;

        if (options.verbose) verbose = true;
    }

    execute(cb, force) {
        if(!this.enabled && !force) {
            log(`Skipping...`);
            if(cb) cb();
            return;
        }

        const stat = fs.statSync(this.directory);
        if(!stat.isDirectory()) {
            throw new Error(
                `${this.directory} is not a valid directory!`
            );
        }
        const files = ThroughDirectory(this.directory)
            .filter((e) => e.lastIndexOf(".png") === e.length - ".png".length);

        files.forEach((e, i) => {
            sizeOf(e, (err, dimensions) => {
                if(
                    dimensions.width > 4096 ||
                    dimensions.height > 4096
                ) {
                    const str = `${
                        e
                    } is too big! ${dimensions.width}x${dimensions.height}`;
                    if(this.throw) {
                        throw new Error(str);
                    } else {
                        console.warn(str);
                    }
                }
            });
            if(i === files.length - 1)
                if(cb) cb();
        });
    }

    apply(compiler) {
        log('Applying...');

        compiler.hooks.thisCompilation.tap(
            'CheckImageWidthHeightPlugin',
            (compilation, callback) => {
                this.execute();
            }
        );
    };
}

module.exports = CheckImageWidthHeightPlugin;
