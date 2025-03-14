// Google Sheets Configuration
const SHEET_ID = '11qHP1J0WlSyEZ3AD5jqKRs7oaCafkrUAHFVdJ-E_BeY';
const SHEET_NAME = 'Publications';

// Load recent publications for index page
async function loadRecentPublications() {
    const publicationsGrid = document.querySelector('.publications-grid');
    if (!publicationsGrid) return;

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
            .sort((a, b) => b.year - a.year)
            .slice(0, 3); // Only show latest 3 publications

        displayRecentPublications(publications);
    } catch (error) {
        console.error('Error loading publications:', error);
        displayError('Failed to load recent publications.');
    }
}

// Display recent publications in the index page
function displayRecentPublications(publications) {
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

    publicationsGrid.innerHTML = `
        <div class="recent-publications">
            ${publications.map(pub => `
                <div class="publication-card">
                    <div class="publication-content">
                        <h3 class="publication-title">${pub.title}</h3>
                        <p class="publication-authors">${pub.authors}</p>
                        <div class="publication-actions">
                            <a href="publications.html" class="view-more-btn">
                                <i class="fas fa-arrow-right"></i>
                                View Details
                            </a>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="view-all-publications">
            <a href="publications.html" class="cta-button">
                View All Publications <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    `;
}

// Display error message
function displayError(message) {
    const publicationsGrid = document.querySelector('.publications-grid');
    if (!publicationsGrid) return;

    publicationsGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Loading recent publications...');
    loadRecentPublications();
}); 