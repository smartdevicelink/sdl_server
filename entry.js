require('dotenv').config();
const { spawn } = require('child_process');

let mainEnvs = {
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_HOST: process.env.DB_HOST,
    DB_DATABASE: process.env.DB_DATABASE,
    DB_PORT: process.env.DB_PORT,
}

main();
async function main () {
    let state = process.env.RUN_STATE;
    try {
        if (state === "startup") {
            await migrateUp('pg-policy');
            await startServer();
        } else if (state === "dev") {
            await migrateUp('pg-policy');
            await startDev();
        } else if (state === "reset") {
            await reset('pg-policy');
        } else if (state === "test") {
            await reset('pg-test');
            await migrateUp('pg-test');
            await test();
            await reset('pg-test');
        } else if (state === "migrate-up") {
            await migrateUp('pg-policy');
        }
    } catch (err) {
        console.error("Aborting command(s)");
    }
}

async function migrateUp (environment) {
    await executeCommand('db-migrate', ['up', '-e', environment], { env: mainEnvs });
}
async function reset (environment) {
    await executeCommand('db-migrate', ['reset', '-e', environment], { env: mainEnvs });
}
async function startServer () {
    await executeCommand('node', ['index.js'], { env: { ...process.env }});
}
async function startDev () {
    await executeCommand('./node_modules/.bin/vue-cli-service', ['serve'], { env: { ...process.env }});
}
async function test () {
    await executeCommand('mocha', [], { env: { ...process.env }});
}

async function executeCommand (cmd, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args);

        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', e => process.stdout.write(e));
        child.stderr.on('data', e => process.stdout.write(e));

        child.on('close', (code) => {
          if (code === 1) reject();
          if (code === 0) resolve();
        });
    });
}