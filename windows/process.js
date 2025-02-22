import { exec } from "child_process";
import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import iconv from "iconv-lite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(`cmd.exe /C ${command}`, { encoding: "buffer" }, (error, stdout, stderr) => {
            if (error) return reject(error);
            if (stderr.length > 0) return reject(stderr);
            resolve(iconv.decode(stdout, "cp866").trim());
        });
    });
}

function cleanString(str) {
    return str ? str.replace(/\r/g, "").trim() : "";
}

async function getProcesses() {
    const command = `wmic process get Name,ProcessId,ThreadCount,CreationDate,ExecutablePath,CommandLine,WorkingSetSize /format:csv`;
    const output = await runCommand(command);

    return output
        .split("\n")
        .slice(1)
        .map((line) => {
            const parts = line.split(",");
            if (parts.length < 7) return null;

            const pid = parseInt(parts[2], 10);
            const threads = parseInt(parts[3], 10);
            const memoryUsage = parseInt(parts[7], 10);

            return {
                name: cleanString(parts[1]) || "Unknown",
                pid: Number.isFinite(pid) && pid > 0 && pid < 999999 ? pid : "Invalid",
                threads: Number.isFinite(threads) && threads > 0 && threads < 10000 ? threads : "Invalid",
                startTime: cleanString(parts[4]) || "Unknown",
                path: cleanString(parts[5]) || "Unknown",
                commandLine: cleanString(parts[6]) || "Unknown",
                memoryUsage: Number.isFinite(memoryUsage) && memoryUsage > 0 && memoryUsage < 100000000
                    ? (memoryUsage / 1024).toFixed(2) + " KB"
                    : "Invalid"
            };
        })
        .filter(Boolean);
}

async function getServices() {
    const command = `wmic service get Name,DisplayName,State,StartMode /format:csv`;
    const output = await runCommand(command);

    return output
        .split("\n")
        .slice(1)
        .map((line) => {
            const parts = line.split(",");
            if (parts.length < 5) return null;
            return {
                name: cleanString(parts[1]),
                displayName: cleanString(parts[2]),
                state: cleanString(parts[3]),
                startMode: cleanString(parts[4]),
            };
        })
        .filter(Boolean);
}

(async () => {
    try {
        const computerName = await runCommand("wmic computersystem get Name /format:list")
            .then((output) => cleanString(output.split("=")[1] || "UnknownPC"))
            .catch(() => "UnknownPC");

        const motherboard = await runCommand("wmic baseboard get Product /format:list")
            .then((output) => cleanString(output.split("=")[1] || "UnknownBoard"))
            .catch(() => "UnknownBoard");

        const filenamePrefix = `${computerName}_${motherboard}`.replace(/\s+/g, "_");

        const processes = await getProcesses();
        const services = await getServices();

        await writeFile(
            path.join(__dirname, `${filenamePrefix}.process.json`),
            JSON.stringify(processes, null, 2),
            "utf8"
        );

        await writeFile(
            path.join(__dirname, `${filenamePrefix}.services.json`),
            JSON.stringify(services, null, 2),
            "utf8"
        );

        console.log("Файлы успешно созданы:");
        console.log(`- ${filenamePrefix}.process.json`);
        console.log(`- ${filenamePrefix}.services.json`);
    } catch (error) {
        console.error("Ошибка:", error);
    }
})();
