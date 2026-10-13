FROM gcc:latest
WORKDIR /usr/src/app
COPY . .
RUN g++ -O3 server.cpp -o server
EXPOSE 8080
CMD ["./server"]
