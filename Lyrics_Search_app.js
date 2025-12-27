document.addEventListener('DOMContentLoaded', () => {
    let user_input = document.getElementById('song');
    let searh_btn = document.getElementById('searchBtn');
    let put_result = document.getElementById('results');
    let artist = document.getElementById('artist');
    let current_audio = new Audio();
    let song_play_btn = document.getElementById('play_song');
    let isPlaying = false;
    let ScrollInterval;
    let bestMatch = "";


    async function updateBackground(song_name, artist_name) {
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist_name + " " + song_name)}&limit=1&entity=song`;
        try {
            const response = await fetch(itunesUrl);
            const data = await response.json();
            if (data.results.length > 0) {
                let imgUrl = data.results[0].artworkUrl100.replace('100x100bb.jpg', '1000x1000bb.jpg');
                document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${imgUrl}')`;
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundPosition = "center";
                document.body.style.backgroundAttachment = "fixed";
            }
        } catch (err) {
            console.log("Could not load background image");
        }
    }

    async function copyToClipboard(text, buttonElement) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = buttonElement.innerText;
            buttonElement.innerText = "✅ Copied!";
            buttonElement.classList.replace('bg-gray-800', 'bg-green-600');
            setTimeout(() => {
                buttonElement.innerText = originalText;
                buttonElement.classList.replace('bg-green-600', 'bg-gray-800');
            }, 2000);

        } catch (err) {
            alert("Could not copy text.");
        }
    }

    async function playSong(song_name, artist_name) {
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist_name + " " + song_name)}&limit=1&entity=song`;
        try {
            const response = await fetch(itunesUrl);
            const data = await response.json();
            if (data.results.length > 0) {
                current_audio.pause();
                current_audio.src = data.results[0].previewUrl;
                if (isPlaying) {
                    isPlaying = false;
                    song_play_btn.textContent = 'Play Song';
                    clearInterval(ScrollInterval);
                    return;
                }
                ScrollInterval = setInterval(() => {
                    window.scrollBy({ top: 3, behavior: 'smooth' });
                }, 350);
                current_audio.play();
                isPlaying = true;
                console.log(`Playing Song `);
                song_play_btn.textContent = 'Stop';
            }
            else {
                alert("Sorry this song can't be played , Try another ");
            }
        } catch (err) {
            console.log(`Error found ${err} `);
            alert("Oops some error occurend while playing this sond , Try another song .");
        }
    }

    song_play_btn.addEventListener('click', () => {
        playSong(user_input.value, artist.value);
    })

    
    function displayRecent() {
        const recentContainer = document.getElementById('recent-container');
        const recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
        recentContainer.innerHTML = "";

        recentSearches.forEach(item => {
            const chip = document.createElement('button');
            chip.innerText = item;
            chip.className = "px-6 py-2 bg-white/20 hover:bg-black transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-white/10 border border-white/30 rounded-full text-sm text-white transition-all active:scale-95";
            chip.onclick = () => {
                const [sName, aName] = item.split(' - ');
                user_input.value = sName;
                artist.value = aName;
                if (isPlaying) {
                    isPlaying = false;
                    song_play_btn.textContent = 'Play Song';
                    clearInterval(ScrollInterval);
                }
                matchLyrics(sName, aName);
            };
            recentContainer.appendChild(chip);
        });
    }


    function shareOnWhatsapp(song_name, artist_name) {
        let msg = `Check out the lyrics of ${song_name} by ${artist_name}`;
        let whatsapp_url = `https://wa.me/?text="${encodeURIComponent(msg)}`;
        window.open(whatsapp_url, '_blank');
    }


    function saveToRecent() {
        let recent = JSON.parse(localStorage.getItem('recentSearches')) || [];
        const newEntry = `${bestMatch.trackName} - ${bestMatch.artistName}`;
        if (!recent.includes(newEntry)) {
            recent.unshift(newEntry);
            recent = recent.slice(0, 5);
            localStorage.setItem('recentSearches', JSON.stringify(recent));
        }
        displayRecent();
    }


    async function matchLyrics(song_name, artist_name) {
        if (!song_name || !artist_name) {
            alert("Please enter both Artist name and Song title ");
            return;
        }
        put_result.innerHTML = "Searching ...";
        put_result.style.color = "white"; // Changed to white for your glassmorphism theme

        try {
            const url = `https://lrclib.net/api/search?q=${encodeURIComponent(artist_name + " " + song_name)}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.length > 0) {
                bestMatch = data[0];
                updateBackground(bestMatch.trackName, bestMatch.artistName);

                setTimeout(() => {
                    user_input.value = bestMatch.trackName;
                    artist.value = bestMatch.artistName;
                }, 1000);

                saveToRecent();

                if (bestMatch.plainLyrics) {
                    const rawLyrics = bestMatch.plainLyrics;

                    let copyBtn = document.createElement('button');
                    copyBtn.innerText = "📋 Copy Lyrics";
                    copyBtn.className = "mb-4 mr-4 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black transition-all active:scale-95";
                    copyBtn.onclick = () => copyToClipboard(rawLyrics, copyBtn);

                    let shareBtn = document.createElement('button');
                    shareBtn.innerText = "📲 Share on Whatsapp";
                    shareBtn.className = "mb-4 bg-green-400 text-white px-4 py-2 border rounded-lg hover:bg-green-700 transition-all active:scale-95";
                    shareBtn.onclick = () => shareOnWhatsapp(bestMatch.trackName, bestMatch.artistName);

                    let lyrics_div = document.createElement('pre');
                    lyrics_div.className = "text-white whitespace-pre-wrap font-sans";
                    lyrics_div.textContent = rawLyrics;

                    put_result.innerHTML = "";
                    put_result.appendChild(copyBtn);
                    put_result.appendChild(shareBtn);
                    put_result.appendChild(lyrics_div);
                }
            }
            else {
                alert("Please enter valid Song name Or/And Artist Name");
            }
        } catch (err) {
            alert("Please enter valid Song name Or/And Artist Name");
            put_result.innerHTML = "Something went wrong ";
        }
    }

    searh_btn.addEventListener('click', () => {
        matchLyrics(user_input.value, artist.value);
    })

    current_audio.onended = () => {
        isPlaying = false;
        song_play_btn.textContent = 'Play Song';
        clearInterval(ScrollInterval);
    };

    window.addEventListener('wheel', () => clearInterval(ScrollInterval));
    window.addEventListener('touchmove', () => clearInterval(ScrollInterval));

    // Initialize history on load
    displayRecent();
})
