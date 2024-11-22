window.addEventListener('DOMContentLoaded', function() { // Počkejte, dokud se DOM plně nenačte
    console.log('Script loaded and DOM content is ready'); // Záznam do konzole, že skript byl načten a DOM je připraven

    let currentDate = new Date(); // Inicializace proměnné pro aktuální datum
    currentDate.setHours(0, 0, 0, 0); // Nastavení času na půlnoc pro porovnání
    let chart; // Deklarace proměnné pro graf
    let datesWithRecords = []; // Pole pro data se záznamy
    let allDatesInRange = []; // Pole pro všechny datumy v rozsahu
    let firstRecordDate; // První datum se záznamem
    let lastRecordDate; // Poslední datum se záznamem

    loadAllDatesWithRecords().then(() => { // Načtení všech datumů se záznamy
        updateButtons(); // Aktualizace stavu tlačítek
        loadChartData(currentDate); // Načtení dat grafu pro aktuální datum
    });

    document.getElementById('prevDate').addEventListener('click', function() { // Přidání posluchače události kliknutí na tlačítko předchozího dne
        moveDate(-1); // Posun na předchozí den
    });

    document.getElementById('nextDate').addEventListener('click', function() { // Přidání posluchače události kliknutí na tlačítko následujícího dne
        moveDate(1); // Posun na následující den
    });

    const datepicker = flatpickr("#graphDate", { // Inicializace kalendáře pomocí flatpickr
        defaultDate: currentDate, // Nastavení výchozího data na aktuální datum
        onChange: function(selectedDates) { // Při změně data
            currentDate = selectedDates[0]; // Aktualizace aktuálního data
            updateButtons(); // Aktualizace stavu tlačítek
            loadChartData(currentDate); // Načtení dat grafu pro vybrané datum
        },
        onDayCreate: function(dObj, dStr, fp, dayElem) { // Při vytváření dne v kalendáři
            const dateStr = new Date(dayElem.dateObj); // Převedení na datum
            dateStr.setDate(dateStr.getDate() + 1); // Posun o jeden den zpět
            const isoDateStr = dateStr.toISOString().split('T')[0]; // Získání ISO řetězce data

            if (datesWithRecords.includes(isoDateStr)) { // Pokud datum obsahuje záznamy
                dayElem.classList.add('has-records'); // Přidání třídy has-records
            } else if (dateStr >= firstRecordDate && dateStr <= lastRecordDate) { // Pokud je datum v rozsahu
                dayElem.classList.add('in-range'); // Přidání třídy in-range
            }
        }
    });

    async function loadAllDatesWithRecords() { // Asynchronní funkce pro načtení všech datumů se záznamy
        const filename = '/plc_data.csv'; // Název souboru
        const response = await fetch(filename); // Načtení souboru
        const csvText = await response.text(); // Převedení odpovědi na text
        const data = d3.csvParse(csvText); // Parsování CSV dat pomocí d3

        const uniqueDates = new Set(); // Množina pro unikátní datumy
        data.forEach(entry => { // Pro každý záznam
            let date = new Date(entry.timestamp); // Převedení timestampu na datum
            const dateStr = date.toISOString().split('T')[0]; // Získání ISO řetězce data
            uniqueDates.add(dateStr); // Přidání data do množiny
        });

        datesWithRecords = Array.from(uniqueDates).sort(); // Převedení množiny na pole a seřazení
        console.log('Dates with records:', datesWithRecords); // Záznam do konzole

        // Určení prvního a posledního data se záznamem
        firstRecordDate = new Date(datesWithRecords[0]); // První datum se záznamem
        lastRecordDate = new Date(datesWithRecords[datesWithRecords.length - 1]); // Poslední datum se záznamem

        // Vytvoření všech datumů v rozsahu
        let date = new Date(firstRecordDate); // Počáteční datum
        while (date <= lastRecordDate) { // Dokud je datum v rozsahu
            allDatesInRange.push(date.toISOString().split('T')[0]); // Přidání data do pole
            date.setDate(date.getDate() + 1); // Posun na další den
        }

        // Aktualizace kalendáře flatpickr pro zobrazení datumů se záznamy
        datepicker.redraw(); // Překreslení kalendáře

        // Inicializace currentDate v platném rozsahu
        if (currentDate < firstRecordDate) { // Pokud je aktuální datum před prvním záznamem
            currentDate = new Date(firstRecordDate); // Nastavení na první datum
        }
        if (currentDate > lastRecordDate) { // Pokud je aktuální datum po posledním záznamu
            currentDate = new Date(lastRecordDate); // Nastavení na poslední datum
        }
    }

    function moveDate(direction) { // Funkce pro posun data
        const currentDateStr = currentDate.toISOString().split('T')[0]; // Aktuální datum jako řetězec
        const currentIndex = allDatesInRange.indexOf(currentDateStr); // Index aktuálního data v poli všech datumů
        if (currentIndex !== -1) { // Pokud je datum nalezeno
            const newIndex = currentIndex + direction; // Nový index pro posun
            if (newIndex >= 0 && newIndex < allDatesInRange.length) { // Pokud je nový index v rozsahu
                currentDate = new Date(allDatesInRange[newIndex]); // Aktualizace aktuálního data
                updateButtons(); // Aktualizace stavu tlačítek
                loadChartData(currentDate); // Načtení dat grafu pro nové datum
            }
        }
    }

    const graphDateElement = document.getElementById('graphDate'); // Element pro datum grafu
    graphDateElement.style.border = 'none'; // Bez okraje
    graphDateElement.style.background = 'none'; // Bez pozadí
    graphDateElement.style.fontSize = '25px'; // Velikost písma
    graphDateElement.style.color = 'black'; // Barva textu
    graphDateElement.style.textAlign = 'center'; // Zarovnání textu na střed
    graphDateElement.style.cursor = 'pointer'; // Styl kurzoru
    graphDateElement.style.outline = 'none'; // Bez obrysu
    graphDateElement.style.width = '40%'; // Šířka elementu
    graphDateElement.style.display = 'inline-block'; // Inline-blok zobrazení

    function updateButtons() { // Funkce pro aktualizaci stavu tlačítek
        const nextButton = document.getElementById('nextDate'); // Tlačítko následujícího dne
        const prevButton = document.getElementById('prevDate'); // Tlačítko předchozího dne
        const currentDateStr = currentDate.toISOString().split('T')[0]; // Aktuální datum jako řetězec
        const currentIndex = allDatesInRange.indexOf(currentDateStr); // Index aktuálního data v poli všech datumů
        nextButton.disabled = currentIndex === -1 || currentIndex >= allDatesInRange.length - 1; // Deaktivace tlačítka, pokud je na posledním datu
        prevButton.disabled = currentIndex <= 0; // Deaktivace tlačítka, pokud je na prvním datu
        document.getElementById('graphDate').value = `Datum: ${currentDate.toLocaleDateString()}`; // Aktualizace zobrazení data
    }

    function loadChartData(date) { // Funkce pro načtení dat grafu pro dané datum
        const filename = '/plc_data.csv'; // Název souboru
        console.log('Attempting to load file:', filename); // Záznam pokusu o načtení souboru do konzole

        fetch(filename) // Načtení souboru
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText); // Vyhození chyby, pokud odpověď není v pořádku
                }
                return response.text(); // Převedení odpovědi na text
            })
            .then(csvText => {
                const data = d3.csvParse(csvText); // Parsování CSV dat pomocí d3
                const filteredData = data.filter(entry => { // Filtrování dat pro dané datum
                    const entryDate = new Date(entry.timestamp); // Převedení timestampu na datum
                    entryDate.setHours(0, 0, 0, 0); // Nastavení času na půlnoc pro porovnání
                    const targetDate = new Date(date); // Cílové datum
                    targetDate.setHours(0, 0, 0, 0); // Nastavení času na půlnoc pro porovnání
                    return entryDate.getTime() === targetDate.getTime(); // Porovnání datumů
                });

                updateChart(filteredData, date); // Aktualizace grafu s filtrovnými daty
            })
            .catch(error => {
                console.error('Error loading or parsing CSV file:', error); // Záznam chyby při načítání nebo parsování CSV souboru
                alert(`Error loading file: ${filename}`); // Zobrazení upozornění na chybu při načítání souboru
            });
    }

    function updateChart(data, date) { // Funkce pro aktualizaci grafu s novými daty
        if (!data || data.length === 0) { // Pokud nejsou data nebo je dat málo
            document.getElementById('graphDate').value = `Datum: ${date.toLocaleDateString()} (žádná data)`; // Aktualizace zobrazení data na žádná data
            if (chart) {
                chart.destroy(); // Zničení grafu, pokud existuje
            }
            return;
        }

        const dateString = date.toLocaleDateString(); // Převedení data na řetězec
        document.getElementById('graphDate').value = `Datum: ${dateString}`; // Aktualizace zobrazení data

        const timeInHours = data.map(entry => { // Mapa času v hodinách
            const timestamp = new Date(entry.timestamp); // Převedení timestampu na datum
            const hours = timestamp.getHours() + timestamp.getMinutes() / 60 + timestamp.getSeconds() / 3600; // Přepočet času na hodiny
            return hours;
        });

        const procIntValues = data.map(entry => parseInt(entry.procInt)); // Mapa hodnot procInt
        const myIntValues = data.map(entry => entry.myInt); // Mapa hodnot myInt
        const motorRunValues = data.map(entry => entry.MOTOR_RUN1.trim().toLowerCase() === 'true'); // Mapa hodnot MOTOR_RUN
        const pointColors = motorRunValues.map(value => value ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)'); // Mapa barev bodů na základě hodnoty MOTOR_RUN

        const canvas = document.getElementById('historyChart'); // Element pro canvas grafu
        const ctx = canvas.getContext('2d'); // Kontext 2D grafu

        if (chart) {
            chart.destroy(); // Zničení grafu, pokud existuje
        }

        chart = new Chart(ctx, { // Vytvoření nového grafu
            type: 'line', // Typ grafu je čára
            data: {
                labels: timeInHours, // Štítky osy x jsou čas v hodinách
                datasets: [{
                    label: 'ProcInt', // Popisek datové sady
                    data: procIntValues, // Data grafu
                    borderColor: 'rgba(0, 123, 255, 1)', // Barva okraje
                    backgroundColor: 'rgba(0, 123, 255, 1)', // Barva pozadí
                    borderWidth: 1, // Šířka okraje
                    pointBackgroundColor: pointColors, // Barva pozadí bodů
                    pointBorderColor: pointColors, // Barva okraje bodů
                    fill: false, // Nevyplňovat pod grafem
                    pointRadius: 5 // Poloměr bodů
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'linear', // Typ osy x je lineární
                        title: {
                            display: true,
                            text: 'Čas (hodiny)' // Popisek osy x
                        },
                        min: 0,
                        max: 24, // Rozsah osy x je od 0 do 24 hodin
                        ticks: {
                            stepSize: 1, // Krok štítků je 1 hodina
                            callback: function(value) {
                                return value + ':00'; // Zobrazení štítků v hodinách
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Hodnota procInt' // Popisek osy y
                        },
                        min: 0,
                        max: 100 // Rozsah osy y je od 0 do 100
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) { // Funkce pro zobrazení názvu v tooltipu
                                const hours = Math.floor(context[0].parsed.x); // Hodiny
                                const minutes = Math.floor((context[0].parsed.x - hours) * 60); // Minuty
                                return `Čas: ${hours}:${minutes.toString().padStart(2, '0')} hodin`; // Zobrazení času v tooltipu
                            },
                            label: function(context) { // Funkce pro zobrazení popisku v tooltipu
                                let label = `ProcInt: ${context.parsed.y}`; // Hodnota procInt
                                let myIntLabel = `myInt: ${myIntValues[context.dataIndex]}`; // Hodnota myInt
                                let motorRunLabel = `MOTOR_RUN: ${motorRunValues[context.dataIndex] ? 'True' : 'False'}`; // Hodnota MOTOR_RUN
                                return [label, myIntLabel, motorRunLabel]; // Návrat pole popisků
                            }
                        }
                    }
                }
            }
        });
    }
});
