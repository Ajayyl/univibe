import unittest
import requests
import time
import subprocess
import os
import signal

class TestMovie Recommendation SystemIntegration(unittest.TestCase):
    API_URL = "http://localhost:8000"

    def test_health_check(self):
        """Verify the backend is responsive."""
        try:
            response = requests.get(f"{self.API_URL}/movies?limit=1")
            self.assertEqual(response.status_code, 200)
        except requests.exceptions.ConnectionError:
            self.fail("Backend server not running at http://localhost:8000")

    def test_movie_catalog_endpoint(self):
        """Verify fetching the movie catalog returns valid data."""
        response = requests.get(f"{self.API_URL}/movies?limit=2")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(isinstance(data, list))
        if data:
            self.assertIn('movie_id', data[0])
            self.assertIn('title', data[0])

    def test_tracking_endpoint(self):
        """Verify tracking an interaction queues properly."""
        payload = {
            "user_uid": "test_user_789",
            "movie_id": 101,
            "eventType": "click",
            "context": {"genre": "Action"}
        }
        response = requests.post(f"{self.API_URL}/track", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], "queued")

if __name__ == '__main__':
    unittest.main()
