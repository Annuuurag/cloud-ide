const http = require("http");
const express = require("express");
const fs = require("fs/promises");
const { Server: SocketServer } = require("socket.io");
const path = require("path");
const cors = require("cors");
const chokidar = require("chokidar");
const pty = require("node-pty");

const app = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: "*" },
});

app.use(cors());

// Watch files
chokidar.watch("./user").on("all", () => {
  io.emit("file:refresh");
});

// Socket handling
io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);

  // ✅ ONE PTY PER SOCKET
  const ptyProcess = pty.spawn("bash", [], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: "/app/user",
    env: process.env,
  });

  // ✅ PTY → FRONTEND
  ptyProcess.onData((data) => {
    socket.emit("terminal:data", data);
  });

  // ✅ FRONTEND → PTY
  socket.on("terminal:write", (data) => {
    ptyProcess.write(data);
  });

  // File edits
  socket.on("file:change", async ({ path, content }) => {
    await fs.writeFile(`./user${path}`, content);
  });

  socket.emit("file:refresh");

  socket.on("disconnect", () => {
    ptyProcess.kill();
    console.log("Socket disconnected", socket.id);
  });
});

// REST APIs
app.get("/files", async (req, res) => {
  const fileTree = await generateFileTree("./user");
  res.json({ tree: fileTree });
});

app.get("/files/content", async (req, res) => {
  const content = await fs.readFile(`./user${req.query.path}`, "utf-8");
  res.json({ content });
});

server.listen(9000, () => console.log("🐳 Docker server running on port 9000"));

async function generateFileTree(directory) {
  const tree = {};
  async function buildTree(dir, obj) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        obj[file] = {};
        await buildTree(filePath, obj[file]);
      } else {
        obj[file] = null;
      }
    }
  }
  await buildTree(directory, tree);
  return tree;
}
