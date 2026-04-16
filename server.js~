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

});


//API to fetch chat history
app.get("/message/:room", async(req, res) => {
	const messages = await Message.find({ room: req.params.room});
	res.json(messages);
});

//Start server
server.listen(3001, () => {
	console.log("Server runnning on port 3001");

});



