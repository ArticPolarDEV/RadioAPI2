const express = require("express");
const ytdl = require("ytdl-core");
const app = express();
const port = process.env.PORT || 3001;

app.get("/", (req, res) => res.send("API is Working!"));

async function getVideoName(videoUrl) {
    try {
        const info = await ytdl.getInfo(videoUrl);
        const videoTitle = info.videoDetails.title;
        return videoTitle;
    } catch (error) {
        console.error('Error: ', error.message);
        throw error;
    }
}
app.get('/getaudioname', (req, res) => {
	const vidId = req.query.id;
	const vidLink = "https://www.youtube.com/watch?v=" + vidId;
	getVideoName(vidLink)
		.then(title => res.status(200).send(title));
});
const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
