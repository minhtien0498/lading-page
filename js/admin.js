// Admin Authentication
let currentUser = null;

// Check if user is logged in
function checkAuth() {
    const user = localStorage.getItem('adminUser');
    if (!user && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
    if (user) {
        currentUser = JSON.parse(user);
        // Update admin name in dashboard if available
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement && currentUser.fullName) {
            adminNameElement.textContent = currentUser.fullName;
        }
    }
}

// Login functionality
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-message');

    // Load users data
    fetch('../data/users.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(users => {
            console.log('Loaded users:', users); // Debug log
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                localStorage.setItem('adminUser', JSON.stringify(user));
                window.location.href = 'dashboard.html';
            } else {
                errorMsg.textContent = 'Invalid username or password';
                errorMsg.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error loading users:', error);
            errorMsg.textContent = 'Error loading user data. Please try again.';
            errorMsg.style.display = 'block';
        });
}

// Logout functionality
function handleLogout() {
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}

// Dashboard Navigation
function showSection(sectionId) {
    console.log('Showing section:', sectionId); // Debug log

    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    if (sections) {
        sections.forEach(section => {
            section.classList.remove('active');
        });
    }

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    } else {
        console.error('Section not found:', sectionId);
    }

    // Update active nav item
    const navItems = document.querySelectorAll('.sidebar-nav li');
    if (navItems) {
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    // Load section data
    loadSectionData(sectionId);
}

// Load section data
function loadSectionData(sectionId) {
    console.log('Loading section data:', sectionId);
    switch(sectionId) {
        case 'courses':
            loadCourses();
            break;
        case 'resources':
            loadResources();
            break;
        case 'contact':
            loadContactInfo();
            break;
        case 'publications':
            loadPublications();
            break;
    }
}

// Courses Management
function loadCourses() {
    // Check if we have data in localStorage
    const storedData = localStorage.getItem('coursesData');
    if (storedData) {
        const data = JSON.parse(storedData);
        const coursesTable = document.getElementById('coursesTableBody');
        if (!coursesTable) {
            console.error('Courses table body not found');
            return;
        }
        coursesTable.innerHTML = `
            ${data.categories.flatMap(category => 
                category.courses.map(course => createCourseRow(course))
            ).join('')}
        `;
        return;
    }

    // If no data in localStorage, fetch from JSON file
    fetch('../data/courses.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Loaded courses:', data);
            const coursesTable = document.getElementById('coursesTableBody');
            if (!coursesTable) {
                console.error('Courses table body not found');
                return;
            }
            coursesTable.innerHTML = `
                ${data.categories.flatMap(category => 
                    category.courses.map(course => createCourseRow(course))
                ).join('')}
            `;
        })
        .catch(error => {
            console.error('Error loading courses:', error);
        });
}

// Resources Management
function loadResources() {
    // Check if we have data in localStorage
    const storedData = localStorage.getItem('coursesData');
    if (storedData) {
        const data = JSON.parse(storedData);
        const resourcesTable = document.getElementById('resourcesTableBody');
        if (!resourcesTable) {
            console.error('Resources table body not found');
            return;
        }
        resourcesTable.innerHTML = `
            ${data.resources.map(resource => createResourceRow(resource)).join('')}
        `;
        return;
    }

    // If no data in localStorage, fetch from JSON file
    fetch('../data/courses.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Loaded resources:', data);
            const resourcesTable = document.getElementById('resourcesTableBody');
            if (!resourcesTable) {
                console.error('Resources table body not found');
                return;
            }
            resourcesTable.innerHTML = `
                ${data.resources.map(resource => createResourceRow(resource)).join('')}
            `;
        })
        .catch(error => {
            console.error('Error loading resources:', error);
        });
}

// Contact Info Management
function loadContactInfo() {
    fetch('../data/contact.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Loaded contact info:', data);
            const form = document.getElementById('contactInfoForm');
            if (!form) {
                console.error('Contact form not found');
                return;
            }
            form.querySelector('[name="street"]').value = data.address;
            form.querySelector('[name="mainPhone"]').value = data.phone;
            form.querySelector('[name="mainEmail"]').value = data.email;
        })
        .catch(error => {
            console.error('Error loading contact info:', error);
        });
}

// Function to create course row
function createCourseRow(course) {
    return `
        <tr data-id="${course.id}">
            <td>${course.id}</td>
            <td>${course.title}</td>
            <td>${course.duration}</td>
            <td>${course.price}</td>
            <td>${course.level}</td>
            <td>${course.instructor}</td>
            <td>
                <div class="toggle-switch">
                    <input type="checkbox" id="course-show-${course.id}" ${course.isShow ? 'checked' : ''}>
                    <label for="course-show-${course.id}"></label>
                </div>
            </td>
            <td>
                <button class="edit-btn" onclick="editCourse(${course.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteCourse(${course.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

// Function to create resource row
function createResourceRow(resource) {
    return `
        <tr data-id="${resource.id}">
            <td>${resource.id}</td>
            <td>${resource.title}</td>
            <td>${resource.description}</td>
            <td>
                <div class="toggle-switch">
                    <input type="checkbox" id="resource-show-${resource.id}" ${resource.isShow ? 'checked' : ''}>
                    <label for="resource-show-${resource.id}"></label>
                </div>
            </td>
            <td>
                <button class="edit-btn" onclick="editResource(${resource.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteResource(${resource.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

// Function to handle course show toggle
function handleCourseShowToggle(courseId, isShow) {
    // Get current data from localStorage or fetch from JSON file
    fetch('../data/courses.json')
        .then(response => response.json())
        .then(data => {
            // Find and update the course
            data.categories.forEach(category => {
                category.courses.forEach(course => {
                    if (course.id === courseId) {
                        course.isShow = isShow;
                    }
                });
            });

            // Store updated data in localStorage
            localStorage.setItem('coursesData', JSON.stringify(data));
            
            // Show success notification
            showNotification('Course visibility updated successfully', 'success');
            
            // Reload the courses table to reflect changes
            loadCourses();
        })
        .catch(error => {
            console.error('Error updating course visibility:', error);
            showNotification('Failed to update course visibility', 'error');
        });
}

// Function to handle resource show toggle
function handleResourceShowToggle(resourceId, isShow) {
    // Get current data from localStorage or fetch from JSON file
    fetch('../data/courses.json')
        .then(response => response.json())
        .then(data => {
            // Find and update the resource
            data.resources.forEach(resource => {
                if (resource.id === resourceId) {
                    resource.isShow = isShow;
                }
            });

            // Store updated data in localStorage
            localStorage.setItem('coursesData', JSON.stringify(data));
            
            // Show success notification
            showNotification('Resource visibility updated successfully', 'success');
            
            // Reload the resources table to reflect changes
            loadResources();
        })
        .catch(error => {
            console.error('Error updating resource visibility:', error);
            showNotification('Failed to update resource visibility', 'error');
        });
}

// Function to show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add event listeners for show toggles
document.addEventListener('DOMContentLoaded', () => {
    // Course show toggle listeners
    document.addEventListener('change', (e) => {
        if (e.target.matches('input[id^="course-show-"]')) {
            const courseId = parseInt(e.target.id.split('-')[2]);
            handleCourseShowToggle(courseId, e.target.checked);
        }
    });

    // Resource show toggle listeners
    document.addEventListener('change', (e) => {
        if (e.target.matches('input[id^="resource-show-"]')) {
            const resourceId = parseInt(e.target.id.split('-')[2]);
            handleResourceShowToggle(resourceId, e.target.checked);
        }
    });
});

// Course Management Functions
function addCourse() {
    showModal('Add New Course');
    const modalForm = document.getElementById('modalForm');
    modalForm.innerHTML = `
        <div class="form-group">
            <label>Title</label>
            <input type="text" name="title" required>
        </div>
        <div class="form-group">
            <label>Category</label>
            <select name="category" required>
                <option value="">Select Category</option>
                <option value="Research Methods">Research Methods</option>
                <option value="Data Analysis">Data Analysis</option>
            </select>
        </div>
        <div class="form-group">
            <label>Duration</label>
            <input type="text" name="duration" required>
        </div>
        <div class="form-group">
            <label>Price</label>
            <input type="text" name="price" required>
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea name="description" required></textarea>
        </div>
        <div class="form-group">
            <label>Instructor</label>
            <input type="text" name="instructor" required>
        </div>
        <div class="form-group">
            <label>Level</label>
            <select name="level" required>
                <option value="">Select Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
            </select>
        </div>
        <button type="submit" class="btn-primary">Save Course</button>
    `;
    modalForm.onsubmit = handleCourseSubmit;
}

function editCourse(courseId) {
    showModal('Edit Course');
    // Load course data and populate form
    fetch('../data/courses.json')
        .then(response => response.json())
        .then(data => {
            const course = data.categories
                .flatMap(category => category.courses)
                .find(c => c.id === courseId);
            
            if (course) {
                const modalForm = document.getElementById('modalForm');
                modalForm.innerHTML = `
                    <input type="hidden" name="id" value="${course.id}">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Title</label>
                            <input type="text" name="title" value="${course.title}" required>
                        </div>
                        <div class="form-group">
                            <label>Category</label>
                            <select name="category" required>
                                <option value="">Select Category</option>
                                <option value="Research Methods" ${course.category === 'Research Methods' ? 'selected' : ''}>Research Methods</option>
                                <option value="Data Analysis" ${course.category === 'Data Analysis' ? 'selected' : ''}>Data Analysis</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Duration</label>
                            <input type="text" name="duration" value="${course.duration}" required>
                        </div>
                        <div class="form-group">
                            <label>Price</label>
                            <input type="text" name="price" value="${course.price}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" required>${course.description}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Instructor</label>
                            <input type="text" name="instructor" value="${course.instructor}" required>
                        </div>
                        <div class="form-group">
                            <label>Level</label>
                            <select name="level" required>
                                <option value="">Select Level</option>
                                <option value="Beginner" ${course.level === 'Beginner' ? 'selected' : ''}>Beginner</option>
                                <option value="Intermediate" ${course.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                                <option value="Advanced" ${course.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group toggle-group">
                        <label>Show Course</label>
                        <div class="toggle-switch">
                            <input type="checkbox" name="isShow" id="course-show-edit-${course.id}" ${course.isShow ? 'checked' : ''}>
                            <label for="course-show-edit-${course.id}"></label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Update Course</button>
                        <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    </div>
                `;
                modalForm.onsubmit = handleCourseSubmit;
            }
        });
}

function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course?')) {
        // In a real application, you would make an API call here
        console.log('Deleting course:', courseId);
        alert('Course deleted successfully!');
        loadCourses(); // Reload the courses table
    }
}

function handleCourseSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const courseData = Object.fromEntries(formData.entries());
    courseData.isShow = formData.get('isShow') === 'on';
    
    // In a real application, you would make an API call here
    console.log('Saving course:', courseData);
    showNotification('Course updated successfully', 'success');
    closeModal();
    loadCourses(); // Reload the courses table
}

// Resource Management Functions
function addResource() {
    showModal('Add New Resource');
    const modalForm = document.getElementById('modalForm');
    modalForm.innerHTML = `
        <div class="form-group">
            <label>Title</label>
            <input type="text" name="title" required>
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea name="description" required></textarea>
        </div>
        <div class="form-group">
            <label>Link</label>
            <input type="url" name="link" required>
        </div>
        <button type="submit" class="btn-primary">Save Resource</button>
    `;
    modalForm.onsubmit = handleResourceSubmit;
}

function editResource(resourceId) {
    showModal('Edit Resource');
    fetch('../data/courses.json')
        .then(response => response.json())
        .then(data => {
            const resource = data.resources.find(r => r.id === resourceId);
            if (resource) {
                const modalForm = document.getElementById('modalForm');
                modalForm.innerHTML = `
                    <input type="hidden" name="id" value="${resource.id}">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" name="title" value="${resource.title}" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" required>${resource.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Link</label>
                        <input type="url" name="link" value="${resource.link}" required>
                    </div>
                    <div class="form-group toggle-group">
                        <label>Show Resource</label>
                        <div class="toggle-switch">
                            <input type="checkbox" name="isShow" id="resource-show-edit-${resource.id}" ${resource.isShow ? 'checked' : ''}>
                            <label for="resource-show-edit-${resource.id}"></label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Update Resource</button>
                        <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    </div>
                `;
                modalForm.onsubmit = handleResourceSubmit;
            }
        });
}

function deleteResource(resourceId) {
    if (confirm('Are you sure you want to delete this resource?')) {
        // In a real application, you would make an API call here
        console.log('Deleting resource:', resourceId);
        alert('Resource deleted successfully!');
        loadResources(); // Reload the resources table
    }
}

function handleResourceSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const resourceData = Object.fromEntries(formData.entries());
    resourceData.isShow = formData.get('isShow') === 'on';
    
    // In a real application, you would make an API call here
    console.log('Saving resource:', resourceData);
    showNotification('Resource updated successfully', 'success');
    closeModal();
    loadResources(); // Reload the resources table
}

// Modal Functions
function showModal(title) {
    const modal = document.getElementById('item-modal');
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = title;
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('item-modal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('item-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded'); // Debug log
    
    // Initialize login form if on login page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('Login form found, adding submit listener');
        loginForm.addEventListener('submit', handleLogin);
    }

    // Initialize dashboard if on dashboard page
    if (document.querySelector('.admin-dashboard')) {
        console.log('Dashboard found, initializing');
        checkAuth();
        
        // Show default section
        const defaultSection = 'courses';
        console.log('Showing default section:', defaultSection);
        showSection(defaultSection);
        
        // Initialize navigation
        const navItems = document.querySelectorAll('.sidebar-nav li');
        if (navItems) {
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    const sectionId = item.getAttribute('data-section');
                    if (sectionId) {
                        showSection(sectionId);
                    }
                });
            });
        }

        // Initialize logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // Initialize Add New button
        const addNewBtn = document.getElementById('addNewBtn');
        if (addNewBtn) {
            addNewBtn.addEventListener('click', () => {
                const activeSection = document.querySelector('.admin-section.active');
                if (activeSection) {
                    switch(activeSection.id) {
                        case 'courses':
                            addCourse();
                            break;
                        case 'resources':
                            addResource();
                            break;
                    }
                }
            });
        }

        // Initialize Add Category button
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                showModal('Add New Category');
                const modalForm = document.getElementById('modalForm');
                modalForm.innerHTML = `
                    <div class="form-group">
                        <label>Category Name</label>
                        <input type="text" name="name" required>
                    </div>
                    <button type="submit" class="btn-primary">Save Category</button>
                `;
                modalForm.onsubmit = (event) => {
                    event.preventDefault();
                    const formData = new FormData(event.target);
                    const categoryData = Object.fromEntries(formData.entries());
                    console.log('Saving category:', categoryData);
                    alert('Category added successfully!');
                    closeModal();
                    loadCourses();
                };
            });
        }
    }
});

// Publications Management
function loadPublications() {
    // Check if we have data in localStorage
    const storedData = localStorage.getItem('publicationsData');
    if (storedData) {
        const data = JSON.parse(storedData);
        displayPublicationsInTable(data.publications);
        return;
    }

    // If no data in localStorage, fetch from JSON file
    fetch('../data/publications.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Loaded publications:', data);
            displayPublicationsInTable(data.publications);
        })
        .catch(error => {
            console.error('Error loading publications:', error);
            showNotification('Failed to load publications', 'error');
        });
}

function displayPublicationsInTable(publications) {
    const tableBody = document.getElementById('publicationsTableBody');
    if (!tableBody) {
        console.error('Publications table body not found');
        return;
    }

    tableBody.innerHTML = publications.map(pub => `
        <tr data-id="${pub.id}">
            <td>${pub.id}</td>
            <td>${pub.title}</td>
            <td>${pub.journal}</td>
            <td>${pub.authors}</td>
            <td>${pub.year}</td>
            <td>${pub.doi}</td>
            <td>
                <button class="edit-btn" onclick="editPublication(${pub.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deletePublication(${pub.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function addPublication() {
    showModal('Add New Publication');
    const modalForm = document.getElementById('modalForm');
    modalForm.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Title</label>
                <input type="text" name="title" required>
            </div>
            <div class="form-group">
                <label>Journal</label>
                <input type="text" name="journal" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Authors</label>
                <input type="text" name="authors" required>
            </div>
            <div class="form-group">
                <label>Year</label>
                <input type="text" name="year" required>
            </div>
        </div>
        <div class="form-group">
            <label>DOI</label>
            <input type="text" name="doi" required>
        </div>
        <div class="form-group">
            <label>Excerpt</label>
            <textarea name="excerpt" required></textarea>
        </div>
        <div class="form-group">
            <label>Details</label>
            <textarea name="details" required></textarea>
        </div>
        <div class="form-group">
            <label>PDF File</label>
            <input type="text" name="pdfFile" required>
        </div>
        <div class="form-actions">
            <button type="submit" class="btn-primary">Save Publication</button>
            <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
    `;
    modalForm.onsubmit = handlePublicationSubmit;
}

function editPublication(pubId) {
    showModal('Edit Publication');
    
    // Get current data from localStorage or fetch from JSON file
    const storedData = localStorage.getItem('publicationsData');
    let publications = storedData ? JSON.parse(storedData).publications : [];
    
    if (!publications.length) {
        fetch('../data/publications.json')
            .then(response => response.json())
            .then(data => {
                const publication = data.publications.find(p => p.id === pubId);
                if (publication) {
                    populatePublicationForm(publication);
                }
            });
    } else {
        const publication = publications.find(p => p.id === pubId);
        if (publication) {
            populatePublicationForm(publication);
        }
    }
}

function populatePublicationForm(publication) {
    const modalForm = document.getElementById('modalForm');
    modalForm.innerHTML = `
        <input type="hidden" name="id" value="${publication.id}">
        <div class="form-row">
            <div class="form-group">
                <label>Title</label>
                <input type="text" name="title" value="${publication.title}" required>
            </div>
            <div class="form-group">
                <label>Journal</label>
                <input type="text" name="journal" value="${publication.journal}" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Authors</label>
                <input type="text" name="authors" value="${publication.authors}" required>
            </div>
            <div class="form-group">
                <label>Year</label>
                <input type="text" name="year" value="${publication.year}" required>
            </div>
        </div>
        <div class="form-group">
            <label>DOI</label>
            <input type="text" name="doi" value="${publication.doi}" required>
        </div>
        <div class="form-group">
            <label>Excerpt</label>
            <textarea name="excerpt" required>${publication.excerpt}</textarea>
        </div>
        <div class="form-group">
            <label>Details</label>
            <textarea name="details" required>${publication.details}</textarea>
        </div>
        <div class="form-group">
            <label>PDF File</label>
            <input type="text" name="pdfFile" value="${publication.pdfFile}" required>
        </div>
        <div class="form-actions">
            <button type="submit" class="btn-primary">Update Publication</button>
            <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
    `;
    modalForm.onsubmit = handlePublicationSubmit;
}

function handlePublicationSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const publicationData = Object.fromEntries(formData.entries());
    
    // Get current data
    let storedData = localStorage.getItem('publicationsData');
    let data = storedData ? JSON.parse(storedData) : { publications: [] };
    
    if (publicationData.id) {
        // Update existing publication
        const index = data.publications.findIndex(p => p.id === parseInt(publicationData.id));
        if (index !== -1) {
            data.publications[index] = { ...data.publications[index], ...publicationData };
        }
    } else {
        // Add new publication
        const newId = Math.max(0, ...data.publications.map(p => p.id)) + 1;
        data.publications.push({ ...publicationData, id: newId });
    }
    
    // Save to localStorage
    localStorage.setItem('publicationsData', JSON.stringify(data));
    
    showNotification('Publication saved successfully', 'success');
    closeModal();
    loadPublications();
}

function deletePublication(pubId) {
    if (confirm('Are you sure you want to delete this publication?')) {
        // Get current data
        let storedData = localStorage.getItem('publicationsData');
        let data = storedData ? JSON.parse(storedData) : { publications: [] };
        
        // Remove publication
        data.publications = data.publications.filter(p => p.id !== pubId);
        
        // Save to localStorage
        localStorage.setItem('publicationsData', JSON.stringify(data));
        
        showNotification('Publication deleted successfully', 'success');
        loadPublications();
    }
} 