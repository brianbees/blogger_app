"""
Unit tests for the Blogger App
"""

import unittest
from app import app, posts, next_post_id
import app as app_module

class BloggerAppTestCase(unittest.TestCase):
    
    def setUp(self):
        """Set up test client"""
        self.app = app.test_client()
        self.app.testing = True
        # Clear posts and reset ID counter
        posts.clear()
        app_module.next_post_id = 1
    
    def test_index_page(self):
        """Test the index page loads"""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
    
    def test_new_post_page(self):
        """Test the new post page loads"""
        response = self.app.get('/post/new')
        self.assertEqual(response.status_code, 200)
    
    def test_create_post(self):
        """Test creating a new post"""
        response = self.app.post('/post/new', data={
            'title': 'Test Post',
            'content': 'This is a test post content',
            'author': 'Test Author'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(posts), 1)
        self.assertEqual(posts[0]['title'], 'Test Post')

if __name__ == '__main__':
    unittest.main()
