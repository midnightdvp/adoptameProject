import json
from http.server import BaseHTTPRequestHandler, HTTPServer
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):

    def _set_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_POST(self):
        if self.path == '/send-email':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            to_email = data['emails']
            subject = data['subject']
            plain_message = data['message']
            html_message = data['html_message']

            # Configuración de las credenciales de correo
            sender_email = "adoptameorg@gmail.com" 
            sender_password = "glfg shii pias jlwa"    

            try:
                # Configuración del servidor SMTP
                print("Iniciando conexión con el servidor SMTP...")
                server = smtplib.SMTP('smtp.gmail.com', 587)
                server.starttls()
                print("Autenticando...")
                server.login(sender_email, sender_password)

                for email in to_email:
                    # Crear el mensaje
                    msg = MIMEMultipart()
                    msg['From'] = sender_email
                    msg['To'] = email
                    msg['Subject'] = subject

                    # Adjuntar mensajes (texto plano y HTML)
                    msg.attach(MIMEText(plain_message, 'plain'))
                    msg.attach(MIMEText(html_message, 'html'))

                    print(f"Enviando correo a {email}...")
                    server.sendmail(sender_email, email, msg.as_string())

                server.quit()
                print("Correo enviado con éxito!")
                self._set_headers()
                self.wfile.write(json.dumps({"message": "Email sent successfully!"}).encode('utf-8'))
            except smtplib.SMTPAuthenticationError as e:
                print("Error de autenticación:", e)
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "Authentication failed"}).encode('utf-8'))
            except Exception as e:
                print("Error al enviar el correo:", e)
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

def run_server():
    server_address = ('', 8080)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    print('Running server on port 8080...')
    httpd.serve_forever()

if __name__ == "__main__":
    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()
    input("Press Enter to stop the server...\n")
