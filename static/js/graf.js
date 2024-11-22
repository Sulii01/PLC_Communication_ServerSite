document.addEventListener('DOMContentLoaded', function() { // Počkejte, dokud se DOM plně nenačte
    console.log('Script loaded'); // Záznam do konzole, že skript byl načten

    const baseUrl = window.location.origin; // Sestavení základní URL pro API požadavky

    const procIntData = []; // Pole pro uložení datových bodů
    const timeLabels = Array.from({ length: 21 }, (_, i) => i); // Vytvoření štítků od 0 do 20 minut
    let fetchCounter = 0; // Počítadlo pro sledování, kolikrát byla data načtena

    async function fetchProcInt() { // Funkce pro načítání procInt dat ze serveru
        try {
            const response = await fetch(`${baseUrl}/get_data`); // Načítání dat ze serveru
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`); // Vyhození chyby, pokud odpověď není v pořádku
            }
            const data = await response.json(); // Parsování JSON dat z odpovědi
            document.getElementById('procIntDisplay').innerText = data.procInt; // Aktualizace zobrazené hodnoty procInt

            // Aktualizace dat grafu
            if (procIntData.length >= 240) { // 20 minut * 60 sekund / 5 sekundový interval = 240 bodů
                procIntData.shift(); // Odstranění prvního elementu, pokud je více než 240 elementů
            }
            procIntData.push(data.procInt); // Přidání nové hodnoty procInt

            procIntChart.update(); // Aktualizace grafu

            fetchCounter++; // Zvýšení počítadla načítání
            if (fetchCounter % 3 === 0) { // Záznam dat každé třetí načtení
                console.log('Fetched data:', data); // Záznam načtených dat do konzole
            }

            return data; // Vrácení načtených dat
        } catch (error) {
            console.error('Error fetching data:', error); // Záznam jakýchkoliv chyb při načítání
        }
    }

    function startRefresh() { // Funkce pro spuštění periodického načítání dat
        setInterval(fetchProcInt, 1000); // Načítání dat každou sekundu
    }

    startRefresh(); // Spuštění periodického načítání dat

    // Inicializace grafu
    const ctx = document.getElementById('procIntChart').getContext('2d'); // Získání kontextu 2D grafu
    const procIntChart = new Chart(ctx, { // Vytvoření nového grafu
        type: 'line', // Typ grafu je čára
        data: {
            labels: Array.from({ length: 240 }, (_, i) => (i * 5) / 60), // Vytvoření štítků od 0 do 20 minut v 5 sekundových intervalech
            datasets: [{
                label: 'ProcInt', // Popisek datové sady
                data: procIntData, // Data grafu
                backgroundColor: 'rgba(0, 123, 255, 1)', // Barva pozadí
                borderWidth: 1, // Šířka okraje
                fill: false // Nevyplňovat pod grafem
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Čas (minuty)' // Popisek osy x
                    },
                    ticks: {
                        callback: function(value, index, values) { // Funkce pro zobrazení štítků osy x
                            if (index % 12 === 0) { // Zobrazit štítek každých 60 sekund (12 * 5 sekund)
                                return (index * 5 / 60).toFixed(0); // Zobrazit štítky v minutách
                            }
                        },
                        autoSkip: false, // Zajistit, aby všechny štítky byly zobrazeny
                        maxRotation: 0, // Nastavit štítky rovně
                        minRotation: 0 // Nastavit štítky rovně
                    },
                    min: 0,
                    max: 240 // Zajistit, aby rozsah osy x byl pevně stanoven od 0 do 20 minut (240 * 5 sekundových intervalů)
                },
                y: {
                    title: {
                        display: true,
                        text: 'Vzorek' // Popisek osy y
                    },
                    min: 0,
                    max: 100 // Zajistit, aby rozsah osy y byl pevně stanoven od 0 do 1000
                }
            }
        }
    });

    function updateChart(newValue) { // Funkce pro aktualizaci grafu s novou hodnotou
        const currentTime = new Date(); // Získání aktuálního času
        procIntChart.data.datasets[0].data.push(newValue); // Přidání nové hodnoty do dat grafu

        if (procIntChart.data.datasets[0].data.length > 240) { // Udržení posledních 240 bodů
            procIntChart.data.datasets[0].data.shift(); // Odstranění prvního bodu, pokud je více než 240 bodů
        }

        procIntChart.update(); // Aktualizace grafu
    }
});
