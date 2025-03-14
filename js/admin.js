// Admin Authentication
let currentUser = null;

// Sample user data
const SAMPLE_USERS = [
    {
        username: 'admin',
        password: 'admin123',
        fullName: 'Administrator'
    }
];

// Google Sheets Configuration
const SHEET_ID = '11qHP1J0WlSyEZ3AD5jqKRs7oaCafkrUAHFVdJ-E_BeY';
const SHEET_NAMES = {
    courses: 'Courses',
    resources: 'Resources',
    publications: 'Publications'
};

// Google Apps Script Web App URL
// TODO: Replace this URL with your deployed Google Apps Script Web App URL
// To get this URL:
// 1. Open your Google Sheet
// 2. Go to Tools > Script editor
// 3. Copy the provided Apps Script code
// 4. Click Deploy > New deployment
// 5. Choose "Web app"
// 6. Set "Execute as" to "Me" and "Who has access" to "Anyone"
// 7. Click Deploy and copy the URL
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz...'; // Replace with your actual URL

// OAuth2 Configuration
const CLIENT_ID = 'YOUR_CLIENT_ID';
const API_KEY = 'YOUR_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let accessToken = null;

// Function to initialize Google Sheets API
async function initGoogleSheets() {
    try {
        // Load the Google API client library
        await loadGoogleAPI();
        
        // Initialize the client
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        });
        
        // Load the auth2 library
        await gapi.load('auth2', async function() {
            await gapi.auth2.init({
                client_id: CLIENT_ID,
                scope: SCOPES
            });
            
            // Listen for sign-in state changes
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            
            // Handle the initial sign-in state
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        });
    } catch (error) {
        console.error('Error initializing Google Sheets:', error);
        showNotification('Failed to initialize Google Sheets', 'error');
    }
}

// Function to load Google API client library
function loadGoogleAPI() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = async () => {
            try {
                await gapi.load('client:auth2');
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// Function to update sign-in status
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
        showNotification('Successfully connected to Google Sheets', 'success');
    } else {
        accessToken = null;
        showNotification('Please sign in to use Google Sheets', 'info');
    }
}

// Function to sign in to Google
async function signInToGoogle() {
    try {
        await gapi.auth2.getAuthInstance().signIn();
    } catch (error) {
        console.error('Error signing in to Google:', error);
        showNotification('Failed to sign in to Google', 'error');
    }
}

// Function to sign out from Google
async function signOutFromGoogle() {
    try {
        await gapi.auth2.getAuthInstance().signOut();
    } catch (error) {
        console.error('Error signing out from Google:', error);
        showNotification('Failed to sign out from Google', 'error');
    }
}

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
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-message');

    try {
        const user = SAMPLE_USERS.find(u => u.username === username && u.password === password);
        if (user) {
            localStorage.setItem('adminUser', JSON.stringify(user));
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.textContent = 'Invalid username or password';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error('Error during login:', error);
        errorMsg.textContent = 'Error during login. Please try again.';
        errorMsg.style.display = 'block';
    }
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

// Function to load data from Google Sheets
async function loadFromGoogleSheets(sheetName) {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
        const response = await fetch(url);
        const text = await response.text();
        // Remove the prefix "google.visualization.Query.setResponse(" and suffix ");"
        const jsonString = text.substring(47).slice(0, -2);
        const data = JSON.parse(jsonString);
        
        // Convert Google Sheets data to our format
        const headers = data.table.cols.map(col => col.label);
        const rows = data.table.rows.map(row => {
            const obj = {};
            row.c.forEach((cell, index) => {
                obj[headers[index]] = cell ? cell.v : null;
            });
            return obj;
        });
        
        return rows;
    } catch (error) {
        console.error('Error loading data from Google Sheets:', error);
        return null;
    }
}

// Function to update data in Google Sheets
async function updateGoogleSheet(sheetName, action, data) {
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sheetName: sheetName,
                action: action,
                data: data
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update Google Sheet');
        }
        
        const result = await response.json();
        if (result.status === 'success') {
            return result;
        } else {
            throw new Error(result.message || 'Failed to update Google Sheet');
        }
    } catch (error) {
        console.error('Error updating Google Sheet:', error);
        throw error;
    }
}

// Courses Management
async function loadCourses() {
    try {
        const data = await loadFromGoogleSheets(SHEET_NAMES.courses);
        if (!data) {
            throw new Error('Failed to load courses data');
        }
        
        const coursesTable = document.getElementById('coursesTableBody');
        if (!coursesTable) {
            console.error('Courses table body not found');
            return;
        }
        
        coursesTable.innerHTML = data.map(course => createCourseRow(course)).join('');
    } catch (error) {
        console.error('Error loading courses:', error);
        showNotification('Failed to load courses', 'error');
    }
}

// Resources Management
async function loadResources() {
    try {
        const data = await loadFromGoogleSheets(SHEET_NAMES.resources);
        if (!data) {
            throw new Error('Failed to load resources data');
        }
        
        const resourcesTable = document.getElementById('resourcesTableBody');
        if (!resourcesTable) {
            console.error('Resources table body not found');
            return;
        }
        
        resourcesTable.innerHTML = data.map(resource => createResourceRow(resource)).join('');
    } catch (error) {
        console.error('Error loading resources:', error);
        showNotification('Failed to load resources', 'error');
    }
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

// Function to edit course
async function editCourse(courseId) {
    try {
        const data = await loadFromGoogleSheets(SHEET_NAMES.courses);
        const course = data.find(c => c.id === courseId);
        
        if (course) {
            showModal('Edit Course');
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
        } else {
            showNotification('Course not found', 'error');
        }
    } catch (error) {
        console.error('Error loading course data:', error);
        showNotification('Error loading course data: ' + error.message, 'error');
    }
}

// Function to delete course
async function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course?')) {
        try {
            await updateGoogleSheet(SHEET_NAMES.courses, 'delete', { id: courseId });
            showNotification('Course deleted successfully', 'success');
            loadCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
            showNotification('Error deleting course: ' + error.message, 'error');
        }
    }
}

// Function to update JSON file
async function updateJsonFile(filePath, data) {
    try {
        const filename = filePath.split('/').pop();
        const response = await fetch(`http://localhost:3000/api/data/${filename}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update JSON file');
        }
        
        return true;
    } catch (error) {
        console.error('Error updating JSON file:', error);
        return false;
    }
}

// Function to load JSON file
async function loadJsonFile(filePath) {
    try {
        const filename = filePath.split('/').pop();
        const response = await fetch(`http://localhost:3000/api/data/${filename}`);
        
        if (!response.ok) {
            throw new Error('Failed to load JSON file');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error loading JSON file:', error);
        return null;
    }
}

// Function to handle course submit
async function handleCourseSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const courseData = Object.fromEntries(formData.entries());
    
    try {
        // Convert checkbox value to boolean
        courseData.isShow = courseData.isShow === 'on';
        
        // Determine if this is an update or insert
        const action = courseData.id ? 'update' : 'insert';
        
        // Update Google Sheet
        await updateGoogleSheet(SHEET_NAMES.courses, action, courseData);
        
        showNotification('Course saved successfully', 'success');
        closeModal();
        loadCourses();
    } catch (error) {
        console.error('Error saving course:', error);
        showNotification('Error saving course: ' + error.message, 'error');
    }
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

// Function to handle resource submit
async function handleResourceSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const resourceData = Object.fromEntries(formData.entries());
    
    try {
        // For now, we'll just show a success message
        showNotification('Resource saved successfully', 'success');
        closeModal();
        loadResources();
    } catch (error) {
        console.error('Error saving resource:', error);
        showNotification('Error saving resource', 'error');
    }
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

    // Initialize Google Sheets
    initGoogleSheets();
    
    // Add sign-in button to the header
    const adminActions = document.querySelector('.admin-actions');
    if (adminActions) {
        const signInButton = document.createElement('button');
        signInButton.className = 'btn-secondary';
        signInButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign in with Google';
        signInButton.onclick = signInToGoogle;
        adminActions.appendChild(signInButton);
    }
});

// Publications Management
async function loadPublications() {
    try {
        const data = await loadFromGoogleSheets(SHEET_NAMES.publications);
        if (!data) {
            throw new Error('Failed to load publications data');
        }
        
        displayPublicationsInTable(data);
    } catch (error) {
        console.error('Error loading publications:', error);
        showNotification('Failed to load publications', 'error');
    }
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
    
    try {
        // For now, we'll just show a success message
        showNotification('Publication saved successfully', 'success');
        closeModal();
        loadPublications();
    } catch (error) {
        console.error('Error saving publication:', error);
        showNotification('Error saving publication', 'error');
    }
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