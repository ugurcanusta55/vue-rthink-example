const cluster = require("cluster");
const http = require("http");
const { Server } = require("socket.io");
const redisAdapter = require("socket.io-redis");
const numCPUs = require("os").cpus().length;
const { setupMaster, setupWorker } = require("@socket.io/sticky");

var workers = [];

var r = require('rethinkdbdash')({ servers: [{ host: 'localhost', port: 28015 }] });

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  const httpServer = http.createServer();
  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
  });
  httpServer.listen(5001);

  for (let i = 0; i < numCPUs; i++) {
    var worker = cluster.fork();
    workers.push[worker];
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    process.exit()
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);

  const httpServer = http.createServer();
  const io = new Server(httpServer, {
    cors: true,
    origins: ['*']
  });
  io.adapter(redisAdapter({ host: "localhost", port: 6379 }));
  setupWorker(io);

  io.on("connection", (socket) => {

    console.log("new client connected");


    socket.on("clientId", (data) => {
      r.db("test").table("testTable")
        .changes()
        .run(function (err, cursor) {
		if (err) {
			console.log("err", err);
			return
		}
          // console.log(cursor);
          cursor.each((err, row) => {
            console.log(err);
            console.log(row);
            socket.emit("exampleData", row);
          })
        })
    })

    socket.on("disconnect", (reason) => {
      console.log("disconnect clientId", socket.clientId, reason);
    });

    socket.on("disconnecting", (reason) => {
      console.log("disconnecting clientId", socket.clientId, reason);
    });

  });

}
