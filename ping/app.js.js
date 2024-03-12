// Импорт библиотек
import ping from "ping";
import blessed from "blessed";
import contrib from "blessed-contrib";

// Создание экрана
const screen = blessed.screen();

// Создание таблицы с помощью grid системы blessed-contrib
const grid = new contrib.grid({ rows: 12, cols: 12, screen: screen });

const table = grid.set(0, 0, 12, 12, contrib.table, {
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: false,
    label: 'Ping Results',
    width: '100%',
    height: '100%',
    border: { type: "line", fg: "cyan" },
    columnSpacing: 10, // Межколоночный интервал
    columnWidth: [24, 15, 15, 8, 8, 8, 8, 8, 8] // Corrected: Ширина каждого столбца (added one more for the 9th column)
});


// Начальное заполнение таблицы
table.setData({
    headers: ['Name', 'IP', 'Status', 'Latency', 'Avg', 'Avg10', 'Avg100', 'Max', 'Min'],
    data: []
});

// Функция для асинхронного обновления данных в таблице
async function updatePingData() {
    const devices = [
        { name: "Умная розетка Tuya Smart Inc.", ip: "192.168.3.154" },
        { name: "TL-WR720N", ip: "192.168.3.46" },
        { name: "Робот-пылесос Dreame", ip: "192.168.3.163" },
        { name: "Камера GWIPC-6880065736", ip: "192.168.3.101" }
    ];

    let data = await Promise.all(devices.map(async device => {
        let res = await ping.promise.probe(device.ip, { timeout: 10 });
        let status = res.alive ? 'Alive' : 'Not reachable';
        let latency = res.time !== 'unknown' ? res.time.toString() : 'N/A';
        // Здесь должна быть логика расчёта статистики, пока заполняем заглушками
        let avg = 'N/A', avg10 = 'N/A', avg100 = 'N/A', max = 'N/A', min = 'N/A';

        return [device.name, device.ip, status, latency, avg, avg10, avg100, max, min];
    }));

    // Обновление данных таблицы и перерисовка экрана
    table.setData({
        headers: ['Name', 'IP', 'Status', 'Latency', 'Avg', 'Avg10', 'Avg100', 'Max', 'Min'],
        data
    });

    screen.render();
}

// Установка интервала для регулярного обновления данных
setInterval(updatePingData, 10000); // Обновляем каждые 10 секунд

// Первоначальное заполнение данных
updatePingData();

// Обработка выхода из приложения
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});
