def get_spotify_token():
    url = 'https://accounts.spotify.com/api/token'
    headers = {
        'Authorization': 'Basic ' + base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode(),
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {
        'grant_type': 'client_credentials'
    }
    response = requests.post(url, headers=headers, data=data)
    
    # Debugging information
    print(f"Status Code: {response.status_code}")
    print(f"Response Text: {response.text}")
    
    if response.status_code == 200:
        return response.json()['access_token']
    else:
        raise Exception("Failed to obtain access token: " + response.text)

# Example usage
if __name__ == "__main__":
    genre = 'rock'
    try:
        token = get_spotify_token()
        recommendations = get_music_recommendations(genre, token)
        print(recommendations)
    except Exception as e:
        print(e)
