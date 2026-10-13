#include "LibraryEngine.h"
#include <iostream>
#include <string>
#include <sstream>
#include <fstream>
#include <cstdlib>
#include <algorithm>

#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #pragma comment(lib, "ws2_32.lib")
    typedef int socklen_t;
    #define CLOSE_SOCKET closesocket
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <unistd.h>
    #define SOCKET int
    #define INVALID_SOCKET -1
    #define CLOSE_SOCKET close
#endif

using namespace std;

LibraryEngine engine;

string readFileBinary(string filePath) {
    #ifdef _WIN32
    replace(filePath.begin(), filePath.end(), '/', '\\');
    #endif
    ifstream file(filePath.c_str(), ios::binary);
    if (!file.is_open()) return "";
    stringstream ss;
    ss << file.rdbuf();
    return ss.str();
}

string getContentType(const string& path) {
    if (path.rfind(".html") != string::npos) return "text/html; charset=UTF-8";
    if (path.rfind(".css") != string::npos)  return "text/css; charset=UTF-8";
    if (path.rfind(".js") != string::npos)   return "application/javascript; charset=UTF-8";
    if (path.rfind(".json") != string::npos) return "application/json; charset=UTF-8";
    if (path.rfind(".jpeg") != string::npos || path.rfind(".jpg") != string::npos) return "image/jpeg";
    if (path.rfind(".png") != string::npos)  return "image/png";
    return "text/plain";
}

int main() {
    int port = 8080;
    const char* envPort = getenv("PORT");
    if (envPort != NULL) {
        port = atoi(envPort);
    }

#ifdef _WIN32
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);
#endif

    SOCKET server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd == INVALID_SOCKET) return 1;

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, (char*)&opt, sizeof(opt));

    sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port);

    if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) return 1;
    listen(server_fd, 25);

    cout << "====================================================================\n";
    cout << "   HICMIS Digital Library Engine - High-Performance C++ Backend     \n";
    cout << "   Author: Ahmed Rabie | Computer Systems & MIS                     \n";
    cout << "====================================================================\n";
    cout << " [*] C++ Core Engine: READY (Loaded: " << engine.getBooksCount() << " Books, " 
         << engine.getStudentsCount() << " Students)\n";
    cout << " [*] Listening on Port: " << port << " (Local & Cloud Compatible)  \n";
    cout << "====================================================================\n\n";

    while (true) {
        sockaddr_in clientAddr;
        socklen_t clientLen = sizeof(clientAddr);
        SOCKET client = accept(server_fd, (struct sockaddr*)&clientAddr, &clientLen);
        if (client == INVALID_SOCKET) continue;

        char buffer[8192] = {0};
        int bytesRead = recv(client, buffer, sizeof(buffer) - 1, 0);
        if (bytesRead <= 0) {
            CLOSE_SOCKET(client);
            continue;
        }

        string request(buffer);
        size_t firstSpace = request.find("GET ");
        size_t secondSpace = request.find(" HTTP/");
        string path = "/";

        if (firstSpace != string::npos && secondSpace != string::npos) {
            path = request.substr(firstSpace + 4, secondSpace - (firstSpace + 4));
        }

        size_t qPos = path.find('?');
        if (qPos != string::npos) path = path.substr(0, qPos);
        if (path == "/" || path.empty()) path = "/index.html";

        string response = "";

        // 1. مسار استرجاع الكتب من كود C++ مباشرة
        if (path == "/api/books") {
            string data = engine.getBooksJson();
            response = "HTTP/1.1 200 OK\r\nContent-Type: application/json; charset=UTF-8\r\n"
                       "Access-Control-Allow-Origin: *\r\nContent-Length: " + to_string(data.length()) + 
                       "\r\nConnection: close\r\n\r\n" + data;
            send(client, response.c_str(), (int)response.length(), 0);
        }
        // 2. مسار استرجاع الطلاب من كود C++ مباشرة
        else if (path == "/api/students") {
            string data = engine.getStudentsJson();
            response = "HTTP/1.1 200 OK\r\nContent-Type: application/json; charset=UTF-8\r\n"
                       "Access-Control-Allow-Origin: *\r\nContent-Length: " + to_string(data.length()) + 
                       "\r\nConnection: close\r\n\r\n" + data;
            send(client, response.c_str(), (int)response.length(), 0);
        }
        // 3. مسار الملفات العادية (HTML, CSS, JS)
        else {
            string localPath = (path[0] == '/') ? path.substr(1) : path;
            string fileContent = readFileBinary(localPath);
            if (!fileContent.empty()) {
                string mime = getContentType(localPath);
                response = "HTTP/1.1 200 OK\r\nContent-Type: " + mime + 
                           "\r\nContent-Length: " + to_string(fileContent.length()) + 
                           "\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n" + fileContent;
                send(client, response.c_str(), (int)response.length(), 0);
            } else {
                string notFound = "404 Not Found on C++ Server";
                response = "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nContent-Length: " + 
                           to_string(notFound.length()) + "\r\nConnection: close\r\n\r\n" + notFound;
                send(client, response.c_str(), (int)response.length(), 0);
            }
        }

        CLOSE_SOCKET(client);
    }

    CLOSE_SOCKET(server_fd);
#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}