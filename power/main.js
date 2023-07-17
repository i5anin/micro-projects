// Загрузка данных из файла JSON
fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    // Исходные данные
    var data = data;

    // Расчет среднего изменения потребления электроэнергии
    var totalChange = 0;
    for (var i = 1; i < data.length; i++) {
      totalChange += data[i].y - data[i - 1].y;
    }
    var averageChange = totalChange / (data.length - 1);

    // Генерация прогнозируемых данных
    var predictedData = [];
    var lastDataPoint = data[data.length - 1];
    var lastDate = luxon.DateTime.local().plus({ days: 1 }); // Начните с завтрашнего дня
    var lastPower = lastDataPoint.y;
    var daysInMonth = lastDate.daysInMonth;
    for (var i = lastDate.day; i <= daysInMonth; i++) {
      var nextDate = lastDate.set({ day: i });
      var nextPower = lastPower + averageChange;
      predictedData.push({ x: nextDate.toISO(), y: nextPower });
      lastPower = nextPower; // Обновление lastPower для следующей итерации
    }

    let expectedEnd = predictedData[predictedData.length - 1].y;

    // Конфигурация графика
    var ctx = document.getElementById("powerChart").getContext("2d");
    var chart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Потребляемая мощность",
            data: data,
            borderColor: "#ff5c77", // красный
            fill: false
          },
          {
            label: "Прогнозируемая потребляемая мощность",
            data: predictedData,
            borderColor: "#2cbdd4", // синий
            fill: false,
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        scales: {
          x: {
            type: "time",
            time: {
              tooltipFormat: "yyyy-MM-dd HH:mm",
              displayFormats: {
                hour: "HH:mm",
                day: "MMM dd"
              }
            },
            title: {
              display: true,
              text: "Дата"
            }
          },
          y: {
            title: {
              display: true,
              text: "Мощность (кВт)"
            }
          }
        }
      }
    });

    // Обработка отправки формы
    document.addEventListener("submit", function (event) {
      event.preventDefault();
      var powerInput = document.getElementById("powerInput");
      var power = parseFloat(powerInput.value);
      if (!isNaN(power)) {
        var now = luxon.DateTime.local();
        data.push({ x: now.toISO(), y: power });
        chart.update();

        // Обновление файла data.json с помощью API GitHub
        var jsonData = JSON.stringify(data, null, 2);
        updateDataFile(jsonData);

        powerInput.value = "";

        // Обновление средних значений энергопотребления
        updateAveragePowerConsumption(data);
      }
    });

    // Рассчитать и отобразить исходные средние значения энергопотребления
    updateAveragePowerConsumption(data);

    function updateAveragePowerConsumption(data) {
      // Calculate the average power consumption during the day, night, and over 24 hours
      var dayPower = 0;
      var nightPower = 0;
      var dayCount = 0;
      var nightCount = 0;
      for (var i = 0; i < data.length; i++) {
        var date = luxon.DateTime.fromISO(data[i].x);
        if (date.hour >= 6 && date.hour < 18) {
          dayPower += data[i].y;
          dayCount++;
        } else {
          nightPower += data[i].y;
          nightCount++;
        }
      }

      const rate = 5.6; // тариф за электроэнергию в рублях за киловатт-час

      const averageDayPower =
        dayCount > 0 ? (dayPower / dayCount).toFixed(2) : 0;
      document.getElementById("averageDayPower").textContent = averageDayPower;
      const averageDayPowerCost = (averageDayPower * rate).toFixed(2);
      document.querySelector("#averageDayPower + td span").textContent =
        averageDayPowerCost;
      const expectedEnd = predictedData[predictedData.length - 1].y;
      const expectedEndCost = (expectedEnd * rate).toFixed(2);
      document.getElementById("expectedEnd").textContent = expectedEnd;
      //цена в руб
      document.querySelector("#expectedEnd + td span").textContent =
        expectedEndCost;
    }
  })
  .catch((error) => console.error(error));
