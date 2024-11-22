document.addEventListener('DOMContentLoaded', async function() { // Počkejte, dokud se DOM plně nenačte
    console.log('Script loaded'); // Záznam do konzole, že skript byl načten

    const baseUrl = window.location.origin; // Získání základní URL
    let grafValueData = []; // Inicializace prázdného pole pro data grafu
    const timeLabels = Array.from({ length: 200 }, (_, i) => i); // Vytvoření štítků od 0 do 199

    let yAxisMin; // Minimální hodnota osy y
    let yAxisMax; // Maximální hodnota osy y

    async function fetchConfig() { // Asynchronní funkce pro načtení konfigurace grafu
        try {
            const response = await fetch(`${baseUrl}/get_graf_config`); // Načtení konfigurace ze serveru
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`); // Vyhození chyby, pokud odpověď není v pořádku
            }
            const config = await response.json(); // Parsování JSON dat z odpovědi
            yAxisMin = config.GRAF_ROZSAH_MIN; // Nastavení minimální hodnoty osy y
            yAxisMax = config.GRAF_ROZSAH_MAX; // Nastavení maximální hodnoty osy y
        } catch (error) {
            console.error('Error fetching config:', error); // Záznam chyby při načítání konfigurace
        }
    }

    async function fetchGrafValue() { // Asynchronní funkce pro načtení hodnot grafu ze serveru
        try {
            const response = await fetch(`${baseUrl}/get_grafValue_data`); // Načtení dat ze serveru
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`); // Vyhození chyby, pokud odpověď není v pořádku
            }
            const data = await response.json(); // Parsování JSON dat z odpovědi
            const grafValueValues = data.grafValue; // Načtení hodnot grafu
            console.log('Data loaded'); // Zpráva o načtení dat

            return grafValueValues; // Vrácení načtených hodnot
        } catch (error) {
            console.error('Error fetching data:', error); // Záznam chyby při načítání dat
            return []; // Vrácení prázdného pole při chybě
        }
    }

    async function updateChart() { // Asynchronní funkce pro aktualizaci grafu
        const newValues = await fetchGrafValue(); // Načtení nových hodnot
        if (newValues.length > 0) { // Pokud jsou nové hodnoty k dispozici
            grafValueData = newValues; // Aktualizace dat grafu
            grafValueChart.data.datasets[0].data = grafValueData; // Nastavení nových dat do grafu
            grafValueChart.options.scales.y.min = yAxisMin; // Aktualizace minimální hodnoty osy y
            grafValueChart.options.scales.y.max = yAxisMax; // Aktualizace maximální hodnoty osy y
            grafValueChart.update(); // Aktualizace grafu
        }
    }

    async function startRefresh() { // Asynchronní funkce pro spuštění periodické aktualizace
        await fetchConfig(); // Načtení konfigurace před inicializací grafu
        await updateChart(); // Okamžitá aktualizace grafu po načtení konfigurace
        setInterval(updateChart, 5000); // Aktualizace každých 5 sekund
    }

    await fetchConfig(); // Načtení konfigurace před inicializací grafu

    const ctx = document.getElementById('grafValueChart').getContext('2d'); // Získání kontextu 2D grafu
    const grafValueChart = new Chart(ctx, { // Vytvoření nového grafu
        type: 'line', // Typ grafu je čára
        data: {
            labels: timeLabels, // Štítky osy x
            datasets: [{
                label: 'grafValue', // Popisek datové sady
                data: grafValueData, // Data grafu
                backgroundColor: 'rgba(0, 123, 255, 1)', // Barva pozadí
                borderWidth: 1, // Šířka okraje
                fill: false // Nevyplňovat pod grafem
            }]
        },
        options: {
            animation: false, // Bez animace při aktualizaci
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Čas (hodnoty)' // Popisek osy x
                    },
                    min: 0,
                    max: 100 // Rozsah osy x je od 0 do 100
                },
                y: {
                    title: {
                        display: true,
                        text: 'Vzorek' // Popisek osy y
                    },
                    min: yAxisMin, // Minimální hodnota osy y
                    max: yAxisMax // Maximální hodnota osy y
                }
            }
        }
    });

    startRefresh(); // Spuštění periodické aktualizace grafu
});
