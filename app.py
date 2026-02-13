"""
Blogger App - Main Application
"""

from flask import Flask, render_template, request, redirect, url_for
from datetime import datetime
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# In-memory storage for blog posts
posts = []

@app.route('/')
def index():
    """Display all blog posts"""
    return render_template('index.html', posts=posts)

@app.route('/post/new', methods=['GET', 'POST'])
def new_post():
    """Create a new blog post"""
    if request.method == 'POST':
        post = {
            'id': len(posts) + 1,
            'title': request.form['title'],
            'content': request.form['content'],
            'author': request.form['author'],
            'created_at': datetime.now()
        }
        posts.append(post)
        return redirect(url_for('index'))
    return render_template('new_post.html')

@app.route('/post/<int:post_id>')
def view_post(post_id):
    """View a single blog post"""
    post = next((p for p in posts if p['id'] == post_id), None)
    if post:
        return render_template('post.html', post=post)
    return "Post not found", 404

if __name__ == '__main__':
    app.run(debug=True)
