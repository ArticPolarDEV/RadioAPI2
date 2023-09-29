const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const favicon = require('express-favicon');

const app = express();
const port = process.env.PORT || 3001;

app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use(bodyParser.text({
    type: 'application/xml'
}));

async function getAudioUrls(videoIds) {
    try {
        const audioUrls = [];

        for (const videoId of videoIds) {
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const info = await ytdl.getInfo(videoUrl);
            const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

            if (audioFormats.length === 0) {
                throw new Error(`No audio formats found for video: ${videoId}`);
            }
            const audioUrl = audioFormats[0].url;
            audioUrls.push(audioUrl);
        }
        return audioUrls;
    } catch (error) {
        console.error('Error: ', error.message);
        throw error;
    }
}

async function getPlaylistVideoIds(playlistUrl) {
    try {
        const playlistInfo = await ytpl(playlistUrl);
        const videoIds = playlistInfo.items.map(item => item.id);
        return videoIds;
    } catch (error) {
        console.error('Error: ', error.message);
        throw error;
    }
}

async function getAudioUrl(videoUrl) {
    try {
        const info = await ytdl.getInfo(videoUrl);
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        if (audioFormats.length === 0) {
            throw new Error('No audio format found for the video');
        }
        const audioFormat = audioFormats[0];
        const audioUrl = audioFormat.url;
        return audioUrl;
    } catch (error) {
        console.error('Error: ', error.message);
        throw error;
    }
}

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

app.get('/', (req, res) => {
	res.status(200).send('API Working');
});
	
app.get('/queryplaylist', (req, res) => {
	const playlistLink = "https://www.youtube.com/playlist?list=" + req.query.id;
	getPlaylistVideoIds(playlistLink)
		.then(videoIds => {
			res.status(200).send(videoIds);
		})
		.catch(error => {
			console.error('Error:', error.message);
			res.status(500).send('Error: ' + error.message);
		});
});

app.get('/getvideourl', (req, res) => {
	const vidId = req.query.id;
	const vidLink = "https://www.youtube.com/watch?v=" + vidId;
	res.status(200).send(vidLink);
});

app.get('/getaudioname', (req, res) => {
	const vidId = req.query.id;
	const vidLink = "https://www.youtube.com/watch?v=" + vidId;
	getVideoName(vidLink)
		.then(title => res.status(200).send(title));
});

app.post('/upload-xml', (req, res) => {
	const xmlData = req.body;

	const parser = new xml2js.Parser();
	parser.parseString(xmlData, async (err, result) => {
		if (err) {
			console.error('Error parsing XML:', err);
			return res.status(500).send('Error parsing XML');
		}

		const coverValue = result.root.playlist[0].cover[0];
		const authorValue = result.root.playlist[0].author[0];
		const idValue = result.root.playlist[0].id[0];
		const playlistLink = "https://www.youtube.com/playlist?list=" + idValue;

		const data = {
			cover: coverValue,
			author: authorValue,
			playlist: playlistLink,
			id: idValue
		};

		res.status(200).json(data);

		try {
			const videoIds = await getPlaylistVideoIds(playlistLink);
			const audioUrls = await getAudioUrls(videoIds);
			console.log('Audio URLs:', audioUrls);
		} catch (error) {
			console.error('Error: ', error.message);
		}
	});
});

app.get('/getaudio', async (req, res) => {
	const videoLink = "https://www.youtube.com/watch?v=" + req.query.id;
	
	try {
		const audioUrl = await getAudioUrl(videoLink);
		res.send(audioUrl);
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).send('Error retrieving audio URL');
	}
});

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
