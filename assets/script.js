// Global variables for JSON data and lookup maps
let pageData = {};
let pageMap = {};
let sectionMap = {};
let articleMap = {};

// Load JSON data and initialize the app
document.addEventListener('DOMContentLoaded', () => {
	// Test if url is correct and if the fetch is working correctly with /data.json otherwise use /content/data.json
	try {
		fetch('/data.json')
			.then((response) => response.json())
			.then((data) => {
				pageData = data;
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
				fetch('/content/data.json')
					.then((response) => response.json())
					.then((data) => {
						pageData = data;
						// Create lookup maps for pages, sections, articles by id
						pageData.pages.forEach((p) => (pageMap[p.id] = p));
						pageData.sections.forEach((s) => (sectionMap[s.id] = s));
						pageData.articles.forEach((a) => (articleMap[a.id] = a));

						renderNavigation(pageData.pagetree);
						populateArticles(pageData.articles);
						setupContentLinks();
					})
					.catch((err) => console.error('Error loading JSON:', err));

				console.error('Both fetches failed');
			});
	} catch (error) {
		console.error('Error fetching JSON:', error);
	}

	document.getElementById('modal-close').addEventListener('click', closeModal);
	document.getElementById('modal').addEventListener('click', (e) => {
		if (e.target.id === 'modal') closeModal();
	});
	document.getElementById('back-btn').addEventListener('click', () => {
		// Return to main articles view
		document.getElementById('page-title').textContent = 'Articles';
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

// Populate main content with articles
function populateArticles(articles) {
	const content = document.getElementById('content');
	content.innerHTML = '';
	articles.forEach((article) => {
		const articleEl = document.createElement('article');
		articleEl.innerHTML = `
      <h2>${article.title}</h2>
      <p>${article.content}</p>
      ${article.pageId ? `<a href="#" class="page-link" data-id="${article.pageId}">More info</a>` : ''}
    `;
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
	document.getElementById('page-title').textContent = article.title;
	document.getElementById('back-btn').classList.remove('hidden');
	const articleEl = document.createElement('article');
	articleEl.innerHTML = `
    <p>${article.content}</p>
    ${article.pageId ? `<a href="#" class="page-link" data-id="${article.pageId}">More info</a>` : ''}
  `;
	content.appendChild(articleEl);
}

// Load a page: replace main content with its sections
function loadPage(page) {
	const content = document.getElementById('content');
	content.innerHTML = '';
	document.getElementById('page-title').textContent = page.title;
	document.getElementById('back-btn').classList.remove('hidden');

	// For each section id referenced in the page, render the corresponding section
	page.sections.forEach((secId) => {
		const sec = sectionMap[secId];
		if (sec) {
			const sectionEl = document.createElement('section');
			sectionEl.innerHTML = `
        <h3>${sec.title}</h3>
        <p>${sec.content}</p>
        ${sec.modalSections ? `<a href="#" class="modal-link" data-id="${sec.id}">More details</a>` : ''}
      `;
			content.appendChild(sectionEl);
		}
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
