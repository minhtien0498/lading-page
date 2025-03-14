// Function to create course card
function createCourseCard(course) {
    if (!course.isShow) return '';
    return `
        <div class="course-card" data-id="${course.id}">
            <div class="course-image">
                <img src="images/courses/${course.id}.jpg" alt="${course.title}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="course-content">
                <h3>${course.title}</h3>
                <p class="course-description">${course.description}</p>
                <div class="course-meta">
                    <span class="duration"><i class="far fa-clock"></i> ${course.duration}</span>
                    <span class="level"><i class="fas fa-signal"></i> ${course.level}</span>
                    <span class="price"><i class="fas fa-tag"></i> ${course.price}</span>
                </div>
                <div class="course-instructor">
                    <i class="fas fa-user"></i> ${course.instructor}
                </div>
                <button class="enroll-btn">Enroll Now</button>
            </div>
        </div>
    `;
}

// Function to create category section
function createCategorySection(category) {
    // Filter courses to only show those with isShow: true
    const visibleCourses = category.courses.filter(course => course.isShow);
    if (visibleCourses.length === 0) return '';
    
    return `
        <div class="course-category" data-id="${category.id}">
            <div class="category-header">
                <h2>${category.name}</h2>
            </div>
            <div class="courses-grid">
                ${visibleCourses.map(course => createCourseCard(course)).join('')}
            </div>
        </div>
    `;
}

// Function to create resource card
function createResourceCard(resource) {
    if (!resource.isShow) return '';
    return `
        <div class="resource-card" data-id="${resource.id}">
            <i class="fas fa-book"></i>
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
    fetch('data/courses.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Loaded courses data:', data);

            // Update courses section
            const coursesContainer = document.getElementById('courses-container');
            if (coursesContainer) {
                if (data.categories && Array.isArray(data.categories)) {
                    const visibleCategories = data.categories.map(category => createCategorySection(category)).join('');
                    coursesContainer.innerHTML = visibleCategories || '<p class="no-courses">No courses available at the moment.</p>';
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
                if (data.resources && Array.isArray(data.resources)) {
                    const visibleResources = data.resources.filter(resource => resource.isShow);
                    if (visibleResources.length > 0) {
                        resourcesContainer.innerHTML = `
                            <h2>Learning Resources</h2>
                            <div class="resources-grid">
                                ${visibleResources.map(resource => createResourceCard(resource)).join('')}
                            </div>
                        `;
                    } else {
                        resourcesContainer.innerHTML = '<p class="no-resources">No resources available at the moment.</p>';
                    }
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
        })
        .catch(error => {
            console.error('Error loading courses:', error);
            const coursesContainer = document.getElementById('courses-container');
            if (coursesContainer) {
                coursesContainer.innerHTML = '<p class="error-message">Error loading courses. Please try again later.</p>';
            }
        });
}

// Initialize courses and resources when the page loads
document.addEventListener('DOMContentLoaded', updateCoursesAndResources); 