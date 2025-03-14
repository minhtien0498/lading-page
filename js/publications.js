// publications-page.js - Handles full publications page functionality
// Function to download PDF
function downloadCertificate(pdfUrl) {
    // Check if the URL is absolute or relative
    const isAbsoluteUrl = pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://');
    const url = isAbsoluteUrl ? pdfUrl : `pdfs/${pdfUrl}`;
    
    // For external URLs, open in new tab
    if (isAbsoluteUrl) {
        window.open(url, '_blank');
        return;
    }
    
    // For local files, trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = pdfUrl.split('/').pop(); // Get filename from path
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to display publications
function displayPublications(publications, mode = 'summary') {
    const publicationsGrid = document.querySelector('.publications-grid');
    if (!publicationsGrid) return;

    if (!publications || publications.length === 0) {
        publicationsGrid.innerHTML = `
            <div class="no-publications">
                <p>No publications available at the moment.</p>
            </div>
        `;
        return;
    }

    if (mode === 'summary') {
        // Summary mode for index page
        publicationsGrid.innerHTML = publications.map(pub => `
            <div class="publication">
                <div class="publication-content">
                    <h3>${pub.title}</h3>
                    <div class="journal">${pub.journal}</div>
                    <div class="authors">${pub.authors}</div>
                    <div class="excerpt">${pub.excerpt}</div>
                    <div class="publication-actions">
                        <a href="publications.html" class="read-more-btn">
                            <i class="fas fa-arrow-right"></i> Read More
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        // Detailed mode for publications page
        publicationsGrid.innerHTML = publications.map(pub => `
            <div class="publication">
                <div class="publication-content">
                    <h3>${pub.title}</h3>
                    <div class="journal">${pub.journal}</div>
                    <div class="authors">${pub.authors}</div>
                    <div class="excerpt">${pub.excerpt}</div>
                    <div class="publication-details">
                        ${pub.details || ''}
                    </div>
                    <div class="publication-actions">
                        <button onclick="downloadCertificate('${pub.pdfFile}')" class="view-certificate">
                            <i class="fas fa-download"></i> Download Certificate
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Google Sheets Configuration
const SHEET_ID = '11qHP1J0WlSyEZ3AD5jqKRs7oaCafkrUAHFVdJ-E_BeY';
const SHEET_NAME = 'Publications';

// Load publications from Google Sheets
async function loadPublications() {
    const publicationsContainer = document.querySelector('.publications-grid');
    if (!publicationsContainer) return;

    // Show loading state
    publicationsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading publications...</p>
        </div>
    `;

    try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        const jsonString = text.substring(47).slice(0, -2);
        const data = JSON.parse(jsonString);
        
        if (!data.table || !data.table.cols || !data.table.rows) {
            throw new Error('Invalid data structure from Google Sheets');
        }

        const headers = data.table.cols.map(col => col.label.toLowerCase());
        const publications = data.table.rows
            .map(row => {
                const publication = {};
                row.c.forEach((cell, index) => {
                    publication[headers[index]] = cell ? cell.v : null;
                });
                return publication;
            })
            .filter(pub => pub.isshow)
            .sort((a, b) => b.year - a.year);

        console.log('Loaded publications:', publications);
        displayPublications(publications);
    } catch (error) {
        console.error('Error loading publications:', error);
        displayError('Failed to load publications. Please try again later.');
    }
}

// Display publications in the grid
function displayPublications(publications) {
    const publicationsContainer = document.querySelector('.publications-grid');
    if (!publicationsContainer) return;

    if (!publications || publications.length === 0) {
        displayError('No publications available at the moment.');
        return;
    }

    // Group publications by year
    const publicationsByYear = publications.reduce((acc, pub) => {
        const year = pub.year || 'Unknown Year';
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(pub);
        return acc;
    }, {});

    // Create HTML for publications grouped by year
    const html = Object.entries(publicationsByYear)
        .sort(([yearA], [yearB]) => yearB - yearA)
        .map(([year, pubs]) => `
            <div class="publication-year-section">
                <h2 class="year-header">${year}</h2>
                <div class="year-publications">
                    ${pubs.map(pub => `
                        <div class="publication-card" data-type="${pub.type?.toLowerCase() || 'article'}">
                            <div class="publication-content">
                                <h3 class="publication-title">
                                    ${pub.url ? 
                                        `<a href="${pub.url}" target="_blank" rel="noopener noreferrer">${pub.title}</a>` :
                                        pub.title
                                    }
                                </h3>
                                <p class="publication-authors">${pub.authors}</p>
                                <p class="publication-journal">
                                    <span class="journal-name">${pub.journal}</span>
                                    ${pub.doi ? `<span class="publication-doi">DOI: ${pub.doi}</span>` : ''}
                                </p>
                                <div class="publication-meta">
                                    <span class="publication-type">
                                        <i class="fas ${getTypeIcon(pub.type)}"></i>
                                        ${pub.type || 'Article'}
                                    </span>
                                    ${pub.citation ? `
                                        <span class="citation-count">
                                            <i class="fas fa-quote-right"></i>
                                            ${pub.citation} citations
                                        </span>
                                    ` : ''}
                                    ${pub.pdffile ? `
                                        <span class="pdf-download" onclick="downloadCertificate('${pub.pdffile}')">
                                            <i class="fas fa-file-pdf"></i>
                                            PDF
                                        </span>
                                    ` : ''}
                                    <button class="details-btn" onclick="showPublicationDetails(${JSON.stringify(pub).replace(/"/g, '&quot;')})">
                                        <i class="fas fa-info-circle"></i>
                                        Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

    publicationsContainer.innerHTML = html + `
        <div class="publication-modal" id="publicationModal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <div class="modal-body"></div>
            </div>
        </div>
    `;

    // Setup modal events
    setupModalEvents();
}

// Show publication details in modal
function showPublicationDetails(publication) {
    const modal = document.getElementById('publicationModal');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <h2>${publication.title}</h2>
        <div class="modal-meta">
            <p class="modal-authors">${publication.authors}</p>
            <p class="modal-journal">
                <span class="journal-name">${publication.journal}</span>
                ${publication.doi ? `<span class="publication-doi">DOI: ${publication.doi}</span>` : ''}
            </p>
        </div>
        ${publication.keywords ? `
            <div class="modal-keywords">
                <h3>Keywords</h3>
                <div class="keywords-list">
                    ${publication.keywords.split(',').map(keyword => 
                        `<span class="keyword">${keyword.trim()}</span>`
                    ).join('')}
                </div>
            </div>
        ` : ''}
        ${publication.abstract ? `
            <div class="modal-abstract">
                <h3>Abstract</h3>
                <p>${publication.abstract}</p>
            </div>
        ` : ''}
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Setup modal events
function setupModalEvents() {
    const modal = document.getElementById('publicationModal');
    const closeBtn = modal.querySelector('.close-modal');

    closeBtn.onclick = function() {
        modal.style.display = "none";
        document.body.style.overflow = '';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            document.body.style.overflow = '';
        }
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = "none";
            document.body.style.overflow = '';
        }
    });
}

// Get appropriate icon for publication type
function getTypeIcon(type) {
    if (!type) return 'fa-file-alt';
    
    const typeLC = type.toLowerCase();
    switch (typeLC) {
        case 'journal article':
            return 'fa-newspaper';
        case 'conference paper':
            return 'fa-users';
        case 'book chapter':
            return 'fa-book';
        case 'review':
            return 'fa-search';
        case 'thesis':
            return 'fa-graduation-cap';
        default:
            return 'fa-file-alt';
    }
}

// Toggle abstract visibility
window.toggleAbstract = function(button) {
    const abstract = button.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (abstract.classList.contains('hidden')) {
        abstract.classList.remove('hidden');
        button.innerHTML = `Hide Abstract <i class="fas fa-chevron-up"></i>`;
    } else {
        abstract.classList.add('hidden');
        button.innerHTML = `Show Abstract <i class="fas fa-chevron-down"></i>`;
    }
}

// Display error message
function displayError(message) {
    const publicationsContainer = document.querySelector('.publications-grid');
    if (!publicationsContainer) return;

    publicationsContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', loadPublications); 