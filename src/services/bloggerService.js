/**
 * Blogger API Service
 * 
 * Publish voice journal entries as blog posts on Blogger.
 * Uses Blogger API v3 for post creation and management.
 * 
 * API Reference: https://developers.google.com/blogger/docs/3.0/reference
 */

import { ensureValidToken } from './googleAuth';

const BLOGGER_API_URL = 'https://www.googleapis.com/blogger/v3';

/**
 * Get list of user's blogs
 * 
 * @returns {Promise<Array<{id: string, name: string, url: string}>>}
 */
export async function getUserBlogs() {
  try {
    const token = await ensureValidToken();

    const response = await fetch(`${BLOGGER_API_URL}/users/self/blogs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch blogs');
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items.map(blog => ({
      id: blog.id,
      name: blog.name,
      url: blog.url,
      description: blog.description,
      posts: blog.posts?.totalItems || 0,
    }));
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw new Error(`Failed to get blogs: ${error.message}`);
  }
}

/**
 * Create HTML content for blog post from snippet
 * 
 * @param {Object} snippet - Snippet data
 * @param {string} transcript - Transcribed text
 * @param {string} imageUrl - Optional image URL (from Drive)
 * @returns {string} - HTML content
 */
function createPostContent(snippet, transcript, imageUrl = null) {
  const date = new Date(snippet.createdAt);
  const formattedDate = date.toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  let html = `<div class="voice-journal-entry">`;
  
  // Add image if present
  if (imageUrl) {
    html += `<p style="text-align: center;"><img src="${imageUrl}" alt="Journal entry image" style="max-width: 600px; width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;" /></p>`;
  }
  
  // Add caption if present
  if (snippet.caption) {
    html += `<blockquote><p>${escapeHtml(snippet.caption)}</p></blockquote>`;
  }
  
  // Add transcript
  if (transcript && transcript.trim().length > 0) {
    console.log('[bloggerService] Adding transcript to post content, length:', transcript.length);
    html += `<div class="transcript">`;
    html += `<p>${escapeHtml(transcript).replace(/\n/g, '</p><p>')}</p>`;
    html += `</div>`;
  } else {
    console.log('[bloggerService] No transcript to add (empty or whitespace only)');
  }
  
  // Add timestamp at the end
  html += `<p class="timestamp"><em>Recorded on ${formattedDate}</em></p>`;
  
  html += `</div>`;
  
  console.log('[bloggerService] Generated HTML:', html);
  console.log('[bloggerService] Image URL:', imageUrl);
  console.log('[bloggerService] Has duration?', snippet.duration);
  
  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate post title from transcript or timestamp
 */
function generatePostTitle(snippet, transcript) {
  // Use first line of transcript as title (up to 100 chars)
  if (transcript) {
    const firstLine = transcript.split('\n')[0].trim();
    if (firstLine.length > 0) {
      return firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine;
    }
  }
  
  // Use caption as title if present
  if (snippet.caption) {
    const caption = snippet.caption.trim();
    return caption.length > 100 ? caption.substring(0, 97) + '...' : caption;
  }
  
  // Fallback to date-based title
  const date = new Date(snippet.createdAt);
  return `Journal Entry - ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

/**
 * Publish snippet as blog post
 * 
 * @param {string} blogId - Blogger blog ID
 * @param {Object} snippet - Snippet data
 * @param {string} transcript - Transcribed text (required for audio)
 * @param {string} imageUrl - Optional image URL from Drive
 * @param {Object} options - Publishing options
 * @returns {Promise<{id: string, url: string, published: string}>}
 */
export async function publishPost(blogId, snippet, transcript = '', imageUrl = null, options = {}) {
  try {
    const token = await ensureValidToken();
    
    // VERSION MARKER - Confirm which code is deployed
    console.log('[bloggerService] VERSION: 2026-02-17-21:58 - 600px responsive images');

    const {
      isDraft = false,
      labels = ['voice-journal'],
      customTitle = null,
    } = options;

    console.log('[bloggerService] publishPost called with:', {
      blogId,
      snippetId: snippet.id,
      snippetType: snippet.type,
      transcriptLength: transcript?.length || 0,
      transcriptPreview: transcript?.substring(0, 50),
      hasImageUrl: !!imageUrl
    });

    const title = customTitle || generatePostTitle(snippet, transcript);
    const content = createPostContent(snippet, transcript, imageUrl);

    console.log('[bloggerService] Generated content:', {
      titleLength: title.length,
      contentLength: content.length,
      contentPreview: content.substring(0, 200)
    });

    const postData = {
      kind: 'blogger#post',
      title: title,
      content: content,
      labels: labels,
    };

    const endpoint = isDraft 
      ? `${BLOGGER_API_URL}/blogs/${blogId}/posts?isDraft=true`
      : `${BLOGGER_API_URL}/blogs/${blogId}/posts`;

    const response = await fetch(endpoint + (isDraft ? '' : '?isDraft=false'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to publish post');
    }

    const data = await response.json();
    
    return {
      id: data.id,
      url: data.url,
      published: data.published,
      title: data.title,
    };
  } catch (error) {
    console.error('Error publishing post:', error);
    throw new Error(`Failed to publish: ${error.message}`);
  }
}

/**
 * Update existing blog post
 * 
 * @param {string} blogId - Blogger blog ID
 * @param {string} postId - Post ID to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<{id: string, url: string}>}
 */
export async function updatePost(blogId, postId, updates) {
  try {
    const token = await ensureValidToken();

    const response = await fetch(`${BLOGGER_API_URL}/blogs/${blogId}/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to update post');
    }

    const data = await response.json();
    
    return {
      id: data.id,
      url: data.url,
      title: data.title,
    };
  } catch (error) {
    console.error('Error updating post:', error);
    throw new Error(`Failed to update post: ${error.message}`);
  }
}

/**
 * Delete blog post
 * 
 * @param {string} blogId - Blogger blog ID
 * @param {string} postId - Post ID to delete
 * @returns {Promise<void>}
 */
export async function deletePost(blogId, postId) {
  try {
    const token = await ensureValidToken();

    const response = await fetch(`${BLOGGER_API_URL}/blogs/${blogId}/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to delete post');
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    throw new Error(`Failed to delete post: ${error.message}`);
  }
}

/**
 * Get recent posts from blog
 * 
 * @param {string} blogId - Blogger blog ID
 * @param {number} maxResults - Maximum posts to return (default: 10)
 * @returns {Promise<Array>}
 */
export async function getRecentPosts(blogId, maxResults = 10) {
  try {
    const token = await ensureValidToken();

    const response = await fetch(
      `${BLOGGER_API_URL}/blogs/${blogId}/posts?maxResults=${maxResults}&orderBy=published&fields=items(id,title,url,published,labels)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch posts');
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw new Error(`Failed to get posts: ${error.message}`);
  }
}

/**
 * Publish snippet with full workflow:
 * 1. Transcribe audio (if needed)
 * 2. Upload image to Drive (if present)
 * 3. Publish to Blogger
 * 
 * @param {string} blogId - Blogger blog ID
 * @param {Object} snippet - Full snippet object
 * @param {Object} options - Publishing options
 * @returns {Promise<{postId: string, postUrl: string, driveImageId: string}>}
 */
export async function publishSnippetComplete(blogId, snippet, options = {}) {
  // This is a high-level function that would coordinate:
  // - speechToTextService.transcribeAudio() if snippet.type === 'audio'
  // - driveService.uploadImage() if snippet has image
  // - publishPost() with all the gathered data
  
  // Implementation note: This should be done in the App component
  // to properly handle progress updates and error states
  
  throw new Error('Use publishPost() with pre-processed data. See App.jsx for full workflow.');
}
