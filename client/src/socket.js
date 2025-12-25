import { io } from "socket.io-client";

const socket = io("http://3.110.135.150:9000");

export default socket;


/*import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL;

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
});

export default socket;
*/