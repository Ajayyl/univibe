import unittest
import numpy as np
import sys
import os

# To allow importing from parent backend folder
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.main import RLEngine, genre_score

class TestMovie Recommendation SystemCore(unittest.TestCase):
    
    def test_calculate_reward_click(self):
        """Test RL weight for a standard click event."""
        reward = RLEngine.calculate_reward("click")
        self.assertEqual(reward, 1.0)

    def test_calculate_reward_rating_positive(self):
        """Test RL weight for high rating (>4)."""
        reward = RLEngine.calculate_reward("rating", "5")
        self.assertEqual(reward, 2.5)

    def test_calculate_reward_rating_negative(self):
        """Test RL penalty for poor rating (<3)."""
        reward = RLEngine.calculate_reward("rating", "1")
        self.assertEqual(reward, -1.5)

    def test_genre_score_match(self):
        """Test scoring of movie genres against user preferences."""
        user_pref = {'Action': 0.6, 'Sci-Fi': 0.4}
        movie_genres = "Action|Drama"
        score = genre_score(movie_genres, user_pref)
        self.assertEqual(score, 0.6)

    def test_genre_score_no_match(self):
        """Test scoring when movie genres do not match user preferences."""
        user_pref = {'Romance': 1.0}
        movie_genres = "Horror|Mystery"
        score = genre_score(movie_genres, user_pref)
        self.assertEqual(score, 0.0)

if __name__ == '__main__':
    unittest.main()
