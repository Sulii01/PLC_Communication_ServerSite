# PLC Web Interface Project
This project provides a custom web interface for monitoring and controlling a Siemens SIMATIC S7-1200 PLC using a built-in web server. The interface is designed to send and receive data to/from the PLC via HTTP requests, enabling user-friendly interaction with the automation system.

## Features
- Custom HTML Pages: Tailored web pages hosted on the PLC's web server.
- AJAX Integration: Dynamic communication with the PLC via asynchronous HTTP requests (GET and POST).
- Real-time Monitoring: Display live data from the PLC on the web interface.
- Control Capabilities: Send commands and parameters to the PLC directly from the browser.
- Seamless Integration: Utilizes the PLC's built-in web server for easy deployment and accessibility.
## How It Works
1. Custom Web Pages: Designed in HTML, CSS, and JavaScript, these pages are uploaded to the PLC's user-defined web server space.
2. AJAX Requests: Handles communication between the web client and the PLC endpoints using XMLHttpRequest.
3. Built-in Server: The PLC's web server hosts the custom pages, which interact with the PLC's data blocks or endpoints.
4. Data Exchange: JSON-formatted data is used for easy parsing and processing between the client and the server.
## Installation
1. Configure the PLC's web server in TIA Portal.
2. Upload the custom HTML files to the user-defined pages section.
3. Deploy the project to the PLC.
4. Access the interface via the PLC's IP address in your browser (e.g., http://192.168.7.156/awp/test/index.html).
## Requirements
- Siemens SIMATIC S7-1200 PLC
- TIA Portal for configuration
- Web browser for accessing the interface
## Technologies Used
- HTML, CSS, JavaScript: For building the custom web interface.
- AJAX (XMLHttpRequest): For seamless client-server communication.
- PLC Web Server: Built-in web server of the SIMATIC S7-1200 PLC.
## Future Enhancements
- Support for additional HTTP methods.
- Advanced data visualization using libraries (e.g., Chart.js or D3.js).
- Integration with more advanced PLC models.
- Multi-language support for global accessibility.
