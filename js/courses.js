// Google Sheets Configuration
const SHEET_ID = '11qHP1J0WlSyEZ3AD5jqKRs7oaCafkrUAHFVdJ-E_BeY';
const SHEET_NAME = 'Courses';

// Default image for courses
const DEFAULT_COURSE_IMAGE = 'https://images.unsplash.com/photo-1532094349884-543bc11b234d';

// Function to create course card
function createCourseCard(course) {
    return `
        <div class="course-card" data-id="${course.id}">
            <div class="course-image">
                <img src="${course.image || DEFAULT_COURSE_IMAGE}" alt="${course.title}" onerror="this.src='${DEFAULT_COURSE_IMAGE}'">
            </div>
            <div class="course-content">
                <h3>${course.title}</h3>
                <p class="course-description">${course.description}</p>
                <div class="course-meta">
                    <div class="meta-row">
                        <span class="duration"><i class="far fa-clock"></i> ${course.duration}</span>
                        <span class="price"><i class="fas fa-tag"></i> ${course.price}</span>
                    </div>
                    <div class="meta-row">
                        <span class="students"><i class="fas fa-users"></i> ${course.students} học viên</span>
                        <span class="rating"><i class="fas fa-star"></i> ${course.rating}/5</span>
                    </div>
                </div>
                <button class="enroll-btn">Enroll Now</button>
            </div>
        </div>
    `;
}

// Function to create category section
function createCategorySection(category) {
    return `
        <div class="course-category" data-id="${category.id}">
            <div class="category-header">
                <i class="${category.icon}"></i>
                <h2>${category.name}</h2>
            </div>
            <p class="category-description">${category.description}</p>
            <div class="courses-grid">
                ${category.courses.map(course => createCourseCard(course)).join('')}
            </div>
        </div>
    `;
}

// Function to create resource card
function createResourceCard(resource) {
    return `
        <div class="resource-card" data-id="${resource.id}">
            <i class="${resource.icon}"></i>
            <h3>${resource.title}</h3>
            <p>${resource.description}</p>
            <a href="${resource.link}" class="resource-link" target="_blank" rel="noopener noreferrer">
                Access <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    `;
}

// Function to update courses and resources
function updateCoursesAndResources() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/courses.json', true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const data = JSON.parse(xhr.responseText);
                console.log('Loaded courses data:', data);

                if (!data || !data.courses) {
                    throw new Error('Invalid data structure');
                }

                // Update courses section
                const coursesContainer = document.getElementById('courses-container');
                if (coursesContainer) {
                    if (data.courses.categories && Array.isArray(data.courses.categories)) {
                        coursesContainer.innerHTML = data.courses.categories.map(category => createCategorySection(category)).join('');
                    } else {
                        console.error('Invalid data structure for courses');
                        coursesContainer.innerHTML = '<p class="error-message">Invalid course data structure.</p>';
                    }
                } else {
                    console.error('Courses container not found');
                }

                // Update resources section
                const resourcesContainer = document.getElementById('resources-container');
                if (resourcesContainer) {
                    if (data.courses.resources && Array.isArray(data.courses.resources.items)) {
                        resourcesContainer.innerHTML = `
                            <h2>${data.courses.resources.title}</h2>
                            <div class="resources-grid">
                                ${data.courses.resources.items.map(resource => createResourceCard(resource)).join('')}
                            </div>
                        `;
                    } else {
                        console.error('Invalid data structure for resources');
                        resourcesContainer.innerHTML = '<p class="error-message">Invalid resources data structure.</p>';
                    }
                } else {
                    console.error('Resources container not found');
                }

                // Add event listeners for course cards
                document.querySelectorAll('.course-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const courseId = card.dataset.id;
                        // Handle course card click - you can add navigation or modal here
                        console.log(`Course clicked: ${courseId}`);
                    });
                });

                // Add event listeners for resource cards
                document.querySelectorAll('.resource-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const resourceId = card.dataset.id;
                        // Handle resource card click - you can add navigation here
                        console.log(`Resource clicked: ${resourceId}`);
                    });
                });
            } catch (error) {
                console.error('Error parsing courses data:', error);
                const coursesContainer = document.getElementById('courses-container');
                if (coursesContainer) {
                    coursesContainer.innerHTML = '<p class="error-message">Error loading courses. Please try again later.</p>';
                }
            }
        } else {
            console.error('Error loading courses:', xhr.statusText);
            const coursesContainer = document.getElementById('courses-container');
            if (coursesContainer) {
                coursesContainer.innerHTML = '<p class="error-message">Error loading courses. Please try again later.</p>';
            }
        }
    };
    xhr.onerror = function() {
        console.error('Error loading courses');
        const coursesContainer = document.getElementById('courses-container');
        if (coursesContainer) {
            coursesContainer.innerHTML = '<p class="error-message">Error loading courses. Please try again later.</p>';
        }
    };
    xhr.send();
}

// Initialize courses and resources when the page loads
document.addEventListener('DOMContentLoaded', updateCoursesAndResources);

// Load courses from Google Sheets
async function loadCourses() {
    const coursesGrid = document.querySelector('.courses-grid');
    if (!coursesGrid) return;

    // Show loading state
    coursesGrid.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading courses...</p>
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
        const courses = data.table.rows
            .map(row => {
                const course = {};
                row.c.forEach((cell, index) => {
                    if (headers[index] === 'id') {
                        course[headers[index]] = cell ? String(cell.v) : null;
                    } else {
                        course[headers[index]] = cell ? cell.v : null;
                    }
                });
                return course;
            })
            .filter(course => course.isshow); // Only show courses with isshow = true

        console.log('Loaded courses:', courses); // Debug log
        displayCourses(courses);
    } catch (error) {
        console.error('Error loading courses:', error);
        displayError('Failed to load courses. Please try again later.');
    }
}

// Function to generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const decimal = rating - fullStars;
    const stars = [];
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        stars.push('<span class="star full">★</span>');
    }
    
    // Add partial star if needed
    if (decimal > 0) {
        if (decimal >= 0.4 && decimal <= 0.6) {
            stars.push('<span class="star half">★</span>');
        } else if (decimal > 0.6) {
            stars.push('<span class="star full">★</span>');
        } else {
            stars.push('<span class="star empty">☆</span>');
        }
    }
    
    // Add empty stars
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
        stars.push('<span class="star empty">☆</span>');
    }
    
    return stars.join('');
}

// Display courses in the grid
function displayCourses(courses) {
    const coursesGrid = document.querySelector('.courses-grid');
    if (!coursesGrid) return;

    if (!courses || courses.length === 0) {
        displayError('No courses available at the moment.');
        return;
    }

    coursesGrid.innerHTML = courses.map(course => `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-image">
                <img src="${course.image || DEFAULT_COURSE_IMAGE}" 
                     alt="${course.name || 'Course'}"
                     onerror="this.src='${DEFAULT_COURSE_IMAGE}'">
                ${course.tag ? `<span class="course-tag" data-tag="${course.tag}">${course.tag}</span>` : ''}
                ${course.level ? `
                    <span class="level-badge" data-level="${course.level}">
                        <i class="fas fa-signal"></i>
                        ${course.level}
                    </span>
                ` : ''}
            </div>
            <div class="course-info">
                <h3>${course.name || 'Course Name'}</h3>
                <p class="course-description">${course.shortdescription || 'No description available.'}</p>
                <div class="course-details">
                    ${course.duration ? `
                        <div class="detail">
                            <i class="fas fa-clock"></i>
                            <span>${course.duration}</span>
                        </div>
                    ` : ''}
                    ${course.price ? `
                        <div class="detail">
                            <i class="fas fa-tag"></i>
                            <span>${course.price}</span>
                        </div>
                    ` : ''}
                    <div class="detail">
                        <i class="fas fa-users"></i>
                        <span>${course.students || 0}</span>
                    </div>
                </div>
                
                <div class="course-rating">
                    <div class="rating-stars">
                        ${generateStarRating(course.rating || 0)}
                    </div>
                    <div class="rating-number">
                        <i class="fas fa-star"></i> ${course.rating || 0}/5
                    </div>
                </div>
                <button class="view-course-btn" onclick="showCourseDetails('${course.id}')">
                    <span>Learn More</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `).join('');

    setupCourseModals(courses);
}

// Setup course detail modals
function setupCourseModals(courses) {
    if (!courses || !Array.isArray(courses)) {
        console.error('Invalid courses data');
        return;
    }

    const modal = document.querySelector('.course-modal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }

    const modalContent = modal.querySelector('.course-modal-content');
    if (!modalContent) {
        console.error('Modal content element not found');
        return;
    }

    const modalClose = modal.querySelector('.course-modal-close');
    if (!modalClose) {
        console.error('Modal close button not found');
        return;
    }

    // Xử lý đóng modal
    const closeModal = () => {
        if (!modal || !modalContent) return;

        modal.classList.remove('active');
        modalContent.classList.remove('show');
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    };

    // Đóng modal khi click vào nút close
    modalClose.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
    });

    // Đóng modal khi click ra ngoài
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Đóng modal khi nhấn ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Expose showCourseDetails function globally
    window.showCourseDetails = function(courseId) {
        try {
            console.log('Showing details for course:', courseId);
            const course = courses.find(c => String(c.id) === String(courseId));
            
            if (!course) {
                console.error(`Course not found with ID: ${courseId}`);
                return;
            }

            const modalBody = modalContent.querySelector('.course-modal-body');
            if (!modalBody) {
                console.error('Modal body not found');
                return;
            }

            // Parse curriculum JSON
            let curriculumHtml = '';
            try {
                const curriculum = JSON.parse(course.curriculum);
                curriculumHtml = curriculum.map(item => `
                    <div class="curriculum-item">
                        <div class="curriculum-header">
                            <h4>${item.content}</h4>
                            <div class="curriculum-meta">
                                <span class="level">${item.level}</span>
                                <span class="duration">${item.duration}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error parsing curriculum:', error);
                curriculumHtml = '<p class="error">Curriculum data not available</p>';
            }

            modalBody.innerHTML = `
                <div class="course-modal-header">
                    <div class="course-image">
                        <img src="${course.image || DEFAULT_COURSE_IMAGE}" 
                             alt="${course.name}"
                             onerror="this.src='${DEFAULT_COURSE_IMAGE}'">
                    </div>
                    <div class="course-header-info">
                        <h2>${course.name}</h2>
                        <div class="course-meta">
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span>${course.duration}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-signal"></i>
                                <span>${course.level}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-tag"></i>
                                <span>${course.price}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-users"></i>
                                <span>${course.students || 0} students</span>
                            </div>
                            <div class="meta-item rating">
                                <i class="fas fa-star"></i>
                                <span>${course.rating || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="course-description">
                    <h3>Course Description</h3>
                    <p>${course.description}</p>
                </div>
                <div class="course-curriculum">
                    <h3>Course Curriculum</h3>
                    <div class="curriculum-list">
                        ${curriculumHtml}
                    </div>
                </div>
                <div class="course-actions">
                    <a href="${course.registration}" class="enroll-button" target="_blank">
                        <span>Enroll Now</span>
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            `;

            // Hiển thị modal với animation
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            window.requestAnimationFrame(() => {
                modal.classList.add('active');
                modalContent.classList.add('show');
            });

        } catch (error) {
            console.error('Error showing course details:', error);
        }
    };
}

// Display error message
function displayError(message) {
    const coursesGrid = document.querySelector('.courses-grid');
    if (!coursesGrid) return;

    coursesGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
}); 