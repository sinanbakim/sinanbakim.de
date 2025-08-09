// Global variables for JSON data and lookup maps
let pageData = {};
let userData = {};
let pageMap = {};
let sectionMap = {};
let articleMap = {};

// Load JSON data and initialize the app
document.addEventListener('DOMContentLoaded', () => {
	// Load both data.json and user.json
	Promise.all([fetch('/data.json').then((response) => response.json()), fetch('/user.json').then((response) => response.json())])
		.then(([data, user]) => {
			pageData = data;
			userData = user;

			// Create lookup maps for pages, sections, articles by id
			pageData.pages.forEach((p) => (pageMap[p.id] = p));
			pageData.sections.forEach((s) => (sectionMap[s.id] = s));
			pageData.articles.forEach((a) => (articleMap[a.id] = a));

			renderNavigation(pageData.pagetree);
			populateArticles(pageData.articles);
			setupContentLinks();
		})
		.catch((err) => {
			console.error('Error loading JSON:', err);
			// Fallback to github pages
			Promise.all([
				fetch('/sinanbakim.de/content/data.json').then((response) => response.json()),
				fetch('/sinanbakim.de/content/user.json').then((response) => response.json()),
			])
				.then(([data, user]) => {
					pageData = data;
					userData = user;

					// Create lookup maps for pages, sections, articles by id
					pageData.pages.forEach((p) => (pageMap[p.id] = p));
					pageData.sections.forEach((s) => (sectionMap[s.id] = s));
					pageData.articles.forEach((a) => (articleMap[a.id] = a));

					renderNavigation(pageData.pagetree);
					populateArticles(pageData.articles);
					setupContentLinks();
				})
				.catch((err) => console.error('Error loading JSON:', err));
		});

	document.getElementById('modal-close').addEventListener('click', closeModal);
	document.getElementById('modal').addEventListener('click', (e) => {
		if (e.target.id === 'modal') closeModal();
	});
	document.getElementById('back-btn').addEventListener('click', () => {
		// Return to main articles view
		document.getElementById('page-title').textContent = 'Sincap - Resonanz vor Rauschen';
		populateArticles(pageData.articles);
		document.getElementById('back-btn').classList.add('hidden');
	});
});

document.addEventListener('DOMContentLoaded', function () {
	console.log('Assets script loaded.');
});

// Render navigation using the pagetree from JSON
function renderNavigation(tree) {
	const nav = document.getElementById('navigation');
	nav.innerHTML = '';
	if (tree && tree.children) {
		tree.children.forEach((item) => {
			const link = document.createElement('a');
			link.href = '#';
			link.textContent = item.title;
			link.dataset.type = item.type;
			link.dataset.id = item.id;
			link.addEventListener('click', (e) => {
				e.preventDefault();
				if (item.type === 'article') {
					// Load article details if needed
					const article = articleMap[item.id];
					if (article) {
						loadArticle(article);
					}
				} else if (item.type === 'page') {
					const page = pageMap[item.id];
					if (page) {
						loadPage(page);
					}
				}
			});
			nav.appendChild(link);
		});
	}
}

// Style management system
const StyleManager = {
	loadedStyles: new Set(),
	inlineStyleCache: new Map(), // Cache for inline styles from tools

	loadStyle: function (styleName, elementId) {
		if (!styleName || this.loadedStyles.has(styleName)) {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = `/assets/styles/${styleName}.css`;
			link.dataset.styleName = styleName;
			link.dataset.scopeId = elementId;

			link.onload = () => {
				this.loadedStyles.add(styleName);
				console.log(`Style loaded: ${styleName} for element: ${elementId}`);
				resolve();
			};

			link.onerror = () => {
				console.warn(`Failed to load style: ${styleName}`);
				resolve(); // Don't reject, just continue without the style
			};

			document.head.appendChild(link);
		});
	},

	cacheInlineStyle: function (toolType, styleContent) {
		this.inlineStyleCache.set(toolType, styleContent);
		console.log(`Inline style cached for tool: ${toolType}`);
	},

	applyInlineStyle: function (toolType, elementId) {
		const cachedStyle = this.inlineStyleCache.get(toolType);
		if (!cachedStyle) return;

		// Generate scoped version of styles with section-specific prefix
		const sectionPrefix = `#${elementId}`;
		const scopedStyle = this.scopeInlineStyles(cachedStyle, sectionPrefix);

		// Check if style element already exists for this specific section
		const styleId = `inline-style-${toolType}-${elementId}`;
		let styleElement = document.getElementById(styleId);

		if (!styleElement) {
			styleElement = document.createElement('style');
			styleElement.id = styleId;
			styleElement.dataset.toolType = toolType;
			styleElement.dataset.scopeId = elementId;
			styleElement.textContent = scopedStyle;
			document.head.appendChild(styleElement);
			console.log(`Scoped inline style applied for tool: ${toolType} in section: ${elementId}`);
		}
	},

	scopeInlineStyles: function (styleContent, sectionPrefix) {
		// Parse and scope CSS rules to be section-specific
		const lines = styleContent.split('\n');
		let scopedStyle = '';
		let inRule = false;
		let currentRule = '';

		for (let line of lines) {
			const trimmedLine = line.trim();

			// Skip empty lines and comments
			if (!trimmedLine || trimmedLine.startsWith('/*')) {
				scopedStyle += line + '\n';
				continue;
			}

			// Check if this line contains a CSS selector (starts a new rule)
			if (trimmedLine.includes('{')) {
				inRule = true;
				// Extract the selector part before the opening brace
				const parts = trimmedLine.split('{');
				const selector = parts[0].trim();
				const restOfRule = parts.slice(1).join('{');

				// Scope the selector unless it's already scoped
				let scopedSelector = selector;
				if (!selector.startsWith(sectionPrefix)) {
					// Handle multiple selectors separated by commas
					const selectors = selector.split(',').map((s) => s.trim());
					const scopedSelectors = selectors.map((s) => {
						// Handle special selectors that need specific scoping
						if (s === 'body' || s === 'html') {
							// Replace body/html with section prefix
							return sectionPrefix;
						}
						// Handle @media, @keyframes, etc.
						else if (s.startsWith('@')) {
							// Keep @ rules as is but add section prefix to nested selectors later
							return s;
						}
						// Handle :root
						else if (s === ':root' || s.startsWith(':root')) {
							// Replace :root with section prefix
							return s.replace(':root', sectionPrefix);
						}
						// If selector starts with an element tag, scope it
						else if (s.match(/^[a-zA-Z]/)) {
							return `${sectionPrefix} ${s}`;
						}
						// If selector starts with class or id, scope it
						else if (s.startsWith('.') || s.startsWith('#')) {
							return `${sectionPrefix} ${s}`;
						}
						// If selector contains pseudo-classes, handle them
						else if (s.includes(':')) {
							const parts = s.split(':');
							return `${sectionPrefix} ${parts[0]}:${parts.slice(1).join(':')}`;
						} else {
							return `${sectionPrefix} ${s}`;
						}
					});
					scopedSelector = scopedSelectors.join(', ');
				}

				currentRule = `${scopedSelector} {${restOfRule}\n`;

				// Check if rule closes on same line
				if (trimmedLine.includes('}')) {
					inRule = false;
					scopedStyle += currentRule;
					currentRule = '';
				}
			} else if (trimmedLine.includes('}')) {
				// End of rule
				inRule = false;
				currentRule += line + '\n';
				scopedStyle += currentRule;
				currentRule = '';
			} else if (inRule) {
				// Inside a rule
				currentRule += line + '\n';
			} else {
				// Outside a rule (should be rare)
				scopedStyle += line + '\n';
			}
		}

		// Add any remaining rule content
		if (currentRule) {
			scopedStyle += currentRule;
		}

		return scopedStyle;
	},

	cleanupInlineStyles: function () {
		// Remove all inline style elements
		document.querySelectorAll('style[data-tool-type]').forEach((style) => {
			style.remove();
		});
	},

	applyScopeToElement: function (element, styleId, scopeClass) {
		if (!element || !scopeClass) return;

		// Add scope class to the element
		element.classList.add(scopeClass);
		element.dataset.styleScope = styleId;
	},

	cleanupUnusedStyles: function () {
		// Remove styles that are no longer needed
		const currentElements = document.querySelectorAll('[data-style-scope]');
		const usedStyles = new Set();

		currentElements.forEach((el) => {
			const styleScope = el.dataset.styleScope;
			if (styleScope) usedStyles.add(styleScope);
		});

		// Remove unused style links
		document.querySelectorAll('link[data-style-name]').forEach((link) => {
			const styleName = link.dataset.styleName;
			if (!usedStyles.has(styleName)) {
				link.remove();
				this.loadedStyles.delete(styleName);
			}
		});
	},
};

// Render user profile data
function renderUserProfile(contentType, container) {
	if (!userData || !contentType) return;

	const [dataType, subType] = contentType.split(':');

	if (dataType === 'user-profile') {
		switch (subType) {
			case 'personal':
				renderPersonalInfo(container);
				break;
			case 'projects':
				renderProjects(container);
				break;
			case 'workAreas':
				renderWorkAreas(container);
				break;
		}
	}
}

function renderPersonalInfo(container) {
	const personal = userData.personal;
	if (!personal) return;

	container.innerHTML = `
		<div class="hero-content">
			<div class="main-info">
				<div class="kicker">${personal.name} · ${personal.location}</div>
				<h1>${personal.title}</h1>
				<p class="lead">${personal.description}</p>
				<div class="badges">
					${personal.badges.map((badge) => `<span class="badge">${badge}</span>`).join('')}
				</div>
			</div>
			<div class="profile-details">
				<h3>Profil</h3>
				<div class="kv">
					<span>Rollen</span><div>${personal.profile.roles}</div>
					<span>Stärken</span><div>${personal.profile.strengths}</div>
					<span>Arbeitsweise</span><div>${personal.profile.workStyle}</div>
					<span>Haltung</span><div>${personal.profile.attitude}</div>
				</div>
			</div>
		</div>
	`;
}

function renderProjects(container) {
	const projects = userData.projects;
	if (!projects) return;

	container.innerHTML = `
		<div class="projects-container">
			${projects
				.map(
					(project) => `
				<article class="project-card">
					<div class="project-header">
						<strong class="project-title">${project.title}</strong>
						<span class="project-tag">${project.tag}</span>
					</div>
					<p class="project-description">${project.description}</p>
					${project.details ? `<p class="project-details">${project.details}</p>` : ''}
				</article>
			`,
				)
				.join('')}
		</div>
	`;
}

function renderWorkAreas(container) {
	const workAreas = userData.workAreas;
	if (!workAreas) return;

	container.innerHTML = `
		<div class="work-grid">
			${workAreas
				.map(
					(area) => `
				<div class="work-card">
					<h4>${area.title}</h4>
					<p>${area.description}</p>
				</div>
			`,
				)
				.join('')}
		</div>
	`;
}

// Populate main content with articles
function populateArticles(articles) {
	const content = document.getElementById('content');
	content.innerHTML = '';

	// Clean up old styles
	StyleManager.cleanupUnusedStyles();

	articles.forEach((article) => {
		const articleEl = document.createElement('article');
		articleEl.id = `article-${article.id}`;
		articleEl.innerHTML = `
			<h2>${article.title}</h2>
			<p>${article.content}</p>
			${article.pageId ? `<a href="#" class="page-link" data-id="${article.pageId}">More info</a>` : ''}
		`;

		// Apply style if specified
		if (article.style) {
			const scopeClass = `style-${article.style}`;
			StyleManager.applyScopeToElement(articleEl, article.style, scopeClass);
			StyleManager.loadStyle(article.style, articleEl.id);
		}

		content.appendChild(articleEl);
	});
}

// Set up delegated event listeners for links in content
function setupContentLinks() {
	document.getElementById('content').addEventListener('click', (e) => {
		if (e.target.classList.contains('page-link')) {
			e.preventDefault();
			const id = e.target.getAttribute('data-id');
			const page = pageMap[id];
			if (page) loadPage(page);
		}
		if (e.target.classList.contains('modal-link')) {
			e.preventDefault();
			const id = e.target.getAttribute('data-id');
			const sec = sectionMap[id];
			if (sec && sec.modalSections) {
				openModal(sec.modalSections);
			}
		}
	});
}

// Load an individual article (optional, for separate article view)
function loadArticle(article) {
	const content = document.getElementById('content');
	content.innerHTML = '';

	// Clean up old styles
	StyleManager.cleanupUnusedStyles();

	document.getElementById('page-title').textContent = article.title;
	document.getElementById('back-btn').classList.remove('hidden');

	const articleEl = document.createElement('article');
	articleEl.id = `article-${article.id}`;
	articleEl.innerHTML = `
		<p>${article.content}</p>
		${article.pageId ? `<a href="#" class="page-link" data-id="${article.pageId}">More info</a>` : ''}
	`;

	// Apply style if specified
	if (article.style) {
		const scopeClass = `style-${article.style}`;
		StyleManager.applyScopeToElement(articleEl, article.style, scopeClass);
		StyleManager.loadStyle(article.style, articleEl.id);
	}

	content.appendChild(articleEl);
}

// Load a page: replace main content with its sections
function loadPage(page) {
	const content = document.getElementById('content');
	content.innerHTML = '';

	// Clean up old styles and inline styles
	StyleManager.cleanupUnusedStyles();
	StyleManager.cleanupInlineStyles();

	document.getElementById('page-title').textContent = page.title;
	document.getElementById('back-btn').classList.remove('hidden');

	// Create page wrapper with page-specific styling
	const pageWrapper = document.createElement('div');
	pageWrapper.id = `page-${page.id}`;
	pageWrapper.className = 'page-wrapper';

	// Apply page style if specified
	if (page.style) {
		const scopeClass = `style-${page.style}`;
		StyleManager.applyScopeToElement(pageWrapper, page.style, scopeClass);
		StyleManager.loadStyle(page.style, pageWrapper.id);
	}

	// For each section id referenced in the page, render the corresponding section
	page.sections.forEach((secId) => {
		const sec = sectionMap[secId];
		if (sec) {
			const sectionEl = document.createElement('section');
			sectionEl.id = `section-${sec.id}`;

			// Check if this is an embedded tool
			if (sec.toolType) {
				sectionEl.innerHTML = `<h3>${sec.title}</h3>`;
				loadEmbeddedTool(sec.toolType, sectionEl, sec['inline-style']);
			} else if (sec.userData && sec.content.startsWith('user-profile:')) {
				sectionEl.innerHTML = `<h3>${sec.title}</h3>`;
				renderUserProfile(sec.content, sectionEl);
			} else {
				sectionEl.innerHTML = `
					<h3>${sec.title}</h3>
					<p>${sec.content}</p>
					${sec.modalSections ? `<a href="#" class="modal-link" data-id="${sec.id}">More details</a>` : ''}
				`;
			}

			// Apply section style if specified (not inline-style)
			if (sec.style && !sec['inline-style']) {
				const scopeClass = `style-${sec.style}`;
				StyleManager.applyScopeToElement(sectionEl, sec.style, scopeClass);
				StyleManager.loadStyle(sec.style, sectionEl.id);
			}

			pageWrapper.appendChild(sectionEl);
		}
	});

	content.appendChild(pageWrapper);
}

// Load embedded tools dynamically
function loadEmbeddedTool(toolType, container, useInlineStyle = false) {
	// Dynamic path construction based on toolType
	const toolPath = `/${toolType}.html`;

	fetch(toolPath)
		.then((response) => {
			if (!response.ok) {
				throw new Error(`Tool nicht gefunden: ${toolPath} (${response.status})`);
			}
			return response.text();
		})
		.then((html) => {
			// Extract only the body content
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');
			const bodyContent = doc.body.innerHTML;

			// Extract and cache inline styles if useInlineStyle is true
			if (useInlineStyle) {
				const styleElements = doc.querySelectorAll('style');
				let combinedStyles = '';

				styleElements.forEach((styleEl) => {
					combinedStyles += styleEl.textContent + '\n';
				});

				if (combinedStyles.trim()) {
					StyleManager.cacheInlineStyle(toolType, combinedStyles);
					StyleManager.applyInlineStyle(toolType, container.id);
				}
			}

			// Create a wrapper div for the tool
			const toolWrapper = document.createElement('div');
			toolWrapper.className = 'embedded-tool';
			toolWrapper.dataset.toolType = toolType;
			toolWrapper.innerHTML = bodyContent;

			container.appendChild(toolWrapper);

			// Execute any scripts in the embedded content
			const scripts = toolWrapper.querySelectorAll('script');
			scripts.forEach((script) => {
				const newScript = document.createElement('script');
				if (script.src) {
					newScript.src = script.src;
				} else {
					newScript.textContent = script.textContent;
				}
				document.body.appendChild(newScript);
				document.body.removeChild(newScript);
			});
		})
		.catch((err) => {
			container.innerHTML += `<p>Fehler beim Laden des Tools "${toolType}": ${err.message}</p>`;
			console.error('Error loading embedded tool:', err);
		});
}

// Open modal with provided modalSections array
function openModal(modalSections) {
	const modalContainer = document.getElementById('modal-sections');
	modalContainer.innerHTML = '';
	modalSections.forEach((sec) => {
		const articleEl = document.createElement('article');
		articleEl.innerHTML = `
      <h4>${sec.title}</h4>
      <p>${sec.content}</p>
    `;
		modalContainer.appendChild(articleEl);
	});
	document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
	document.getElementById('modal').classList.add('hidden');
}
