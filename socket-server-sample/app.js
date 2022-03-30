const cluster = require("cluster");
const http = require("http");
const { Server } = require("socket.io");
const redisAdapter = require("socket.io-redis");
const numCPUs = require("os").cpus().length;
const { setupMaster, setupWorker } = require("@socket.io/sticky");

var workers = [];

var r = require('rethinkdbdash')({ servers: [{ host: '10.10.30.36', port: 28015 }] });

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  const httpServer = http.createServer();
  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
  });
  httpServer.listen(5975);

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
      // fetch devices
      console.log("data", data)
      // let devices = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,24,25,26,27,28,29,30,31,32,33,34,44,45];

      /*r.db("n2mobil").table("deviceLastState").filter((doc) => {
        return r.expr(devices).contains(doc("device_id"))
      })*/r.db("n2mobil").table("deviceLastState")
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
            socket.emit("gps_data", row);
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
