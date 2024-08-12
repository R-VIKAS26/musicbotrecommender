const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const CLIENT_ID = "5214698deac049109c68b43e9ef4caf3";
const CLIENT_SECRET = "4bd31fa5d29c4708b0e308ea8298ffc8";
let accessToken = "";

// Function to Get Spotify Access Token
const getAccessToken = async () => {
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    accessToken = response.data.access_token;
  } catch (error) {
    console.error("Error fetching access token:", error);
  }
};

// Fetch the initial access token and set up a refresh interval
getAccessToken();
setInterval(getAccessToken, 3600 * 1000); // Refresh token every hour

// Define the webhook route
app.post("/webhook", async (req, res) => {
  const query =
    req.body.queryResult.parameters.song ||
    req.body.queryResult.parameters.artist;

  try {
    const response = await axios.get(`https://api.spotify.com/v1/search`, {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      params: {
        q: query,
        type: "track,artist",
        limit: 1,
      },
    });

    let reply = "";
    if (response.data.tracks.items.length > 0) {
      const track = response.data.tracks.items[0];
      reply = `Song: ${track.name}, Artist: ${track.artists[0].name}`;
    } else if (response.data.artists.items.length > 0) {
      const artist = response.data.artists.items[0];
      reply = `Artist: ${artist.name}`;
    } else {
      reply = "No results found";
    }

    res.json({
      fulfillmentText: reply,
    });
  } catch (error) {
    console.error("Error fetching data from Spotify:", error);
    res.json({
      fulfillmentText: "Error fetching data from Spotify",
    });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
