// Function to download PDF
function downloadCertificate(pdfFileName) {
    const pdfPath = `pdfs/${pdfFileName}`;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = pdfFileName; // This will be the downloaded file name
    
    // Append link to body, click it, and remove it
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

// Load publications data
function loadPublications(mode = 'summary') {
    fetch('data/publications.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.publications) {
                displayPublications(data.publications, mode);
            } else {
                throw new Error('Invalid data format');
            }
        })
        .catch(error => {
            console.error('Error loading publications:', error);
            const publicationsGrid = document.querySelector('.publications-grid');
            if (publicationsGrid) {
                publicationsGrid.innerHTML = `
                    <div class="error-message">
                        <p>Error loading publications. Please try again later.</p>
                    </div>
                `;
            }
        });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the publications page
    const isPublicationsPage = window.location.pathname.includes('publications.html');
    loadPublications(isPublicationsPage ? 'detailed' : 'summary');
}); 