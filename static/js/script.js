document.addEventListener('DOMContentLoaded', function() { // Počkejte, dokud se DOM plně nenačte
    console.log('Script loaded'); // Záznam do konzole, že skript byl načten

    let previousIndicatorState = null; // Proměnná pro uložení předchozího stavu indikátoru
    let fetchCounter = 0; // Počítadlo pro sledování, kolikrát byla data načtena

    const baseUrl = window.location.origin; // Sestavení základní URL pro API požadavky

    function updateStatusIndicator(isRunning) { // Funkce pro aktualizaci barvy indikátoru stavu na základě stavu motoru
        const statusIndicator = document.getElementById('statusIndicator'); // Získání elementu indikátoru stavu
        const currentState = isRunning ? 'green' : 'red'; // Určení aktuální barvy stavu
        if (previousIndicatorState !== currentState) { // Pokud se aktuální stav liší od předchozího stavu
            statusIndicator.style.backgroundColor = currentState; // Aktualizace barvy indikátoru stavu
            console.log(`Indicator set to ${currentState}`); // Záznam změny do konzole
            previousIndicatorState = currentState; // Aktualizace předchozího stavu
        }
    }

    async function fetchData() { // Funkce pro načítání dat ze serveru
        try {
            const response = await fetch(`${baseUrl}/get_data`); // Načítání dat ze serveru
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`); // Vyhození chyby, pokud odpověď není v pořádku
            }
            const data = await response.json(); // Parsování JSON dat z odpovědi
            document.getElementById('procIntDisplay').innerText = data.procInt; // Aktualizace zobrazené hodnoty procInt
            document.getElementById('myIntDisplay').innerText = data.myInt; // Aktualizace zobrazené hodnoty myInt
            updateStatusIndicator(data.MOTOR_RUN1); // Aktualizace indikátoru stavu na základě hodnoty MOTOR_RUN

            fetchCounter++; // Zvýšení počítadla načítání
            if (fetchCounter % 3 === 0) { // Záznam dat každé třetí načtení
                console.log('Fetched data:', data); // Záznam načtených dat do konzole
            }

            return data; // Vrácení načtených dat
        } catch (error) {
            console.error('Error fetching data:', error); // Záznam jakýchkoliv chyb při načítání
        }
    }

    async function updatePLC(value, start = null, stop = null) { // Funkce pro aktualizaci PLC hodnot na serveru
        try {
            const response = await fetch(`${baseUrl}/update_plc`, { // Odeslání POST požadavku pro aktualizaci PLC hodnot
                method: 'POST', // Použití metody POST
                headers: {
                    'Content-Type': 'application/json', // Specifikace JSON typu obsahu
                },
                body: JSON.stringify({ myInt: value, START1: start, STOP1: stop }), // Odeslání PLC hodnot jako JSON
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`); // Vyhození chyby, pokud odpověď není v pořádku
            }
            const data = await response.json(); // Parsování JSON dat z odpovědi
            console.log('PLC updated:', data); // Záznam aktualizovaných PLC dat do konzole
            if (data.START !== null || data.STOP1 !== null) { // Pokud jsou hodnoty START nebo STOP aktualizovány
                updateStatusIndicator(data.START1 === 1); // Aktualizace indikátoru stavu na základě hodnoty START
            }
        } catch (error) {
            console.error('Error updating PLC:', error); // Záznam jakýchkoliv chyb při aktualizaci
        }
    }

    function handleSave(event) { // Funkce pro zpracování ukládání hodnoty myInt
        event.preventDefault(); // Zamezení, aby se při odeslání formuláře znovu načetla stránka
        const value = document.getElementById('myIntInput').value; // Získání hodnoty z vstupního pole
        if (value === "" || isNaN(value) || value < 0 || value > 100) { // Validace vstupní hodnoty
            alert("Hodnota musí být mezi 0 a 100"); // Zobrazení upozornění, pokud je hodnota neplatná
        } else {
            updatePLC(value).then(() => { // Aktualizace PLC s platnou hodnotou
                document.getElementById('myIntSlider').value = 0; // Resetování hodnoty slideru
                document.getElementById('myIntInput').value = 0; // Resetování hodnoty vstupního pole
            });
        }
    }

    document.getElementById('saveButton').addEventListener('click', function(event) { // Přidání posluchače události kliknutí na tlačítko uložit
        handleSave(event); // Volání funkce handleSave při kliknutí
    });

    document.getElementById('myIntInput').addEventListener('keydown', function(event) { // Přidání posluchače události stisknutí klávesy na vstupní pole
        if (event.key === 'Enter') { // Pokud je stisknuta klávesa Enter
            handleSave(event); // Volání funkce handleSave
        }
    });

    document.getElementById('myIntSlider').addEventListener('input', function() { // Přidání posluchače události input na slider
        const value = document.getElementById('myIntSlider').value; // Získání hodnoty slideru
        document.getElementById('myIntInput').value = value; // Aktualizace hodnoty vstupního pole hodnotou slideru
    });

    document.getElementById('startButton').addEventListener('click', function(event) { // Přidání posluchače události kliknutí na tlačítko start
        updatePLC(null, 1, 0); // Aktualizace START na true
    });

    document.getElementById('stopButton').addEventListener('click', function(event) { // Přidání posluchače události kliknutí na tlačítko stop
        updatePLC(null, 0, 1); // Aktualizace STOP na true
    });

    function startRefresh() { // Funkce pro spuštění periodického načítání dat
        setInterval(fetchData, 1000); // Načítání dat každou sekundu
    }

    startRefresh(); // Spuštění periodického načítání dat
});
