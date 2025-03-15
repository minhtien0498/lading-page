// Admin Authentication
let currentUser = null;

// Data cache
const dataCache = {
    courses: null,
    resources: null,
    publications: null
};

// Loading state
let isLoading = false;

// Loading indicator
function showLoading(show = true) {
    let loadingEl = document.querySelector('.loading-indicator');
    if (!loadingEl && show) {
        loadingEl = document.createElement('div');
        loadingEl.className = 'loading-indicator';
        loadingEl.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading data...</div>
        `;
        document.body.appendChild(loadingEl);
    } else if (loadingEl && !show) {
        loadingEl.remove();
    }
}

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
    publications: 'Publications',
    team: 'ResearchTeam'
};

// Google Apps Script Web App URL
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz6eM_q6qCcU02Za5YRUyAclXILJKwVvABAua0JF2OGcc-cGR_38O7C4uwep_xdsUBTfQ/exec';

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
    console.log('Showing section:', sectionId);

    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    sections?.forEach(section => section.classList.remove('active'));

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    } else {
        console.error('Section not found:', sectionId);
        return;
    }

    // Update active nav item
    const navItems = document.querySelectorAll('.sidebar-nav li');
    navItems?.forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`[data-section="${sectionId}"]`);
    activeItem?.classList.add('active');

    // Load section data
    loadSectionData(sectionId);
}

// Load section data
async function loadSectionData(sectionId) {
    console.log('Loading section data:', sectionId);
    
    // Show loading indicator if data is not cached
    if (!dataCache[sectionId]) {
        showLoading(true);
    }
    
    try {
        switch(sectionId) {
            case 'courses':
                await loadCourses();
                break;
            case 'resources':
                await loadResources();
                break;
            case 'contact':
                await loadContactInfo();
                break;
            case 'publications':
                await loadPublications();
                break;
            case 'team':
                await loadTeamMembers();
                break;
        }
    } catch (error) {
        console.error('Error loading section data:', error);
        showNotification(`Error loading ${sectionId}: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Load data from Google Sheets
async function loadFromGoogleSheets(sheetName) {
    try {
        // Return cached data if available
        if (dataCache[sheetName.toLowerCase()]) {
            console.log(`Using cached data for sheet: ${sheetName}`);
            return dataCache[sheetName.toLowerCase()];
        }

        console.log(`Loading data for sheet: ${sheetName}`);
        
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
        console.log('Fetching URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        
        // Remove the prefix "google.visualization.Query.setResponse(" and suffix ");"
        const jsonString = text.substring(47).slice(0, -2);
        const data = JSON.parse(jsonString);
        
        if (!data.table || !data.table.cols || !data.table.rows) {
            console.error('Invalid data structure:', data);
            throw new Error('Invalid data structure from Google Sheets');
        }

        const headers = data.table.cols.map(col => col.label);
        
        // Convert Google Sheets data to our format
        const rows = data.table.rows.map(row => {
            const obj = {};
            row.c.forEach((cell, index) => {
                const header = headers[index].toLowerCase();
                const value = cell ? cell.v : null;
                
                // Convert boolean strings to actual booleans
                if (typeof value === 'string' && (value.toUpperCase() === 'TRUE' || value.toUpperCase() === 'FALSE')) {
                    obj[header] = value.toUpperCase() === 'TRUE';
                } else {
                    obj[header] = value;
                }
            });
            return obj;
        });
        
        // Cache the data
        dataCache[sheetName.toLowerCase()] = rows;
        
        return rows;
    } catch (error) {
        console.error('Error loading data from Google Sheets:', error);
        showNotification(`Error loading ${sheetName}: ${error.message}`, 'error');
        return null;
    }
}

// Update data in Google Sheets
async function updateGoogleSheet(sheetName, action, data) {
    try {
        console.log('Updating Google Sheet with:', {
            sheetName,
            action,
            data
        });

        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: action,
                sheet: sheetName,
                data: data
            })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Response data:', result);
        
        if (result.status === 'success') {
            return result;
        } else {
            throw new Error(result.message || 'Failed to update data');
        }
    } catch (error) {
        console.error('Error updating data:', error);
        throw error;
    }
}

// Check Google Apps Script connection
async function checkGoogleAppsScriptConnection() {
    try {
        console.log('Checking Google Apps Script connection...');
        const url = `${WEB_APP_URL}?t=${Date.now()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log('Connection check response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Connection check result:', result);
        
        return result.status === 'success';
    } catch (error) {
        console.error('Error checking Google Apps Script connection:', error);
        return false;
    }
}

// Validate sheet data
function validateSheetData(data, sheetName) {
    console.log(`Validating data for sheet: ${sheetName}`);
    console.log('Data to validate:', data);

    if (!data || !Array.isArray(data)) {
        console.error('Invalid data structure:', data);
        throw new Error(`Invalid data structure for ${sheetName}`);
    }

    const requiredFields = {
        courses: ['id', 'title', 'duration', 'price', 'description', 'instructor', 'level', 'category', 'isshow'],
        resources: ['id', 'title', 'description', 'link', 'isshow'],
        publications: ['id', 'title', 'journal', 'authors', 'excerpt', 'details', 'pdffile', 'year', 'doi']
    };

    const fields = requiredFields[sheetName.toLowerCase()];
    if (!fields) {
        console.error('Unknown sheet name:', sheetName);
        throw new Error(`Unknown sheet name: ${sheetName}`);
    }

    console.log('Required fields:', fields);

    data.forEach((row, index) => {
        console.log(`Validating row ${index + 1}:`, row);
        fields.forEach(field => {
            if (row[field] === undefined || row[field] === null) {
                console.error(`Missing or null field "${field}" in row ${index + 1}:`, row);
                throw new Error(`Missing or null field "${field}" in row ${index + 1} of ${sheetName}`);
            }
        });
    });

    return true;
}

// Function to create course row HTML
function createCourseRow(course) {
    return `
        <tr data-id="${course.id}">
            <td>${course.id}</td>
            <td>${course.name}</td>
            <td>${course.shortdescription}</td>
            <td>${course.duration}</td>
            <td>${course.price}</td>
            <td>${course.level}</td>
            <td>${course.tag}</td>
            <td>${course.students || 0}</td>
            <td>${course.rating || 0}</td>
            <td>
                <div class="toggle-switch">
                    <input type="checkbox" id="course-show-${course.id}" ${course.isshow ? 'checked' : ''}>
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

// Load courses
async function loadCourses() {
    try {
        const data = await loadFromGoogleSheets(SHEET_NAMES.courses);
        if (!data) {
            throw new Error('Failed to load courses data');
        }

        validateSheetData(data, SHEET_NAMES.courses);
        
        const coursesTable = document.getElementById('coursesTableBody');
        if (!coursesTable) {
            console.error('Courses table body not found');
            return;
        }
        
        coursesTable.innerHTML = data.map(course => createCourseRow(course)).join('');
    } catch (error) {
        console.error('Error loading courses:', error);
        showNotification('Failed to load courses: ' + error.message, 'error');
    }
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
                        <label>Name</label>
                        <input type="text" name="name" value="${course.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Tag</label>
                        <select name="tag" required>
                            <option value="">Select Tag</option>
                            <option value="New" ${course.tag === 'New' ? 'selected' : ''}>New</option>
                            <option value="Popular" ${course.tag === 'Popular' ? 'selected' : ''}>Popular</option>
                            <option value="Featured" ${course.tag === 'Featured' ? 'selected' : ''}>Featured</option>
                            <option value="Essential" ${course.tag === 'Essential' ? 'selected' : ''}>Essential</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Short Description</label>
                    <input type="text" name="shortdescription" value="${course.shortdescription}" required>
                </div>
                <div class="form-group">
                    <label>Full Description</label>
                    <textarea name="description" required>${course.description}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="url" name="image" value="${course.image}" required>
                    </div>
                    <div class="form-group">
                        <label>Registration URL</label>
                        <input type="url" name="registration" value="${course.registration}" required>
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
                <div class="form-row">
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
                <div class="form-row">
                    <div class="form-group">
                        <label>Students Count</label>
                        <input type="number" name="students" value="${course.students || 0}" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Rating (0-5)</label>
                        <input type="number" name="rating" value="${course.rating || 0}" min="0" max="5" step="0.1" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Curriculum (JSON format)</label>
                    <textarea name="curriculum" required>${course.curriculum}</textarea>
                </div>
                <div class="form-group toggle-group">
                    <label>Show Course</label>
                    <div class="toggle-switch">
                        <input type="checkbox" name="isshow" id="course-show-edit-${course.id}" ${course.isshow ? 'checked' : ''}>
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

// Function to add new course
function addCourse() {
    showModal('Add New Course');
    const modalForm = document.getElementById('modalForm');
    modalForm.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Name</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Tag</label>
                <select name="tag" required>
                    <option value="">Select Tag</option>
                    <option value="New">New</option>
                    <option value="Popular">Popular</option>
                    <option value="Featured">Featured</option>
                    <option value="Essential">Essential</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Short Description</label>
            <input type="text" name="shortdescription" required>
        </div>
        <div class="form-group">
            <label>Full Description</label>
            <textarea name="description" required></textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Image URL</label>
                <input type="url" name="image" required>
            </div>
            <div class="form-group">
                <label>Registration URL</label>
                <input type="url" name="registration" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Duration</label>
                <input type="text" name="duration" required>
            </div>
            <div class="form-group">
                <label>Price</label>
                <input type="text" name="price" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Level</label>
                <select name="level" required>
                    <option value="">Select Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Students Count</label>
                <input type="number" name="students" value="0" min="0" required>
            </div>
            <div class="form-group">
                <label>Rating (0-5)</label>
                <input type="number" name="rating" value="0" min="0" max="5" step="0.1" required>
            </div>
        </div>
        <div class="form-group">
            <label>Curriculum (JSON format)</label>
            <textarea name="curriculum" required></textarea>
        </div>
        <div class="form-group toggle-group">
            <label>Show Course</label>
            <div class="toggle-switch">
                <input type="checkbox" name="isshow" id="course-show-new" checked>
                <label for="course-show-new"></label>
            </div>
        </div>
        <div class="form-actions">
            <button type="submit" class="btn-primary">Save Course</button>
            <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
    `;
    modalForm.onsubmit = handleCourseSubmit;
}

// Handle course submit
async function handleCourseSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const courseData = Object.fromEntries(formData.entries());
    
    try {
        console.log('Submitting course data:', courseData);
        
        // Convert checkbox value to boolean
        courseData.isshow = courseData.isshow === 'on';
        
        // Convert numeric fields
        courseData.students = parseInt(courseData.students) || 0;
        courseData.rating = parseFloat(courseData.rating) || 0;
        
        // Determine if this is an update or insert
        const action = courseData.id ? 'update' : 'insert';
        
        // If inserting, generate a new ID
        if (action === 'insert') {
            const timestamp = new Date().getTime();
            courseData.id = `COURSE_${timestamp}`;
        }
        
        // Update Google Sheet
        const result = await updateGoogleSheet(SHEET_NAMES.courses, action, courseData);
        console.log('Update result:', result);
        
        showNotification('Course saved successfully', 'success');
        closeModal();
        loadCourses();
    } catch (error) {
        console.error('Error saving course:', error);
        showNotification(`Error saving course: ${error.message}`, 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Load resources
async function loadResources() {
    try {
        const resources = await loadFromGoogleSheets(SHEET_NAMES.resources);
        if (!resources) return;

        const resourcesTable = document.getElementById('resourcesTableBody');
        if (!resourcesTable) {
            console.error('Resources table body not found');
            return;
        }

        resourcesTable.innerHTML = resources.map(resource => `
            <tr data-id="${resource.id}">
                <td>${resource.id}</td>
                <td>${resource.title}</td>
                <td>${resource.description}</td>
                <td>
                    <a href="${resource.link}" target="_blank" rel="noopener noreferrer">
                        ${resource.link}
                    </a>
                </td>
                <td>
                    <div class="toggle-switch">
                        <input type="checkbox" id="resource-show-${resource.id}" ${resource.isshow ? 'checked' : ''}>
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
        `).join('');

        // Add event listeners for toggle switches
        resources.forEach(resource => {
            const toggle = document.getElementById(`resource-show-${resource.id}`);
            if (toggle) {
                toggle.addEventListener('change', async (e) => {
                    try {
                        await updateGoogleSheet(SHEET_NAMES.resources, 'update', {
                            ...resource,
                            isshow: e.target.checked
                        });
                        showNotification('Resource visibility updated', 'success');
                    } catch (error) {
                        console.error('Error updating resource visibility:', error);
                        e.target.checked = !e.target.checked; // Revert the toggle
                        showNotification('Failed to update resource visibility', 'error');
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error in loadResources:', error);
        throw error;
    }
}

// Load publications
async function loadPublications() {
    try {
        const publications = await loadFromGoogleSheets(SHEET_NAMES.publications);
        if (!publications) return;

        const publicationsTable = document.getElementById('publicationsTableBody');
        if (!publicationsTable) {
            console.error('Publications table body not found');
            return;
        }

        publicationsTable.innerHTML = publications.map(pub => `
            <tr data-id="${pub.id}">
                <td>${pub.id}</td>
                <td>${pub.title}</td>
                <td>${pub.journal}</td>
                <td>${pub.authors}</td>
                <td>${pub.year}</td>
                <td>
                    <a href="${pub.doi}" target="_blank" rel="noopener noreferrer">
                        ${pub.doi}
                    </a>
                </td>
                <td>
                    <button class="edit-btn" onclick="editPublication(${pub.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deletePublication(${pub.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${pub.pdffile ? `
                        <a href="${pub.pdffile}" target="_blank" rel="noopener noreferrer" class="btn-view">
                            <i class="fas fa-file-pdf"></i>
                        </a>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error in loadPublications:', error);
        throw error;
    }
}

// Load team members
async function loadTeamMembers() {
    try {
        const team = await loadFromGoogleSheets(SHEET_NAMES.team);
        if (!team) return;

        const teamTable = document.getElementById('teamTableBody');
        if (!teamTable) {
            console.error('Team table body not found');
            return;
        }

        teamTable.innerHTML = team.map(member => `
            <tr data-id="${member.id}">
                <td>${member.id}</td>
                <td>${member.name}</td>
                <td>${member.role}</td>
                <td>${member.bio}</td>
                <td>
                    <img src="${member.image}" alt="${member.name}" style="width: 50px; height: 50px; object-fit: cover;">
                </td>
                <td>
                    <div class="toggle-switch">
                        <input type="checkbox" id="member-show-${member.id}" ${member.isshow ? 'checked' : ''}>
                        <label for="member-show-${member.id}"></label>
                    </div>
                </td>
                <td>
                    <button class="edit-btn" onclick="editTeamMember(${member.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteTeamMember(${member.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Add event listeners for toggle switches
        team.forEach(member => {
            const toggle = document.getElementById(`member-show-${member.id}`);
            if (toggle) {
                toggle.addEventListener('change', async (e) => {
                    try {
                        await updateGoogleSheet(SHEET_NAMES.team, 'update', {
                            ...member,
                            isshow: e.target.checked
                        });
                        showNotification('Team member visibility updated', 'success');
                    } catch (error) {
                        console.error('Error updating team member visibility:', error);
                        e.target.checked = !e.target.checked; // Revert the toggle
                        showNotification('Failed to update team member visibility', 'error');
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error in loadTeamMembers:', error);
        throw error;
    }
}

// Add team member
async function addTeamMember() {
    const modalForm = document.getElementById('modalForm');
    if (!modalForm) return;

    document.getElementById('modal-title').textContent = 'Add New Team Member';
    modalForm.innerHTML = `
        <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required>
        </div>
        <div class="form-group">
            <label for="role">Role</label>
            <input type="text" id="role" name="role" required>
        </div>
        <div class="form-group">
            <label for="bio">Bio</label>
            <textarea id="bio" name="bio" required></textarea>
        </div>
        <div class="form-group">
            <label for="image">Image URL</label>
            <input type="url" id="image" name="image" required>
        </div>
        <div class="form-group">
            <label for="isshow">Show on website</label>
            <input type="checkbox" id="isshow" name="isshow" checked>
        </div>
        <div class="form-actions">
            <button type="submit" class="btn-primary">Save Team Member</button>
            <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
    `;

    modalForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const memberData = {
            id: `TEAM_${Date.now()}`,
            name: formData.get('name'),
            role: formData.get('role'),
            bio: formData.get('bio'),
            image: formData.get('image'),
            isshow: formData.get('isshow') === 'on'
        };

        try {
            await updateGoogleSheet(SHEET_NAMES.team, 'insert', memberData);
            showNotification('Team member added successfully', 'success');
            closeModal();
            loadTeamMembers();
        } catch (error) {
            console.error('Error adding team member:', error);
            showNotification('Failed to add team member', 'error');
        }
    };

    openModal();
}

// Edit team member
async function editTeamMember(id) {
    try {
        const team = await loadFromGoogleSheets(SHEET_NAMES.team);
        const member = team.find(m => m.id === id);
        if (!member) {
            throw new Error('Team member not found');
        }

        const modalForm = document.getElementById('modalForm');
        if (!modalForm) return;

        document.getElementById('modal-title').textContent = 'Edit Team Member';
        modalForm.innerHTML = `
            <input type="hidden" name="id" value="${member.id}">
            <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" value="${member.name}" required>
            </div>
            <div class="form-group">
                <label for="role">Role</label>
                <input type="text" id="role" name="role" value="${member.role}" required>
            </div>
            <div class="form-group">
                <label for="bio">Bio</label>
                <textarea id="bio" name="bio" required>${member.bio}</textarea>
            </div>
            <div class="form-group">
                <label for="image">Image URL</label>
                <input type="url" id="image" name="image" value="${member.image}" required>
            </div>
            <div class="form-group">
                <label for="isshow">Show on website</label>
                <input type="checkbox" id="isshow" name="isshow" ${member.isshow ? 'checked' : ''}>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Update Team Member</button>
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        `;

        modalForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedData = {
                id: member.id,
                name: formData.get('name'),
                role: formData.get('role'),
                bio: formData.get('bio'),
                image: formData.get('image'),
                isshow: formData.get('isshow') === 'on'
            };

            try {
                await updateGoogleSheet(SHEET_NAMES.team, 'update', updatedData);
                showNotification('Team member updated successfully', 'success');
                closeModal();
                loadTeamMembers();
            } catch (error) {
                console.error('Error updating team member:', error);
                showNotification('Failed to update team member', 'error');
            }
        };

        openModal();
    } catch (error) {
        console.error('Error in editTeamMember:', error);
        showNotification('Failed to load team member data', 'error');
    }
}

// Delete team member
async function deleteTeamMember(id) {
    if (confirm('Are you sure you want to delete this team member?')) {
        try {
            await updateGoogleSheet(SHEET_NAMES.team, 'delete', { id });
            showNotification('Team member deleted successfully', 'success');
            loadTeamMembers();
        } catch (error) {
            console.error('Error deleting team member:', error);
            showNotification('Failed to delete team member', 'error');
        }
    }
}

// Add resource
async function addResource() {
    const modalForm = document.getElementById('modalForm');
    if (!modalForm) return;

    document.getElementById('modal-title').textContent = 'Add New Resource';
    modalForm.innerHTML = `
        <div class="form-group">
            <label for="title">Title</label>
            <input type="text" id="title" name="title" required>
        </div>
        <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" name="description" required></textarea>
        </div>
        <div class="form-group">
            <label for="link">Link</label>
            <input type="url" id="link" name="link" required>
        </div>
        <div class="form-group">
            <label for="isshow">Show on website</label>
            <input type="checkbox" id="isshow" name="isshow" checked>
        </div>
        <div class="form-actions">
            <button type="submit" class="btn-primary">Save Resource</button>
            <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
    `;

    modalForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const resourceData = {
            id: `RESOURCE_${Date.now()}`,
            title: formData.get('title'),
            description: formData.get('description'),
            link: formData.get('link'),
            isshow: formData.get('isshow') === 'on'
        };

        try {
            await updateGoogleSheet(SHEET_NAMES.resources, 'insert', resourceData);
            showNotification('Resource added successfully', 'success');
            closeModal();
            loadResources();
        } catch (error) {
            console.error('Error adding resource:', error);
            showNotification('Failed to add resource', 'error');
        }
    };

    openModal();
}

// Add publication
async function addPublication() {
    const modalForm = document.getElementById('modalForm');
    if (!modalForm) return;

    document.getElementById('modal-title').textContent = 'Add New Publication';
    modalForm.innerHTML = `
        <div class="form-group">
            <label for="title">Title</label>
            <input type="text" id="title" name="title" required>
        </div>
        <div class="form-group">
            <label for="journal">Journal</label>
            <input type="text" id="journal" name="journal" required>
        </div>
        <div class="form-group">
            <label for="authors">Authors</label>
            <input type="text" id="authors" name="authors" required>
        </div>
        <div class="form-group">
            <label for="year">Year</label>
            <input type="number" id="year" name="year" required min="1900" max="2100">
        </div>
        <div class="form-group">
            <label for="doi">DOI</label>
            <input type="url" id="doi" name="doi" required>
        </div>
        <div class="form-group">
            <label for="excerpt">Excerpt</label>
            <textarea id="excerpt" name="excerpt" required></textarea>
        </div>
        <div class="form-group">
            <label for="details">Details</label>
            <textarea id="details" name="details" required></textarea>
        </div>
        <div class="form-group">
            <label for="pdffile">PDF File URL (optional)</label>
            <input type="url" id="pdffile" name="pdffile">
        </div>
        <div class="form-actions">
            <button type="submit" class="btn-primary">Save Publication</button>
            <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
    `;

    modalForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const publicationData = {
            id: `PUB_${Date.now()}`,
            title: formData.get('title'),
            journal: formData.get('journal'),
            authors: formData.get('authors'),
            year: formData.get('year'),
            doi: formData.get('doi'),
            excerpt: formData.get('excerpt'),
            details: formData.get('details'),
            pdffile: formData.get('pdffile') || null
        };

        try {
            await updateGoogleSheet(SHEET_NAMES.publications, 'insert', publicationData);
            showNotification('Publication added successfully', 'success');
            closeModal();
            loadPublications();
        } catch (error) {
            console.error('Error adding publication:', error);
            showNotification('Failed to add publication', 'error');
        }
    };

    openModal();
}

// Modal functions
function openModal() {
    const modal = document.getElementById('item-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal() {
    const modal = document.getElementById('item-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM Content Loaded');
    
    // Add loading indicator styles
    const style = document.createElement('style');
    style.textContent = `
        .loading-indicator {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        .loading-text {
            margin-top: 10px;
            font-size: 16px;
            color: #333;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Check Google Apps Script connection
    const isConnected = await checkGoogleAppsScriptConnection();
    if (!isConnected) {
        showNotification('Warning: Cannot connect to Google Apps Script', 'warning');
    }
    
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
        
        // Preload all data
        showLoading(true);
        try {
            await Promise.all([
                loadFromGoogleSheets(SHEET_NAMES.courses),
                loadFromGoogleSheets(SHEET_NAMES.resources),
                loadFromGoogleSheets(SHEET_NAMES.publications),
                loadFromGoogleSheets(SHEET_NAMES.team)
            ]);
        } catch (error) {
            console.error('Error preloading data:', error);
            showNotification('Error preloading data. Some sections may not load properly.', 'error');
        } finally {
            showLoading(false);
        }
        
        // Show default section
        const defaultSection = 'courses';
        console.log('Showing default section:', defaultSection);
        showSection(defaultSection);
        
        // Initialize navigation
        const navItems = document.querySelectorAll('.sidebar-nav li');
        navItems?.forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.getAttribute('data-section');
                if (sectionId) {
                    showSection(sectionId);
                }
            });
        });

        // Initialize logout button
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', handleLogout);

        // Initialize Add New button
        const addNewBtn = document.getElementById('addNewBtn');
        addNewBtn?.addEventListener('click', () => {
            const activeSection = document.querySelector('.admin-section.active');
            if (activeSection) {
                switch(activeSection.id) {
                    case 'courses':
                        addCourse();
                        break;
                    case 'resources':
                        addResource();
                        break;
                    case 'team':
                        addTeamMember();
                        break;
                }
            }
        });
    }
});