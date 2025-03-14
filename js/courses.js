// Function to create course card
function createCourseCard(course) {
    return `
        <div class="course-card" data-id="${course.id}">
            <div class="course-image">
                <img src="${course.image}" alt="${course.title}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="course-content">
                <h3>${course.title}</h3>
                <p class="course-description">${course.description}</p>
                <div class="course-meta">
                    <span class="duration"><i class="far fa-clock"></i> ${course.duration}</span>
                    <span class="level"><i class="fas fa-signal"></i> ${course.level}</span>
                    <span class="price"><i class="fas fa-tag"></i> ${course.price}</span>
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