import snap7  # Importuje knihovnu pro komunikaci s PLC Siemens
from snap7.util import get_int, get_bool, set_int  # Importuje utility pro práci s daty v PLC
from snap7.types import Areas  # Importuje typy oblastí pro čtení a zápis dat v PLC
from datetime import datetime, timedelta  # Importuje třídy pro práci s datem a časem
import pandas as pd  # Importuje knihovnu pro práci s datovými rámci
import threading  # Importuje knihovnu pro práci s vlákny
import time  # Importuje knihovnu pro práci s časem
import csv  # Importuje knihovnu pro práci s CSV soubory
import os  # Importuje knihovnu pro práci se souborovým systémem
from flask import Flask, request, jsonify, render_template, send_from_directory  # Importuje potřebné třídy z Flask
from flask_cors import CORS  # Importuje Flask-CORS pro práci s CORS
from flask_sslify import SSLify  # Importuje Flask-SSLify pro práci s SSL
import struct  # Importuje knihovnu pro práci s binárními daty

# Inicializace Flask aplikace
app = Flask(__name__, template_folder='Z:/Programy/WWW_S7_1200/Stranky/web/template', static_folder='Z:/Programy/WWW_S7_1200/Stranky/web/static')
sslify = SSLify(app)  # Povolení SSL pro aplikaci Flask
CORS(app)  # Povolení CORS pro aplikaci Flask

# Funkce pro načtení konfigurace a offsetů z textového souboru
def load_config(file_path):
    config = {}  # Inicializace slovníku pro konfiguraci
    offsets = {}  # Inicializace slovníku pro offsety
    with open(file_path, 'r') as file:  # Otevření souboru pro čtení
        for line in file:  # Čtení řádků souboru
            key, value = line.strip().split('=')  # Rozdělení řádku na klíč a hodnotu
            if key in [ 'RACK', 'SLOT', 'DB_NUMBER', 'DB_START', 'DB_SIZE', 'GRAF_DB_NUMBER', 'GRAF_DB_START', 'GRAF_DB_SIZE', 'GRAF_ROZSAH_MIN', 'GRAF_ROZSAH_MAX']:
                config[key] = int(value)  # Uložení hodnoty jako integer
            elif key == 'HEADER':
                config[key] = value.split(',')  # Uložení hodnoty jako seznam
            elif ',' in value:
                params = value.split(',')  # Rozdělení hodnoty na parametry
                offsets[key] = params  # Uložení parametrů do offsetů
            else:
                config[key] = value  # Uložení hodnoty jako string
    return config, offsets  # Vrácení konfigurace a offsetů

# Načtení konfigurace a offsetů z plc_config.txt
config, offsets = load_config('Z:/Programy/WWW_S7_1200/Stranky/web/plc_config.txt')

# Aktualizace hlavičky pro odstranění START a STOP
config['HEADER'] = [item for item in config['HEADER'] if item not in ['START1', 'STOP1']]

# Inicializace PLC klienta
client = snap7.client.Client()

print(f"Connecting to PLC at {config['PLC_IP']} (Rack: {config['RACK']}, Slot: {config['SLOT']})")  # Záznam pokusu o připojení k PLC
try:
    client.connect(config['PLC_IP'], config['RACK'], config['SLOT'])  # Pokus o připojení k PLC
    print("Connected to PLC")  # Záznam úspěšného připojení
except Exception as e:
    print(f"Error connecting to PLC: {e}")  # Záznam chyby při připojení
    exit(1)  # Ukončení programu při chybě

# Funkce pro čtení dat z datablocku
def read_db(client, db_number, start, size):
    try:
        data = client.read_area(Areas.DB, db_number, start, size)  # Čtení dat z datablocku
        return data  # Vrácení načtených dat
    except Exception as e:
        print(f"Error reading DB{db_number}: {e}")  # Záznam chyby při čtení dat
        return None  # Vrácení None při chybě

# Funkce pro zápis dat do datablocku
def write_db(client, db_number, start, values):
    try:
        data = read_db(client, db_number, 0, config['DB_SIZE'])  # Načtení dat z datablocku
        if data is not None:
            for key, value in values.items():
                if value is not None:
                    offset = int(offsets[key][0])  # Získání offsetu
                    if offsets[key][1] == 'int':
                        set_int(data, offset, int(value))  # Nastavení hodnoty jako integer
                    elif offsets[key][1] == 'bool':
                        bit = int(offsets[key][2])  # Získání bitu pro hodnotu
                        data[offset] = (data[offset] & ~(1 << bit)) | (int(value) << bit)  # Nastavení hodnoty jako boolean
            client.write_area(Areas.DB, db_number, start, data)  # Zápis dat do datablocku
    except Exception as e:
        print(f"Error writing to DB{db_number}: {e}")  # Záznam chyby při zápisu dat

# Funkce pro získání dat z PLC
def get_plc_data():
    try:
        data = read_db(client, config['DB_NUMBER'], config['DB_START'], config['DB_SIZE'])  # Načtení dat z PLC
        if data is None:
            raise ValueError("No data read from PLC")  # Vyhození výjimky při nenalezení dat
        plc_data = {}
        for key in offsets.keys():
            offset = int(offsets[key][0])  # Získání offsetu
            if offsets[key][1] == 'int':
                plc_data[key] = get_int(data, offset)  # Získání hodnoty jako integer
            elif offsets[key][1] == 'bool':
                bit = int(offsets[key][2])  # Získání bitu pro hodnotu
                plc_data[key] = get_bool(data, offset, bit)  # Získání hodnoty jako boolean
        plc_data['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')  # Přidání timestampu
        return plc_data  # Vrácení dat z PLC
    except Exception as e:
        print(f"Error getting PLC data: {e}")  # Záznam chyby při získávání dat
        return None  # Vrácení None při chybě

# Funkce pro získání dat z PLC pro graf
def get_grafValue_data():
    try:
        data = read_db(client, config['GRAF_DB_NUMBER'], config['GRAF_DB_START'], config['GRAF_DB_SIZE'] * 4)  # Každý Real je 4 bajty
        if data is None:
            raise ValueError("No data read from PLC")  # Vyhození výjimky při nenalezení dat
        
        grafValue_values = []
        for i in range(config['GRAF_DB_SIZE']):
            offset = i * 4  # Každý Real je 4 bajty
            grafValue_values.append(struct.unpack('!f', data[offset:offset + 4])[0])  # Rozbalení hodnoty jako float
        
        plc_data = {
            'grafValue': grafValue_values,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')  # Přidání timestampu
        }
        return plc_data  # Vrácení dat pro graf
    except Exception as e:
        print(f"Error getting PLC data: {e}")  # Záznam chyby při získávání dat
        return None  # Vrácení None při chybě

# Endpoint pro získání konfigurace grafu z PLC
@app.route('/get_graf_config', methods=['GET'])
def get_graf_config():
    try:
        config_data = {
            'GRAF_ROZSAH_MIN': config['GRAF_ROZSAH_MIN'],
            'GRAF_ROZSAH_MAX': config['GRAF_ROZSAH_MAX']
        }
        return jsonify(config_data)  # Vrácení konfigurace jako JSON
    except Exception as e:
        print(f"Error in /get_graf_config: {e}")  # Záznam chyby při získávání konfigurace
        return jsonify({'error': 'Error reading config data'}), 500  # Vrácení chyby jako JSON

# Endpoint pro získání grafValue dat z PLC
@app.route('/get_grafValue_data', methods=['GET'])
def get_grafValue_data_endpoint():
    try:
        plc_data = get_grafValue_data()  # Získání dat pro graf
        if plc_data is None:
            return jsonify({'error': 'Error reading PLC data'}), 500  # Vrácení chyby při nenalezení dat
        return jsonify(plc_data)  # Vrácení dat jako JSON
    except Exception as e:
        print(f"Error in /get_grafValue_data: {e}")  # Záznam chyby při získávání dat
        return jsonify({'error': 'Error reading PLC data'}), 500  # Vrácení chyby jako JSON

# File lock pro správu přístupu k CSV souboru
file_lock = threading.Lock()

# Funkce pro odstranění starých dat z CSV souboru
def remove_old_data():
    with file_lock:
        try:
            if not os.path.exists(config['CSV_FILE']):  # Kontrola existence souboru
                print("File does not exist, nothing to remove.")
                return
            
            df = pd.read_csv(config['CSV_FILE'])  # Načtení CSV souboru do datového rámce
            
            cutoff_time = datetime.now() - timedelta(days=30)  # Určení časového limitu pro odstranění dat
            cutoff_time_str = cutoff_time.strftime('%Y-%m-%d %H:%M:%S')  # Převedení časového limitu na řetězec
            print(f"Cutoff time: {cutoff_time_str}")
            
            df['timestamp'] = pd.to_datetime(df['timestamp'], format='%Y-%m-%d %H:%M:%S', errors='coerce')  # Převedení timestampu na datetime
            
            df = df[df['timestamp'] > cutoff_time]  # Filtrace dat na základě časového limitu
            
            df.to_csv(config['CSV_FILE'], index=False)  # Uložení filtrovaných dat zpět do CSV souboru
            print(f"Removed old data older than {cutoff_time_str}")
        except Exception as e:
            print(f"Error removing old data: {e}")  # Záznam chyby při odstraňování dat

# Funkce pro zajištění správné hlavičky v CSV souboru
def ensure_csv_header(file_name, header):
    with file_lock:
        file_exists = os.path.exists(file_name)  # Kontrola existence souboru
        if file_exists:
            with open(file_name, 'r') as f:
                first_line = f.readline().strip()  # Načtení první řádky souboru
                if first_line == '':  # Pokud je první řádka prázdná
                    with open(file_name, 'w', newline='') as f:
                        writer = csv.writer(f)
                        writer.writerow(header)  # Zápis hlavičky do souboru
                elif first_line != ','.join(header):  # Pokud se hlavička liší
                    df = pd.read_csv(file_name)  # Načtení souboru do datového rámce
                    df.to_csv(file_name, index=False)  # Uložení datového rámce zpět do souboru
        else:
            with open(file_name, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(header)  # Zápis hlavičky do nového souboru

# Zajištění správné hlavičky v CSV souboru
ensure_csv_header(config['CSV_FILE'], config['HEADER'])

# Hlavní smyčka pro čtení dat z PLC a zápis do CSV souboru
def main_loop():
    try:
        while True:
            plc_data = get_plc_data()  # Získání dat z PLC
            if plc_data is not None:
                with file_lock:
                    with open(config['CSV_FILE'], mode='a', newline='') as file:
                        writer = csv.writer(file)
                        writer.writerow([plc_data['timestamp'], plc_data['myInt'], plc_data['procInt'], plc_data['MOTOR_RUN1']])
                        # Záznam relevantních dat do konzole
                        print(f"Written to CSV: {{'timestamp': {plc_data['timestamp']}, 'myInt': {plc_data['myInt']}, 'procInt': {plc_data['procInt']}, 'MOTOR_RUN1': {plc_data['MOTOR_RUN1']}}}")
            time.sleep(1800)  # Spánek na 30 minut
    
    except KeyboardInterrupt:
        print("Program interrupted by user")  # Záznam přerušení programu uživatelem
    finally:
        client.disconnect()  # Odpojení od PLC
        print("Disconnected from PLC")  # Záznam odpojení od PLC

# Servírování hlavního HTML souboru na root URL
@app.route('/')
def index():
    return render_template('index.html')  # Vrácení šablony index.html

@app.route('/index.html')
def home():
    return render_template('index.html')  # Vrácení šablony index.html

# Servírování HTML souboru historie
@app.route('/history.html')
def history():
    return render_template('history.html')  # Vrácení šablony history.html

# Servírování HTML souboru graf
@app.route('/graf.html')
def graf():
    return render_template('graf.html')  # Vrácení šablony graf.html

# Servírování HTML souboru plc_graf
@app.route('/plc_graf.html')
def plc_graf():
    return render_template('plc_graf.html')  # Vrácení šablony plc_graf.html

# Získání dat z csv
@app.route('/plc_data.csv')
def get_plc_data_csv():
    csv_file_path = 'Z:/Programy/WWW_S7_1200/Stranky/web/plc_data.csv'  # Cesta k souboru CSV
    return send_from_directory(directory=os.path.dirname(csv_file_path), path=os.path.basename(csv_file_path), as_attachment=False)  # Vrácení CSV souboru

# Endpoint pro získání dat z PLC
@app.route('/get_data', methods=['GET'])
def get_data():
    try:
        plc_data = get_plc_data()  # Získání dat z PLC
        if plc_data is None:
            return jsonify({'error': 'Error reading PLC data'}), 500  # Vrácení chyby při nenalezení dat
        return jsonify(plc_data)  # Vrácení dat jako JSON
    except Exception as e:
        print(f"Error in /get_data: {e}")  # Záznam chyby při získávání dat
        return jsonify({'error': 'Error reading PLC data'}), 500  # Vrácení chyby jako JSON

# Endpoint pro aktualizaci PLC
@app.route('/update_plc', methods=['POST'])
def update_plc():
    try:
        data = request.get_json()  # Získání JSON dat z požadavku
        values = {}
        for key in offsets.keys():
            if key in data:
                if data[key] is not None:
                    values[key] = data[key]  # Přidání hodnot do slovníku
        write_db(client, config['DB_NUMBER'], config['DB_START'], values)  # Zápis hodnot do PLC
        
        return jsonify({'status': 'success', **values})  # Vrácení úspěchu jako JSON
    except Exception as e:
        print(f"Error in /update_plc: {e}")  # Záznam chyby při aktualizaci
        return jsonify({'error': 'Error updating PLC'}), 500  # Vrácení chyby jako JSON

if __name__ == '__main__':
    print("Starting Flask server.")  # Záznam spuštění Flask serveru
    threading.Thread(target=remove_old_data, daemon=True).start()  # Spuštění vlákna pro odstranění starých dat
    threading.Thread(target=main_loop, daemon=True).start()  # Spuštění hlavní smyčky v samostatném vlákně
    app.run(host='0.0.0.0', port=8080, debug=True, use_reloader=False, ssl_context=('cert.pem', 'key.pem'))  # Spuštění Flask serveru
