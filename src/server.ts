//this will be serving our web socket server
import pkg from 'websocket';
const { server: WebSocketServer } = pkg;
import type {connection} from 'websocket';
import http from 'http';




const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Web Socker Server is running");
})

const wss = new WebSocketServer({
    httpServer: server
})

const rooms = new Map<string, connection[]>();

wss.on('request', (request: any) => {
    const connection = request.accept(null, request.origin);

    const roomId = request.resourceURL.query?.roomId as string || 'default';

    //if room does not exist then add it else push the connection to the room
    if(!rooms.has(roomId)){
        rooms.set(roomId, []);
    }
    rooms.get(roomId)?.push(connection);

    console.log(`User has joined ${roomId}, Total in room ${rooms.get(roomId)?.length}`)
    connection.on('message', (message: any) => {
        if (message.type === 'utf8') {
            const clients = rooms.get(roomId);

            clients?.forEach((client) => {
                if(client !== connection){
                    client.sendUTF(message.utf8Data);
                }
            })
        } else if (message.type === 'binary') {
            console.log(message.binaryData);
        }
    });


    connection.on('close', () => {
        const clients = rooms.get(roomId);

        if(clients){
            const index = clients.indexOf(connection);
            if(index > -1){
                clients.splice(index, 1);
            }

            if(clients.length === 0){
                rooms.delete(roomId);
            }
        }

        console.log(`User deleted from room: ${roomId}`);
    });

})

server.listen(3001, () => {
    console.log("server is listening on port 3001...")
})




