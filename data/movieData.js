const MOVIES = [
    {
        "movie_id": 1,
        "title": "Inception",
        "genre": ["Sci-Fi", "Thriller"],
        "experience_type": "intense",
        "rating_percent": 87,
        "popularity_score": 0.9,
        "age_limit": 13,
        "netflix_url": "https://www.netflix.com/title/70131314",
        "prime_url": "https://www.amazon.com/dp/B0047WJ11G",
        "year": 2010,
        "poster": "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg",
        "synopsis": "A skilled thief who infiltrates dreams is offered a chance to have his criminal record erased if he can successfully plant an idea in a target's subconscious.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "Netflix", "url": "https://www.netflix.com/title/70131314"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B0047WJ11G"}
        ]
    },
    {
        "movie_id": 2,
        "title": "The Grand Budapest Hotel",
        "genre": ["Comedy", "Drama"],
        "experience_type": "fun",
        "rating_percent": 84,
        "popularity_score": 0.7,
        "age_limit": 13,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B00J2PGLO0",
        "year": 2014,
        "poster": "https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
        "synopsis": "A legendary concierge at a famous European hotel and his trusted lobby boy become embroiled in the theft of a priceless painting.",
        "tags": ["underrated"],
        "ottPlatforms": [
            {"name": "Disney+", "url": "https://www.disneyplus.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B00J2PGLO0"}
        ]
    },
    {
        "movie_id": 3,
        "title": "Finding Nemo",
        "genre": ["Animation", "Adventure"],
        "experience_type": "fun",
        "rating_percent": 86,
        "popularity_score": 0.8,
        "age_limit": 0,
        "netflix_url": "",
        "prime_url": "",
        "year": 2003,
        "poster": "https://upload.wikimedia.org/wikipedia/en/2/29/Finding_Nemo.jpg",
        "synopsis": "A clownfish named Marlin embarks on a perilous journey across the ocean to find his abducted son Nemo, with the help of a forgetful fish named Dory.",
        "tags": ["family-safe"],
        "ottPlatforms": [
            {"name": "Disney+", "url": "https://www.disneyplus.com/movies/finding-nemo/5Gpj2XqF7BV2"}
        ]
    },
    {
        "movie_id": 4,
        "title": "Blade Runner 2049",
        "genre": ["Sci-Fi", "Drama"],
        "experience_type": "intense",
        "rating_percent": 81,
        "popularity_score": 0.7,
        "age_limit": 16,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B0764GY2JD",
        "year": 2017,
        "poster": "https://upload.wikimedia.org/wikipedia/en/9/9b/Blade_Runner_2049_poster.png",
        "synopsis": "A young blade runner uncovers a long-buried secret that has the potential to plunge what's left of society into chaos.",
        "tags": ["cult", "underrated"],
        "ottPlatforms": [
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B0764GY2JD"},
            {"name": "Apple TV", "url": "https://tv.apple.com"}
        ]
    },
    {
        "movie_id": 5,
        "title": "The Shawshank Redemption",
        "genre": ["Drama"],
        "experience_type": "emotional",
        "rating_percent": 91,
        "popularity_score": 1,
        "age_limit": 16,
        "netflix_url": "https://www.netflix.com",
        "prime_url": "",
        "year": 1994,
        "poster": "https://upload.wikimedia.org/wikipedia/en/8/81/ShawshankRedemptionMoviePoster.jpg",
        "synopsis": "A banker sentenced to life in Shawshank State Penitentiary forms an unlikely friendship and finds hope through acts of common decency.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "Netflix", "url": "https://www.netflix.com"},
            {"name": "HBO Max", "url": "https://www.hbomax.com"}
        ]
    },
    {
        "movie_id": 6,
        "title": "My Neighbor Totoro",
        "genre": ["Animation", "Fantasy"],
        "experience_type": "relaxing",
        "rating_percent": 88,
        "popularity_score": 0.7,
        "age_limit": 0,
        "netflix_url": "https://www.netflix.com",
        "prime_url": "",
        "year": 1988,
        "poster": "https://image.tmdb.org/t/p/w500/rtGDOeG9LzoerkDGZF9dnVeLppL.jpg",
        "synopsis": "Two young girls move to the countryside and befriend playful forest spirits, including the lovable giant creature Totoro.",
        "tags": ["family-safe", "cult"],
        "ottPlatforms": [
            {"name": "Netflix", "url": "https://www.netflix.com"},
            {"name": "HBO Max", "url": "https://www.hbomax.com"}
        ]
    },
    {
        "movie_id": 7,
        "title": "Pulp Fiction",
        "genre": ["Crime", "Drama"],
        "experience_type": "intense",
        "rating_percent": 89,
        "popularity_score": 0.9,
        "age_limit": 18,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B000I9YJ8E",
        "year": 1994,
        "poster": "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
        "synopsis": "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B000I9YJ8E"},
            {"name": "Paramount+", "url": "https://www.paramountplus.com"}
        ]
    },
    {
        "movie_id": 8,
        "title": "Coco",
        "genre": ["Animation", "Family", "Fantasy"],
        "experience_type": "emotional",
        "rating_percent": 90,
        "popularity_score": 0.8,
        "age_limit": 0,
        "netflix_url": "",
        "prime_url": "",
        "year": 2017,
        "poster": "https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg",
        "synopsis": "A young boy who dreams of becoming a musician journeys to the Land of the Dead to uncover his family's history.",
        "tags": ["family-safe"],
        "ottPlatforms": [
            {"name": "Disney+", "url": "https://www.disneyplus.com/movies/coco/db9orsI5O4gC"}
        ]
    },
    {
        "movie_id": 9,
        "title": "Drive",
        "genre": ["Action", "Drama"],
        "experience_type": "intense",
        "rating_percent": 79,
        "popularity_score": 0.7,
        "age_limit": 18,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B006IMZ0DQ",
        "year": 2011,
        "poster": "https://image.tmdb.org/t/p/w500/602vevIURmpDfzbnv5Ubi6wIkQm.jpg",
        "synopsis": "A Hollywood stunt driver who moonlights as a getaway driver finds himself in trouble when he helps his neighbour.",
        "tags": ["cult", "underrated"],
        "ottPlatforms": [
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B006IMZ0DQ"},
            {"name": "Apple TV", "url": "https://tv.apple.com"}
        ]
    },
    {
        "movie_id": 10,
        "title": "The Secret Life of Walter Mitty",
        "genre": ["Adventure", "Comedy", "Drama"],
        "experience_type": "relaxing",
        "rating_percent": 65,
        "popularity_score": 0.6,
        "age_limit": 0,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B00IANO1TA",
        "year": 2013,
        "poster": "https://image.tmdb.org/t/p/w500/hFesdtnQmCLFEOMA3jGvVlEGsR0.jpg",
        "synopsis": "A daydreamer escapes his anonymous life by disappearing into a world of fantasies of romance, heroism, and action.",
        "tags": ["underrated", "family-safe"],
        "ottPlatforms": [
            {"name": "Disney+", "url": "https://www.disneyplus.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B00IANO1TA"}
        ]
    },
    {
        "movie_id": 11,
        "title": "Interstellar",
        "genre": ["Sci-Fi", "Drama", "Adventure"],
        "experience_type": "emotional",
        "rating_percent": 85,
        "popularity_score": 0.9,
        "age_limit": 13,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B00TU9UFTS",
        "year": 2014,
        "poster": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        "synopsis": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival on a dying Earth.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "Paramount+", "url": "https://www.paramountplus.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B00TU9UFTS"}
        ]
    },
    {
        "movie_id": 12,
        "title": "Spirited Away",
        "genre": ["Animation", "Fantasy", "Adventure"],
        "experience_type": "fun",
        "rating_percent": 96,
        "popularity_score": 0.8,
        "age_limit": 0,
        "netflix_url": "https://www.netflix.com",
        "prime_url": "",
        "year": 2001,
        "poster": "https://image.tmdb.org/t/p/w500/yr7wocm26hT7IQBB78sprQVLlVd.jpg",
        "synopsis": "A young girl wanders into a world of spirits ruled by gods, witches, and strange creatures, and must find the courage to free herself and her parents.",
        "tags": ["cult", "family-safe"],
        "ottPlatforms": [
            {"name": "Netflix", "url": "https://www.netflix.com"},
            {"name": "HBO Max", "url": "https://www.hbomax.com"}
        ]
    },
    {
        "movie_id": 13,
        "title": "The Wolf of Wall Street",
        "genre": ["Crime", "Comedy", "Drama"],
        "experience_type": "fun",
        "rating_percent": 79,
        "popularity_score": 0.9,
        "age_limit": 18,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B00IIU9FMQ",
        "year": 2013,
        "poster": "https://image.tmdb.org/t/p/w500/34m2tygAYBGqA9MXKhRDtzYd4MR.jpg",
        "synopsis": "Based on the true story of Jordan Belfort, a wealthy stockbroker who ran a massive securities fraud scheme.",
        "tags": [],
        "ottPlatforms": [
            {"name": "Paramount+", "url": "https://www.paramountplus.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B00IIU9FMQ"}
        ]
    },
    {
        "movie_id": 14,
        "title": "Up",
        "genre": ["Animation", "Adventure", "Comedy"],
        "experience_type": "emotional",
        "rating_percent": 88,
        "popularity_score": 0.8,
        "age_limit": 0,
        "netflix_url": "",
        "prime_url": "",
        "year": 2009,
        "poster": "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        "synopsis": "An elderly widower ties thousands of balloons to his house and flies to South America, accidentally taking a young stowaway along for the ride.",
        "tags": ["family-safe"],
        "ottPlatforms": [
            {"name": "Disney+", "url": "https://www.disneyplus.com/movies/up/3HbSCnQEbir9"}
        ]
    },
    {
        "movie_id": 15,
        "title": "Moonlight",
        "genre": ["Drama"],
        "experience_type": "emotional",
        "rating_percent": 92,
        "popularity_score": 0.7,
        "age_limit": 18,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B01MU9CMGP",
        "year": 2016,
        "poster": "https://image.tmdb.org/t/p/w500/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg",
        "synopsis": "A timeless story of human self-discovery and connection, told across three defining chapters in the life of a young Black man growing up in Miami.",
        "tags": ["underrated"],
        "ottPlatforms": [
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B01MU9CMGP"},
            {"name": "Apple TV", "url": "https://tv.apple.com"}
        ]
    },
    {
        "movie_id": 16,
        "title": "The Matrix",
        "genre": ["Sci-Fi", "Action"],
        "experience_type": "intense",
        "rating_percent": 83,
        "popularity_score": 0.9,
        "age_limit": 16,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B000HAB4KS",
        "year": 1999,
        "poster": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
        "synopsis": "A computer hacker learns about the true nature of reality and his role in the war against its controllers.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "HBO Max", "url": "https://www.hbomax.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B000HAB4KS"}
        ]
    },
    {
        "movie_id": 17,
        "title": "Lost in Translation",
        "genre": ["Drama", "Romance"],
        "experience_type": "relaxing",
        "rating_percent": 80,
        "popularity_score": 0.6,
        "age_limit": 13,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B000IBUPMK",
        "year": 2003,
        "poster": "https://image.tmdb.org/t/p/w500/qRz3doI7a2ftwWng7wE6lZCZquk.jpg",
        "synopsis": "A faded movie star and a neglected young woman form an unlikely bond after crossing paths in Tokyo.",
        "tags": ["underrated"],
        "ottPlatforms": [
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B000IBUPMK"},
            {"name": "Apple TV", "url": "https://tv.apple.com"}
        ]
    },
    {
        "movie_id": 18,
        "title": "Mad Max: Fury Road",
        "genre": ["Action", "Sci-Fi"],
        "experience_type": "intense",
        "rating_percent": 90,
        "popularity_score": 0.8,
        "age_limit": 16,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B00ZIFHU9Y",
        "year": 2015,
        "poster": "https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg",
        "synopsis": "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a drifter named Max.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "HBO Max", "url": "https://www.hbomax.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B00ZIFHU9Y"}
        ]
    },
    {
        "movie_id": 19,
        "title": "The Truman Show",
        "genre": ["Comedy", "Drama"],
        "experience_type": "emotional",
        "rating_percent": 83,
        "popularity_score": 0.8,
        "age_limit": 0,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B001EBWIPY",
        "year": 1998,
        "poster": "https://image.tmdb.org/t/p/w500/vuza0WqY239yBXOadKlGwJsZJFE.jpg",
        "synopsis": "An insurance salesman discovers his whole life is actually a giant TV show, and everyone around him is acting.",
        "tags": ["cult", "family-safe"],
        "ottPlatforms": [
            {"name": "Paramount+", "url": "https://www.paramountplus.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B001EBWIPY"}
        ]
    },
    {
        "movie_id": 20,
        "title": "Amélie",
        "genre": ["Romance", "Comedy"],
        "experience_type": "fun",
        "rating_percent": 85,
        "popularity_score": 0.7,
        "age_limit": 13,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B000I9YLWM",
        "year": 2001,
        "poster": "https://image.tmdb.org/t/p/w500/4rHIh0WlZNHE5pOgR31tBeUlJZN.jpg",
        "synopsis": "A shy waitress in Montmartre decides to change the lives of those around her for the better, while struggling with her own isolation.",
        "tags": ["underrated"],
        "ottPlatforms": [
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B000I9YLWM"},
            {"name": "Apple TV", "url": "https://tv.apple.com"}
        ]
    },
    {
        "movie_id": 21,
        "title": "Fight Club",
        "genre": ["Drama", "Thriller"],
        "experience_type": "intense",
        "rating_percent": 79,
        "popularity_score": 0.9,
        "age_limit": 18,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B003MAQG9Y",
        "year": 1999,
        "poster": "https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg",
        "synopsis": "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into something much more.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B003MAQG9Y"},
            {"name": "Hulu", "url": "https://www.hulu.com"}
        ]
    },
    {
        "movie_id": 22,
        "title": "Inside Out",
        "genre": ["Animation", "Comedy", "Family"],
        "experience_type": "emotional",
        "rating_percent": 94,
        "popularity_score": 0.8,
        "age_limit": 0,
        "netflix_url": "",
        "prime_url": "",
        "year": 2015,
        "poster": "https://image.tmdb.org/t/p/w500/ayyBTAxL0ONtf8E9ttBLOjf450K.jpg",
        "synopsis": "After young Riley is uprooted from her Midwest life, her emotions — Joy, Fear, Anger, Disgust and Sadness — conflict on how to navigate a new city.",
        "tags": ["family-safe"],
        "ottPlatforms": [
            {"name": "Disney+", "url": "https://www.disneyplus.com/movies/inside-out/2I0bBbhZIbkZ"}
        ]
    },
    {
        "movie_id": 23,
        "title": "No Country for Old Men",
        "genre": ["Thriller", "Crime"],
        "experience_type": "intense",
        "rating_percent": 86,
        "popularity_score": 0.8,
        "age_limit": 18,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B0012I8B0Y",
        "year": 2007,
        "poster": "https://image.tmdb.org/t/p/w500/bj1v6YKF8yHqA489VFfnQvOJpnc.jpg",
        "synopsis": "Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and a suitcase full of cash in the desert.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "Paramount+", "url": "https://www.paramountplus.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B0012I8B0Y"}
        ]
    },
    {
        "movie_id": 24,
        "title": "WALL-E",
        "genre": ["Animation", "Sci-Fi", "Family"],
        "experience_type": "relaxing",
        "rating_percent": 95,
        "popularity_score": 0.8,
        "age_limit": 0,
        "netflix_url": "",
        "prime_url": "",
        "year": 2008,
        "poster": "https://image.tmdb.org/t/p/w500/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg",
        "synopsis": "In a distant future, a small waste-collecting robot inadvertently embarks on a space journey that will decide the fate of mankind.",
        "tags": ["family-safe", "cult"],
        "ottPlatforms": [
            {"name": "Disney+", "url": "https://www.disneyplus.com/movies/wall-e/5G1wpZC2Lb6I"}
        ]
    },
    {
        "movie_id": 25,
        "title": "Her",
        "genre": ["Sci-Fi", "Romance", "Drama"],
        "experience_type": "emotional",
        "rating_percent": 82,
        "popularity_score": 0.7,
        "age_limit": 13,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B00HHJR5PO",
        "year": 2013,
        "poster": "https://image.tmdb.org/t/p/w500/70NBqsoTHo7fOwcK4urZEFaGOSw.jpg",
        "synopsis": "In a near future, a lonely writer develops an unlikely relationship with an operating system designed to meet his every need.",
        "tags": ["underrated"],
        "ottPlatforms": [
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B00HHJR5PO"},
            {"name": "Apple TV", "url": "https://tv.apple.com"}
        ]
    },
    {
        "movie_id": 26,
        "title": "The Dark Knight",
        "genre": ["Action", "Crime", "Drama"],
        "experience_type": "intense",
        "rating_percent": 90,
        "popularity_score": 1,
        "age_limit": 13,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B001I189MG",
        "year": 2008,
        "poster": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        "synopsis": "Batman raises the stakes in his war on crime, facing off against the Joker, a criminal mastermind who wreaks havoc on Gotham City.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "HBO Max", "url": "https://www.hbomax.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B001I189MG"}
        ]
    },
    {
        "movie_id": 27,
        "title": "Paddington 2",
        "genre": ["Comedy", "Family", "Adventure"],
        "experience_type": "fun",
        "rating_percent": 93,
        "popularity_score": 0.7,
        "age_limit": 0,
        "netflix_url": "https://www.netflix.com",
        "prime_url": "https://www.amazon.com/dp/B079DZ5XWD",
        "year": 2017,
        "poster": "https://image.tmdb.org/t/p/w500/m9m0v5819vB539mK73fH2A5S37R.jpg",
        "synopsis": "Paddington, now settled with the Brown family in London, picks up a series of odd jobs to buy the perfect present, but must clear his name when the gift is stolen.",
        "tags": ["family-safe", "underrated"],
        "ottPlatforms": [
            {"name": "Netflix", "url": "https://www.netflix.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B079DZ5XWD"}
        ]
    },
    {
        "movie_id": 28,
        "title": "Eternal Sunshine of the Spotless Mind",
        "genre": ["Romance", "Drama", "Sci-Fi"],
        "experience_type": "emotional",
        "rating_percent": 82,
        "popularity_score": 0.8,
        "age_limit": 16,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B000JLQUZI",
        "year": 2004,
        "poster": "https://image.tmdb.org/t/p/w500/5MwkWH9tYHv3mV9OdYTMR5qreIz.jpg",
        "synopsis": "When their relationship turns sour, a couple undergoes a medical procedure to have each other erased from their memories.",
        "tags": ["cult", "underrated"],
        "ottPlatforms": [
            {"name": "Peacock", "url": "https://www.peacocktv.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B000JLQUZI"}
        ]
    },
    {
        "movie_id": 29,
        "title": "John Wick",
        "genre": ["Action", "Thriller"],
        "experience_type": "intense",
        "rating_percent": 75,
        "popularity_score": 0.8,
        "age_limit": 18,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B00R0291Q2",
        "year": 2014,
        "poster": "https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg",
        "synopsis": "An ex-hitman comes out of retirement to track down the gangsters that killed his dog and took everything from him.",
        "tags": [],
        "ottPlatforms": [
            {"name": "Peacock", "url": "https://www.peacocktv.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B00R0291Q2"}
        ]
    },
    {
        "movie_id": 30,
        "title": "Ratatouille",
        "genre": ["Animation", "Comedy", "Family"],
        "experience_type": "fun",
        "rating_percent": 92,
        "popularity_score": 0.8,
        "age_limit": 0,
        "netflix_url": "",
        "prime_url": "",
        "year": 2007,
        "poster": "https://image.tmdb.org/t/p/w500/cghrtuHdD8uujxQjG8czKQ635AJ.jpg",
        "synopsis": "A rat named Remy dreams of becoming a great chef and tries to achieve his goal by forming an alliance with a Parisian restaurant's garbage boy.",
        "tags": ["family-safe"],
        "ottPlatforms": [
            {"name": "Disney+", "url": "https://www.disneyplus.com/movies/ratatouille/39wmItIWsg5s"}
        ]
    },
    {
        "movie_id": 31,
        "title": "The Departed",
        "genre": ["Crime", "Thriller", "Drama"],
        "experience_type": "intense",
        "rating_percent": 85,
        "popularity_score": 0.8,
        "age_limit": 18,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B000P0J0AI",
        "year": 2006,
        "poster": "https://image.tmdb.org/t/p/w500/ydomtut0UATCxnzdNdPiYTKtcwf.jpg",
        "synopsis": "An undercover cop and a mole in the police try to identify each other while infiltrating an Irish gang in Boston.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "HBO Max", "url": "https://www.hbomax.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B000P0J0AI"}
        ]
    },
    {
        "movie_id": 32,
        "title": "Howl's Moving Castle",
        "genre": ["Animation", "Fantasy", "Romance"],
        "experience_type": "relaxing",
        "rating_percent": 87,
        "popularity_score": 0.7,
        "age_limit": 0,
        "netflix_url": "https://www.netflix.com",
        "prime_url": "",
        "year": 2004,
        "poster": "https://image.tmdb.org/t/p/w500/mEh0NFn1C3PdbLScbooFMoaM5ET.jpg",
        "synopsis": "When a young hat-maker is turned into an old woman by a witch's curse, she finds refuge in the magical moving castle of the wizard Howl.",
        "tags": ["family-safe", "cult"],
        "ottPlatforms": [
            {"name": "Netflix", "url": "https://www.netflix.com"},
            {"name": "HBO Max", "url": "https://www.hbomax.com"}
        ]
    },
    {
        "movie_id": 33,
        "title": "Parasite",
        "genre": ["Thriller", "Drama", "Comedy"],
        "experience_type": "intense",
        "rating_percent": 96,
        "popularity_score": 0.9,
        "age_limit": 16,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B07YM14FPF",
        "year": 2019,
        "poster": "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
        "synopsis": "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "Hulu", "url": "https://www.hulu.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B07YM14FPF"}
        ]
    },
    {
        "movie_id": 34,
        "title": "Before Sunrise",
        "genre": ["Romance", "Drama"],
        "experience_type": "relaxing",
        "rating_percent": 81,
        "popularity_score": 0.6,
        "age_limit": 13,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B00AEFXVYM",
        "year": 1995,
        "poster": "https://image.tmdb.org/t/p/w500/9ehLZcm6rRIePqcKN2Wzak5aGWM.jpg",
        "synopsis": "A young man and woman meet on a train and end up spending one romantic evening together in Vienna before going their separate ways.",
        "tags": ["underrated"],
        "ottPlatforms": [
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B00AEFXVYM"},
            {"name": "Apple TV", "url": "https://tv.apple.com"}
        ]
    },
    {
        "movie_id": 35,
        "title": "Whiplash",
        "genre": ["Drama", "Music"],
        "experience_type": "intense",
        "rating_percent": 94,
        "popularity_score": 0.8,
        "age_limit": 16,
        "netflix_url": "https://www.netflix.com",
        "prime_url": "https://www.amazon.com/dp/B00QGHB8D0",
        "year": 2014,
        "poster": "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
        "synopsis": "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an abusive instructor.",
        "tags": ["cult", "underrated"],
        "ottPlatforms": [
            {"name": "Netflix", "url": "https://www.netflix.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B00QGHB8D0"}
        ]
    },
    {
        "movie_id": 36,
        "title": "Soul",
        "genre": ["Animation", "Fantasy", "Comedy"],
        "experience_type": "emotional",
        "rating_percent": 89,
        "popularity_score": 0.7,
        "age_limit": 0,
        "netflix_url": "",
        "prime_url": "",
        "year": 2020,
        "poster": "https://image.tmdb.org/t/p/w500/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg",
        "synopsis": "A middle-school music teacher's passion for jazz leads him on an extraordinary journey to discover what it means to have a soul.",
        "tags": ["family-safe"],
        "ottPlatforms": [
            {"name": "Disney+", "url": "https://www.disneyplus.com/movies/soul/77tlWpb1AWsC"}
        ]
    },
    {
        "movie_id": 37,
        "title": "Goodfellas",
        "genre": ["Crime", "Drama"],
        "experience_type": "intense",
        "rating_percent": 87,
        "popularity_score": 0.9,
        "age_limit": 18,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B0011TNRNE",
        "year": 1990,
        "poster": "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
        "synopsis": "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "HBO Max", "url": "https://www.hbomax.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B0011TNRNE"}
        ]
    },
    {
        "movie_id": 38,
        "title": "The Princess Bride",
        "genre": ["Adventure", "Comedy", "Fantasy"],
        "experience_type": "fun",
        "rating_percent": 84,
        "popularity_score": 0.8,
        "age_limit": 0,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B00AOT8JUC",
        "year": 1987,
        "poster": "https://image.tmdb.org/t/p/w500/lxmULlro6055tZr14ZI91TFtq58.jpg",
        "synopsis": "A farmhand-turned-pirate encounters numerous obstacles, enemies, and allies in his quest to be reunited with his true love.",
        "tags": ["cult", "family-safe"],
        "ottPlatforms": [
            {"name": "Disney+", "url": "https://www.disneyplus.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B00AOT8JUC"}
        ]
    },
    {
        "movie_id": 39,
        "title": "A Quiet Place",
        "genre": ["Horror", "Thriller"],
        "experience_type": "intense",
        "rating_percent": 80,
        "popularity_score": 0.7,
        "age_limit": 16,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B07BZ5HMTH",
        "year": 2018,
        "poster": "https://image.tmdb.org/t/p/w500/nAU74GmpUk7t5iklEp3bufwDq4n.jpg",
        "synopsis": "A family is forced to live in silence while hiding from creatures that hunt by sound, finding new ways to survive in a post-apocalyptic world.",
        "tags": ["underrated"],
        "ottPlatforms": [
            {"name": "Paramount+", "url": "https://www.paramountplus.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B07BZ5HMTH"}
        ]
    },
    {
        "movie_id": 40,
        "title": "The Lion King",
        "genre": ["Animation", "Adventure", "Family"],
        "experience_type": "emotional",
        "rating_percent": 88,
        "popularity_score": 0.9,
        "age_limit": 0,
        "netflix_url": "",
        "prime_url": "",
        "year": 1994,
        "poster": "https://image.tmdb.org/t/p/w500/2rEJ8jPjyjMIYAmTqRbLdrHud5r.jpg",
        "synopsis": "A young lion prince flees his kingdom after the murder of his father, only to learn the true meaning of responsibility and bravery.",
        "tags": ["cult", "family-safe"],
        "ottPlatforms": [
            {"name": "Disney+", "url": "https://www.disneyplus.com/movies/the-lion-king/1HqwiEcje6Nj"}
        ]
    },
    {
        "movie_id": 41,
        "title": "Dune",
        "genre": ["Sci-Fi", "Adventure"],
        "experience_type": "intense",
        "rating_percent": 83,
        "popularity_score": 0.95,
        "age_limit": 13,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B09J5D7GV1",
        "year": 2021,
        "poster": "https://image.tmdb.org/t/p/w500/5F6GBIdWpRk6f52FX5VipK57vuv.jpg",
        "synopsis": "Paul Atreides, a brilliant and gifted young man, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "HBO Max", "url": "https://www.hbomax.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B09J5D7GV1"}
        ]
    },
    {
        "movie_id": 42,
        "title": "Everything Everywhere All at Once",
        "genre": ["Sci-Fi", "Comedy", "Action"],
        "experience_type": "fun",
        "rating_percent": 89,
        "popularity_score": 0.9,
        "age_limit": 16,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B09X5XHHKD",
        "year": 2022,
        "poster": "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
        "synopsis": "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes.",
        "tags": ["cult", "underrated"],
        "ottPlatforms": [
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B09X5XHHKD"}
        ]
    },
    {
        "movie_id": 43,
        "title": "The Batman",
        "genre": ["Action", "Crime", "Drama"],
        "experience_type": "intense",
        "rating_percent": 85,
        "popularity_score": 0.88,
        "age_limit": 13,
        "netflix_url": "",
        "prime_url": "",
        "year": 2022,
        "poster": "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        "synopsis": "When a sadistic serial killer begins murdering key political figures, Batman is forced to investigate the city's hidden corruption.",
        "tags": [],
        "ottPlatforms": [
            {"name": "HBO Max", "url": "https://www.hbomax.com"}
        ]
    },
    {
        "movie_id": 44,
        "title": "Top Gun: Maverick",
        "genre": ["Action", "Drama"],
        "experience_type": "fun",
        "rating_percent": 88,
        "popularity_score": 0.92,
        "age_limit": 13,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B0B2KSYRLQ",
        "year": 2022,
        "poster": "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
        "synopsis": "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN's elite graduates on a mission.",
        "tags": [],
        "ottPlatforms": [
            {"name": "Paramount+", "url": "https://www.paramountplus.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B0B2KSYRLQ"}
        ]
    },
    {
        "movie_id": 45,
        "title": "La La Land",
        "genre": ["Comedy", "Drama", "Romance"],
        "experience_type": "emotional",
        "rating_percent": 80,
        "popularity_score": 0.82,
        "age_limit": 13,
        "netflix_url": "https://www.netflix.com",
        "prime_url": "",
        "year": 2016,
        "poster": "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
        "synopsis": "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
        "tags": [],
        "ottPlatforms": [
            {"name": "Netflix", "url": "https://www.netflix.com"}
        ]
    },
    {
        "movie_id": 46,
        "title": "Spider-Man: Into the Spider-Verse",
        "genre": ["Animation", "Action", "Adventure"],
        "experience_type": "fun",
        "rating_percent": 84,
        "popularity_score": 0.88,
        "age_limit": 0,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com",
        "year": 2018,
        "poster": "https://image.tmdb.org/t/p/w500/hpaIwkvV6Pqe7pjR41TQ37bLbFR.jpg",
        "synopsis": "Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.",
        "tags": ["family-safe", "cult"],
        "ottPlatforms": [
            {"name": "Prime Video", "url": "https://www.amazon.com"}
        ]
    },
    {
        "movie_id": 47,
        "title": "Knives Out",
        "genre": ["Comedy", "Crime", "Drama"],
        "experience_type": "fun",
        "rating_percent": 79,
        "popularity_score": 0.81,
        "age_limit": 13,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com/dp/B082L42V5B",
        "year": 2019,
        "poster": "https://image.tmdb.org/t/p/w500/3vldwDuMGJvZIx7e0a3AULGCjee.jpg",
        "synopsis": "A detective investigates the death of a patriarch of an eccentric, combative family.",
        "tags": [],
        "ottPlatforms": [
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B082L42V5B"}
        ]
    },
    {
        "movie_id": 48,
        "title": "Gladiator",
        "genre": ["Action", "Adventure", "Drama"],
        "experience_type": "intense",
        "rating_percent": 85,
        "popularity_score": 0.84,
        "age_limit": 16,
        "netflix_url": "https://www.netflix.com",
        "prime_url": "https://www.amazon.com/dp/B000I9URAS",
        "year": 2000,
        "poster": "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
        "synopsis": "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
        "tags": ["cult"],
        "ottPlatforms": [
            {"name": "Netflix", "url": "https://www.netflix.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com/dp/B000I9URAS"}
        ]
    },
    {
        "movie_id": 49,
        "title": "Arrival",
        "genre": ["Drama", "Sci-Fi"],
        "experience_type": "emotional",
        "rating_percent": 79,
        "popularity_score": 0.77,
        "age_limit": 13,
        "netflix_url": "https://www.netflix.com",
        "prime_url": "",
        "year": 2016,
        "poster": "https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
        "synopsis": "A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.",
        "tags": ["underrated"],
        "ottPlatforms": [
            {"name": "Netflix", "url": "https://www.netflix.com"},
            {"name": "Paramount+", "url": "https://www.paramountplus.com"}
        ]
    },
    {
        "movie_id": 50,
        "title": "Ex Machina",
        "genre": ["Drama", "Sci-Fi", "Thriller"],
        "experience_type": "intense",
        "rating_percent": 77,
        "popularity_score": 0.75,
        "age_limit": 16,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com",
        "year": 2014,
        "poster": "https://image.tmdb.org/t/p/w500/4JUNWIy9fmPunDlICM83FQ8Mnf5.jpg",
        "synopsis": "A young programmer is selected to participate in a ground-breaking experiment in synthetic intelligence by evaluating the human qualities of a highly advanced humanoid A.I.",
        "tags": ["underrated"],
        "ottPlatforms": [
            {"name": "HBO Max", "url": "https://www.hbomax.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com"}
        ]
    },
    {
        "movie_id": 51,
        "title": "Joker",
        "genre": ["Crime", "Drama", "Thriller"],
        "experience_type": "intense",
        "rating_percent": 84,
        "popularity_score": 0.88,
        "age_limit": 18,
        "netflix_url": "",
        "prime_url": "https://www.amazon.com",
        "year": 2019,
        "poster": "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
        "synopsis": "In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime.",
        "tags": [],
        "ottPlatforms": [
            {"name": "HBO Max", "url": "https://www.hbomax.com"},
            {"name": "Prime Video", "url": "https://www.amazon.com"}
        ]
    }
];

if (typeof module !== 'undefined') {
    module.exports = MOVIES;
}
