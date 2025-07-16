P2P Chat WebRTC
A peer-to-peer chat application built with WebRTC, enabling secure text messaging and file transfer directly between browsers without a server. The application supports Thai language, real-time notifications, dark/light themes, and responsive design for both desktop and mobile devices.
Features

Peer-to-Peer Communication: Uses WebRTC for direct, serverless text and file transfer.
End-to-End Encryption: Messages are encrypted using AES (CryptoJS) for secure communication.
File Transfer: Supports drag-and-drop file uploads with progress indicators for sending and receiving files.
Real-Time Notifications: Browser notifications for new messages when the tab is not in focus.
Typing Indicator: Displays when the other party is typing.
Chat History: Encrypted chat history stored locally in the browser.
Responsive Design: Optimized for both desktop and mobile devices with adaptive layouts.
Theme Support: Toggle between light and dark themes with local storage persistence.
QR Code Support: Generates QR codes for easy sharing of WebRTC offer/answer data.
Auto-Reconnect: Attempts to reconnect up to three times if the connection is lost.
Search Functionality: Allows searching through chat messages.
Export Chat: Export chat history as a plain text file.

Technologies Used

HTML5, CSS3, JavaScript: Core web technologies for the frontend.
WebRTC: For peer-to-peer communication and file transfer.
CryptoJS: For AES encryption of messages and chat history.
QRCode.js: For generating QR codes for WebRTC signaling.
Google Fonts: Inter and Sarabun fonts for a modern, Thai-compatible UI.

Getting Started
Prerequisites

A modern web browser (e.g., Chrome, Firefox, Edge) with WebRTC support.
No server or additional software is required, as the application runs entirely in the browser.

Setup

Clone or Download the Repository:
git clone <repository-url>

Alternatively, download the index.html file.

Serve the Application:

Open the index.html file in a web browser. For local testing, use a simple HTTP server to avoid CORS issues:python3 -m http.server 8000


Then, navigate to http://localhost:8000 in your browser.


Establish a Connection:

Create an Offer: Click "สร้าง Offer" to generate a WebRTC offer. Copy the offer text or scan the QR code.
Receive an Offer: Paste the received offer into the "วาง Offer จากอีกฝั่ง" field and click "สร้าง Answer".
Complete Connection: Share the generated answer with the other party, who will paste it into the "วาง Answer" field.
Once connected, the settings sections will hide, and you can start chatting or sending files.



Usage

Send Messages: Type in the message input field and press "Enter" or click the send button (📨).
Send Files: Drag and drop files into the file drop zone or click to select files. Press the send button to transfer.
Search Messages: Use the search bar to filter chat messages.
Toggle Theme: Click the theme toggle button (🌙/☀️) to switch between light and dark modes.
Export Chat: Click "ส่งออก" to download the chat history as a text file.
Clear Chat: Click "ล้างแชต" to clear the chat history (requires confirmation).
Reconnect: Click the reconnect button (🔄) to reset the connection if needed.

Security Notes

Encryption: Messages and chat history are encrypted using a hardcoded AES key (my-secret-key-2023). For production use, consider implementing a dynamic key exchange mechanism.
Local Storage: Chat history is stored in the browser's localStorage and is encrypted, but it can be cleared manually.
No Server: All communication is peer-to-peer, ensuring no data is stored on a server.

Limitations

File Size: Large files may take longer to transfer due to WebRTC DataChannel limitations.
Browser Compatibility: Requires WebRTC support, available in modern browsers.
Connection Stability: Depends on both peers maintaining an active connection. Auto-reconnect attempts up to three times.

Troubleshooting

Connection Issues: Ensure both parties exchange valid offer/answer data. Check the browser console for errors.
File Transfer Errors: Verify the connection is active (เชื่อมต่อแล้ว) before sending files.
Notifications Not Working: Ensure browser notification permissions are granted.
UI Issues: Test on different devices to confirm responsive design. Report any layout issues with browser details.

Contributing
Contributions are welcome! To contribute:

Fork the repository.
Create a feature branch (git checkout -b feature/YourFeature).
Commit your changes (git commit -m 'Add YourFeature').
Push to the branch (git push origin feature/YourFeature).
Open a pull request.

Please include detailed descriptions of your changes and test thoroughly.
License
This project is licensed under the MIT License. See the LICENSE file for details.
Acknowledgments

Inspired by WebRTC tutorials and open-source chat applications.
Thanks to the creators of QRCode.js and CryptoJS for their libraries.
Fonts provided by Google Fonts (Inter and Sarabun).
