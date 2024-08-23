import "dotenv/config"; // Automatically loads environment variables from .env
import axios from "axios";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
let accessToken = "";
let tokenExpiry = 0; // Timestamp when the token expires

async function getAccessToken() {
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "client_credentials",
      }),
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
          username: SPOTIFY_CLIENT_ID,
          password: SPOTIFY_CLIENT_SECRET,
        },
      }
    );
    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000; // Token expiry in milliseconds
  } catch (error) {
    console.error("Error fetching access token:", error);
    throw new Error("Unable to fetch access token");
  }
}

async function ensureToken() {
  if (!accessToken || Date.now() >= tokenExpiry) {
    await getAccessToken();
  }
}

async function getPlaylists() {
  await ensureToken();
  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/playlists",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data.items;
  } catch (error) {
    console.error("Error fetching playlists:", error);
    throw new Error("Unable to fetch playlists");
  }
}

async function getArtistDetails(artistName) {
  await ensureToken();
  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        artistName
      )}&type=artist`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (response.data.artists.items.length === 0) {
      throw new Error("Artist not found");
    }
    return response.data.artists.items[0];
  } catch (error) {
    console.error("Error fetching artist details:", error);
    throw new Error("Unable to fetch artist details");
  }
}

async function getGenres() {
  await ensureToken();
  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/recommendations/available-genre-seeds",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data.genres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    throw new Error("Unable to fetch genres");
  }
}

export default async function handler(req, res) {
  const intent = req.body.queryResult.intent.displayName;

  try {
    if (intent === "Get Playlist Details") {
      const playlists = await getPlaylists();
      let responseText = "Here are your playlists:\n";
      playlists.forEach((playlist) => {
        responseText += `${playlist.name} with ${playlist.tracks.total} tracks.\n`;
      });
      res.status(200).json({ fulfillmentText: responseText });
    } else if (intent === "Get Artist Details") {
      const artistName = req.body.queryResult.parameters.artist;
      const artistDetails = await getArtistDetails(artistName);
      const responseText = `Artist ${artistDetails.name} has ${
        artistDetails.followers.total
      } followers and is popular in these genres: ${artistDetails.genres.join(
        ", "
      )}.`;
      res.status(200).json({ fulfillmentText: responseText });
    } else if (intent === "Get Genre Details") {
      const genres = await getGenres();
      const responseText = `Here are some genres: ${genres.join(", ")}.`;
      res.status(200).json({ fulfillmentText: responseText });
    } else {
      res.status(200).json({ fulfillmentText: "I didn't understand that." });
    }
  } catch (error) {
    console.error("Error handling the request:", error);
    res
      .status(500)
      .json({ fulfillmentText: "There was an error processing your request." });
  }
}
