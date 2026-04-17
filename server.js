/* npm install express mongoose cors socket.io */
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");



const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*"
	}
});

let users = [];

//connect MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/chatt")
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

const MessageSchema = new mongoose.Schema(
	{
		room: String,
		sender: String,
		text: String,
		createdAt: {

			type: Date,
			default: Date.now
		}


	}

);

const Message = mongoose.model("Message", MessageSchema);


//Socket.IO real-time chat
io.on("connection", (socket) => {
	console.log("User connected:", socket.id);

	// JOIN ROOM + STORE USER
	socket.on("join_room", ({ room, username }) => {
		socket.join(room);

		//remove old entry
		/*users = users.filter(u => u.socketId !== socket.id && !(u.username === username && u.room === room));*/
		// store user add clean entry
		/*users.push({
			socketId: socket.id,
			username,
			room
		});*/
		const existingUser = users.find(u => u.username === username && u.room === room);

		if (existingUser) {
  		existingUser.socketId = socket.id;
		} else {
  		users.push({ socketId: socket.id, username, room });
		}		

		// send updated users list to room
		const roomUsers = users.filter(u => u.room === room);
		io.to(room).emit("room_users", roomUsers);
	});

	// SEND MESSAGE
	socket.on("send_message", async (data) => {
		const msg = new Message(data);
		await msg.save();

		socket.to(data.room).emit("recieve_message", data);
	});

	// DISCONNECT
	socket.on("disconnect", () => {
		console.log("User disconnected");

		// remove user
		const user = users.find(u => u.socketId === socket.id);

		users = users.filter(u => u.socketId !== socket.id);

		// update room users
		if (user) {
			const roomUsers = users.filter(u => u.room === user.room);
			io.to(user.room).emit("room_users", roomUsers);
		}
	});

	socket.on("typing", ({ room, username }) => {
	socket.to(room).emit("user_typing", username);
	});

	socket.on("stop_typing", ({ room }) => {
	socket.to(room).emit("user_stop_typing");
	});

});
/*io.on("connection", (socket) => {
	console.log("User connected:", socket.id);

	socket.on("join_room", (room) => {

	 socket.join(room);
	});

	socket.on("send_message", async (data) => {
	//save to MongoDB
		const msg = new Message(data);
		await msg.save();

	//broadcast to room
	socket.to(data.room).emit("recieve_message", data);
	});

	socket.on("disconnect", () => {
		console.log("User disconnected");

	});

});*/


//API to fetch chat history
app.get("/messages/:room", async(req, res) => {
	const messages = await Message.find({ room: req.params.room});
	res.json(messages);
});

//Start server
server.listen(3001, () => {
	console.log("Server runnning on port 3001");

});



