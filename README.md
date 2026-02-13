# Blogger App

A simple blogging application for creating and managing blog posts.

## Features

- Create blog posts
- View all posts
- View individual posts

### Planned Features
- Edit existing posts
- Delete posts
- Comment on posts

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the application:
   ```bash
   python app.py
   ```
   
   For development with debug mode:
   ```bash
   export FLASK_DEBUG=true
   python app.py
   ```

3. Access at http://localhost:5000

## Running Tests

```bash
python test_app.py
```

## Branch Synchronization

If your branch diverges from main, see [SYNC_GUIDE.md](SYNC_GUIDE.md) for instructions on how to synchronize.

## Usage

This application provides a web interface for managing blog posts:
- Home page: View all blog posts
- Create new post: `/post/new`
- View individual post: `/post/<id>`
