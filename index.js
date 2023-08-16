#! /usr/bin/env node
const { prompt, Input, MultiSelect } = require('enquirer');
const chalk = require("chalk");
const fs = require('fs');
const path = require('path');
const os = require('os');
const figlet = require('figlet');
const cliProgress = require('cli-progress');
const download = require('download');
const got = require('got');

let config = require('./config.json');
if(config.path === "") {
    config.path = path.join(os.homedir(), "Pictures", "pointerpointer-dl");
    fs.writeFileSync("./config.json", JSON.stringify(config, null, 4));
}

const yargs = require('yargs');


let p = config.path;
let url = ""
let amount_max = 710;
let amount = config.amount;

if (yargs.argv.config) {
    prompt({
        name: "config",
        type: "select",
        message: "Select a config option...",
        choices: [
            { name: "path", message: "Defualt path for downloading images", hint: chalk.yellow.bold(p) },
            { name: "amount", message: `Default amount of images to download`, hint: `(defaults to the max: ${chalk.yellow.bold(amount)})` }
        ]
    }).then(answer => {
        answer = answer.config;
        if(answer === "path") {
            prompt({
                name: "path",
                type: "input",
                message: "Enter the path you want pointerpointer-dl to default to: ",
                initial: p
            }).then(answer => {
                let am = answer.path
                if(am != p) {
                    p = answer.path;
                    config.path = p;
                    fs.writeFileSync("./config.json", JSON.stringify(config, null, 4));
                }
                console.log(chalk.green(`Set default path to ${chalk.yellow.bold(p)}`));
            })
        } else if(answer === "amount") {
            prompt({
                name: "amount",
                type: "input",
                message: "Enter the amount of images you want pointerpointer-dl to default to: ",
                initial: 710
            }).then(answer => {
                let am = answer.amount
                if(am != amount) {
                    am = Number(am);
                    if(am > 710) {
                        console.log(chalk.red(`The amount can't be more than ${chalk.yellow.bold(amount)}, setting it to ${chalk.greenBright.bold(amount)}`));
                        amount = 710;
                    } else {
                        amount = am;
                    }
                } else {
                    amount = 710;
                }
                config.amount = amount;
                fs.writeFileSync("./config.json", JSON.stringify(config, null, 4));
                console.log(chalk.hex("#61ff6e").bold(`Set default amount to ${chalk.yellow.bold(amount)}`));
            })
        }
    }).catch(console.error);
}

const path_to = new Input({
    message: 'Where do you want to download the images? ',
    initial: p
})

console.log(chalk.hex("#ff3dd2").bold(figlet.textSync('PointerPointer-DL', { horizontalLayout: 'full' })));

let prompts = [
    {
        name: "path",
        type: "input",
        message: chalk.hex("#ff3dd2").bold("Where do you want to download the images? "),
        initial: p,
        validate: (value) => {
            if(value.length) {
                return true;
            } else {
                return chalk.hex("#ff6161").bold("You must enter a path");
            }
        }
    },
    {
        name: "amount",
        type: "input",
        message: chalk.hex("#ff3dd2").bold("How many images do you want to download? "),
        initial: amount,
        validate: (value) => {
            if(value.length) {
                return true;
            } else {
                return chalk.hex("#ff6161").bold("You must enter an amount");
            }
        }
    }
]

prompt(prompts).then(answer => {
    if(answer.path.length){
        p = answer.path;
    } else {
        p = path.join(__dirname, "pointerpointer-dl");
    }
    if(answer.path === "./" || answer.path === ".") {
        p = path.join(__dirname, "pointerpointer-dl");
    } else if(answer.path.startsWith("..")) {
        let p_split = p.split(path.sep);
        p = p_split.join(path.sep);
        if(p === "..") {
            p = path.join(__dirname, "pointerpointer-dl");
        } else {
            if(fs.existsSync(p)) {
                p = path.join(p, "pointerpointer-dl")
            } else {
                fs.mkdirSync(p, { recursive: true })
                if(fs.existsSync(p)) {
                    console.log(chalk.hex("#61ff6e").bold(`Created ${chalk.yellow.bold(p.split(/\/|\\/g).pop())} in ${chalk.green.bold(path.join(__dirname, p.split(/\/|\\/g).slice(0, -1).join(path.sep)))}`));
                }
            }
        }
    }
    if(!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
    }
    if(answer.amount) {
        if(answer.amount > amount_max) {
            console.log(chalk.red(`The amount can't be more than ${chalk.yellow.bold(amount_max)}, setting it to ${chalk.greenBright.bold(amount_max)}`));
            amount = amount_max;
        } else {
            amount = answer.amount;
        }
    } else {
        amount = amount_max;
    }
    amount = ++amount;
    let progress
    let downloaded = [];
    let progress_bar = new cliProgress.SingleBar({
        format: chalk.hex("#ff3dd2").bold('Downloading ') + chalk.hex("#ff3dd2").bgHex("#f896ff").bold('{bar}') + ` | ${chalk.hex('#ff3dd2').bold("Elapsed")}: ${chalk.hex("#f896ff").bold('{duration}')}s || ${chalk.hex('#ff3dd2').bold("ETA")}: ${chalk.hex("#f896ff").bold("{eta}")}s || ${chalk.hex('#f896ff').bold("{percentage}")}% || ${chalk.hex('#f896ff').bold("{value}")}/${chalk.hex('#ff3dd2').bold("{total}")} `,
        hideCursor: true,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591'
    }, cliProgress.Presets.shades_classic);
    progress_bar.start(amount - 1, 0);
    for (let i = 0; i < amount; i++) {
        console.log(fs.statSync(path.join(p, `${i}.jpg`)).size);
        if(fs.existsSync(path.join(p, `${i}.jpg`)) && fs.statSync(path.join(p, `${i}.jpg`)).size === 0) {
            console.log("ass");
            fs.rmSync(path.join(p, `${i}.jpg`));
        }
        if(!fs.existsSync(path.join(p, `${i}.jpg`))) {
            let filename = path.basename(url);
            download(url).pipe(fs.createWriteStream(path.join(p, filename))).on('finish', () => {
                downloaded.push(filename);
                progress_bar.update(downloaded.length);
                progress = Math.round((downloaded.length / amount) * 100);
                // console.log(progress);
                if(progress === 98) {
                    progress_bar.stop();
                    console.log(chalk.hex("#61ff6e").bold(`Downloaded ${chalk.yellow.bold(amount - 1)} images to ${chalk.hex("#61ff6e").bold(p)}`));
                }
            })
        }
    }
})