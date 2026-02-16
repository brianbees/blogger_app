# Contributing to Voice Journal

Thank you for your interest in contributing to Voice Journal! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- **Node.js 20+** and npm
- Modern browser with support for MediaRecorder API
- Git for version control
- Optional: Google Cloud account (for testing cloud features)

### Local Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/blogger_app.git
   cd blogger_app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   - Navigate to `https://localhost:5173`
   - Accept the self-signed certificate warning (dev only)

## Development Workflow

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   Or for bug fixes:
   ```bash
   git checkout -b fix/issue-description
   ```

2. **Make your changes**:
   - Follow the coding style guidelines below
   - Write clear, descriptive commit messages
   - Test your changes thoroughly

3. **Run linting** (if configured):
   ```bash
   npm run lint
   ```

4. **Build and test**:
   ```bash
   npm run build
   npm run preview
   ```

5. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add description of your feature"
   ```
   Or for bug fixes:
   ```bash
   git commit -m "fix: describe what was fixed"
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**:
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your branch and provide a clear description
   - Reference any related issues

### Commit Message Guidelines

Follow conventional commit format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat: add audio visualizer during recording

- Implement real-time frequency bar visualization
- Use Web Audio API for frequency analysis
- Add 40-bar display at bottom of record panel
```

## Coding Standards

### JavaScript/React

- **Modern JavaScript**: Use ES6+ features (arrow functions, destructuring, async/await)
- **React Hooks**: Use functional components with hooks (no class components)
- **Component Structure**: One component per file
- **Props**: Use destructuring for props
- **State Management**: Keep state in the appropriate component level
- **Naming Conventions**:
  - Components: PascalCase (e.g., `SnippetCard.jsx`)
  - Functions: camelCase (e.g., `saveSnippet`)
  - Constants: UPPER_SNAKE_CASE (e.g., `API_KEY`)

### CSS/Tailwind

- **Tailwind Classes**: Use Tailwind utility classes for styling
- **Custom CSS**: Only add custom CSS when Tailwind is insufficient
- **Responsive Design**: Mobile-first approach, test on various screen sizes
- **Dark Mode**: Consider dark mode when applicable

### Code Organization

```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── services/       # API integration services
└── utils/          # Utility functions
```

- **Components**: Keep components focused and reusable
- **Services**: Separate API logic from components
- **Utils**: Pure functions for data manipulation
- **Hooks**: Extract reusable logic into custom hooks

### Comments and Documentation

- **JSDoc**: Add JSDoc comments for complex functions
- **Inline Comments**: Explain "why", not "what"
- **README Updates**: Update documentation when adding features
- **Type Hints**: Consider adding JSDoc type hints

Example:
```javascript
/**
 * Transcribe audio blob to text using Google Speech-to-Text API
 * @param {Blob} audioBlob - Audio data in WEBM, OGG, or MP3 format
 * @param {string} languageCode - BCP-47 language code (default: 'en-GB')
 * @returns {Promise<string>} Transcribed text with punctuation
 */
export async function transcribeAudio(audioBlob, languageCode = 'en-GB') {
  // Implementation...
}
```

## Testing

### Manual Testing

Before submitting a PR, test the following:

- ✅ **Voice Recording**: Record and playback audio
- ✅ **Image Upload**: Upload images with captions
- ✅ **Data Persistence**: Reload page and verify data persists
- ✅ **Export/Import**: Export and import data
- ✅ **Mobile View**: Test on mobile/responsive view
- ✅ **PWA Install**: Test installation as PWA (if applicable)

### Testing Cloud Features

If your changes affect cloud features:

- ✅ **OAuth**: Sign in/out flow
- ✅ **Transcription**: Audio transcription
- ✅ **Publishing**: Publish to Blogger
- ✅ **Drive Upload**: Image upload to Google Drive

Refer to [docs/deployment.md](docs/deployment.md) for setting up test credentials.

## Documentation

### When to Update Documentation

Update documentation when:

- Adding new features
- Changing API interfaces
- Modifying configuration
- Fixing bugs that affect usage
- Adding new dependencies

### Which Files to Update

- **README.md**: User-facing features and quick start
- **docs/user-guide.md**: User instructions
- **docs/technical.md**: Architecture and technical details
- **docs/deployment.md**: Deployment and configuration
- **docs/notes/**: Time-based updates and release notes

## Pull Request Process

1. **Title**: Clear, descriptive title
2. **Description**: 
   - What does this PR do?
   - Why is this change needed?
   - How was it tested?
   - Screenshots (if UI changes)
3. **Link Issues**: Reference related issues using `#issue-number`
4. **Keep it Focused**: One feature or fix per PR
5. **Update Docs**: Include documentation updates
6. **Respond to Feedback**: Be responsive to review comments

### PR Review Checklist

Before submitting, ensure:

- [ ] Code follows the style guidelines
- [ ] No console.log or debugging code
- [ ] No commented-out code
- [ ] Documentation is updated
- [ ] Tested locally
- [ ] No merge conflicts
- [ ] Commit messages are clear

## Questions or Need Help?

- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Documentation**: Check [docs/](docs/) for technical details
- **Discussions**: Use GitHub Discussions for questions

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Welcome newcomers and help them learn

## License

By contributing to Voice Journal, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Voice Journal! 🎉
