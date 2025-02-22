import { exec } from "child_process";
import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Получаем __dirname в ES-модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Функция выполнения команд с UTF-8
function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(`chcp 65001 >nul && ${command}`, { encoding: "utf8" }, (error, stdout, stderr) => {
            if (error) return reject(error);
            if (stderr) return reject(stderr);
            resolve(stdout.trim());
        });
    });
}

// Функция очистки строк от артефактов
function cleanString(str) {
    return str.replace(/\r/g, "").trim();
}

// Получение имени ПК
async function getComputerName() {
    return runCommand("wmic computersystem get Name /format:list")
        .then((output) => cleanString(output.split("=")[1]))
        .catch(() => "UnknownPC");
}

// Получение модели материнской платы
async function getMotherboardModel() {
    return runCommand("wmic baseboard get Product /format:list")
        .then((output) => cleanString(output.split("=")[1]))
        .catch(() => "UnknownBoard");
}

// Получение списка процессов
async function getProcesses() {
    const command = `wmic process get Name,ExecutablePath /format:csv`;
    const output = await runCommand(command);

    return output
        .split("\n")
        .slice(1)
        .map((line) => {
            const parts = line.split(",");
            if (parts.length < 3) return null;
            return { name: cleanString(parts[1]), path: cleanString(parts[2]) };
        })
        .filter(Boolean);
}

// Получение списка служб
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

// Основная функция
(async () => {
    try {
        const computerName = await getComputerName();
        const motherboard = await getMotherboardModel();
        const filenamePrefix = `${computerName}_${motherboard}`.replace(/\s+/g, "_");

        const processes = await getProcesses();
        const services = await getServices();

        await writeFile(
            path.join(__dirname, `${filenamePrefix}.process`),
            JSON.stringify(processes, null, 2),
            "utf8"
        );

        await writeFile(
            path.join(__dirname, `${filenamePrefix}.services`),
            JSON.stringify(services, null, 2),
            "utf8"
        );

        console.log("Файлы успешно созданы:");
        console.log(`- ${filenamePrefix}.process`);
        console.log(`- ${filenamePrefix}.services`);
    } catch (error) {
        console.error("Ошибка:", error);
    }
})();
