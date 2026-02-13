"""
Blog Post Model
"""

class Post:
    def __init__(self, title, content, author):
        self.title = title
        self.content = content
        self.author = author
        self.created_at = None
        self.updated_at = None
    
    def to_dict(self):
        return {
            'title': self.title,
            'content': self.content,
            'author': self.author,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
