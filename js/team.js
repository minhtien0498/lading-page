// Google Sheets Configuration
const SHEET_ID = '11qHP1J0WlSyEZ3AD5jqKRs7oaCafkrUAHFVdJ-E_BeY';
const SHEET_NAME = 'ResearchTeam';

// Carousel Configuration
let currentIndex = 0;
const MEMBERS_PER_VIEW = 3;

// Load team members from Google Sheets
async function loadTeamMembers() {
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
        const teamMembers = data.table.rows
            .map(row => {
                const member = {};
                row.c.forEach((cell, index) => {
                    // Đảm bảo chuyển đổi ID thành string để so sánh sau này
                    if (headers[index] === 'id') {
                        member[headers[index]] = cell ? String(cell.v) : null;
                    } else {
                    member[headers[index]] = cell ? cell.v : null;
                    }
                });
                return member;
            })
            .filter(member => member.isshow); // Only show members with isshow = true

        console.log('Loaded team members:', teamMembers); // Debug log
        displayTeamMembers(teamMembers);
        setupCarousel(teamMembers);
    } catch (error) {
        console.error('Error loading team members:', error);
        displayError('Failed to load team members. Please try again later.');
    }
}

// Display team members in the grid
function displayTeamMembers(members) {
    const teamGrid = document.querySelector('.team-grid');
    if (!teamGrid) return;

    teamGrid.innerHTML = members.map(member => {
        // Tạo bio preview ngắn gọn hơn
        const bioPreview = member.bio ? 
            member.bio.split(' ').slice(0, 20).join(' ') + '...' : 
            'No biography available.';

        return `
        <div class="team-member">
            <div class="member-image">
                <img src="${member.image || 'images/default-avatar.jpg'}" 
                     alt="${member.name || 'Team Member'}"
                     onerror="this.src='images/default-avatar.jpg'">
                <div class="member-social">
                    ${member.linkedin ? `<a href="${member.linkedin}" target="_blank" title="LinkedIn"><i class="fab fa-linkedin"></i></a>` : ''}
                    ${member.researchgate ? `<a href="${member.researchgate}" target="_blank" title="ResearchGate"><i class="fab fa-researchgate"></i></a>` : ''}
                    ${member.email ? `<a href="mailto:${member.email}" title="Email"><i class="fas fa-envelope"></i></a>` : ''}
                </div>
            </div>
            <div class="member-info">
                <h3>${member.name || 'Team Member'}</h3>
                <p class="position">${member.role || 'Member'}</p>
                <p class="bio-preview">${bioPreview}</p>
                <button class="view-bio-btn" data-member-id="${member.id}">
                    <span>Show more</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `}).join('');

    setupBioModals(members);
    setupCarousel(members);
}

// Setup bio modals
function setupBioModals(members) {
    if (!members || !Array.isArray(members)) {
        console.error('Invalid members data');
        return;
    }

    const modal = document.querySelector('.bio-modal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }

    const modalContent = modal.querySelector('.bio-modal-content');
    if (!modalContent) {
        console.error('Modal content element not found');
        return;
    }

    const modalClose = modal.querySelector('.bio-modal-close');
    if (!modalClose) {
        console.error('Modal close button not found');
        return;
    }

    const viewBioBtns = document.querySelectorAll('.view-bio-btn');
    if (!viewBioBtns.length) {
        console.error('No view bio buttons found');
        return;
    }

    // Xử lý sự kiện click cho nút Show more
    viewBioBtns.forEach(btn => {
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                const memberId = btn.getAttribute('data-member-id');
                if (!memberId) {
                    console.error('Member ID not found');
                    return;
                }

                console.log('Searching for member with ID:', memberId); // Debug log
                console.log('Available members:', members); // Debug log

                // Chuyển đổi memberId thành string để so sánh
                const member = members.find(m => String(m.id) === String(memberId));
                if (!member) {
                    console.error(`Member not found with ID: ${memberId}`);
                    return;
                }

                console.log('Found member:', member); // Debug log

                const modalBody = modalContent.querySelector('.bio-modal-body');
                if (!modalBody) {
                    console.error('Modal body not found');
                    return;
                }

                // Format bio text với paragraphs
                const formattedBio = member.bio ? 
                    member.bio.split('\n').map(p => `<p>${p}</p>`).join('') :
                    '<p>No biography available.</p>';

                // Cập nhật nội dung modal với xử lý null/undefined
                modalBody.innerHTML = `
                    <div class="modal-member-info">
                        <img src="${member.image || 'images/default-avatar.jpg'}" 
                             alt="${member.name || 'Team Member'}" 
                             class="modal-member-image"
                             onerror="this.src='images/default-avatar.jpg'">
                        <div class="modal-member-details">
                            <h2>${member.name || 'Team Member'}</h2>
                            <p class="modal-position">${member.role || 'Member'}</p>
                            <div class="modal-bio">${formattedBio}</div>
                            <div class="modal-social">
                                ${member.linkedin ? `<a href="${member.linkedin}" target="_blank" title="LinkedIn"><i class="fab fa-linkedin"></i></a>` : ''}
                                ${member.researchgate ? `<a href="${member.researchgate}" target="_blank" title="ResearchGate"><i class="fab fa-researchgate"></i></a>` : ''}
                                ${member.email ? `<a href="mailto:${member.email}" title="Email"><i class="fas fa-envelope"></i></a>` : ''}
                            </div>
                        </div>
                    </div>
                `;

                // Hiển thị modal với animation
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                
                // Đảm bảo modal được render trước khi thêm animation
                window.requestAnimationFrame(() => {
                    modal.classList.add('active');
                    modalContent.classList.add('show');
                });

            } catch (error) {
                console.error('Error showing modal:', error);
            }
        });
    });

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
}

// Setup carousel functionality
function setupCarousel(members) {
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    const teamMembers = document.querySelectorAll('.team-member');
    const totalMembers = members.length;

    // Hiển thị 3 thành viên đầu tiên
    updateVisibleMembers();

    // Xử lý nút Previous
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateVisibleMembers();
        }
    });

    // Xử lý nút Next
    nextBtn.addEventListener('click', () => {
        if (currentIndex < totalMembers - MEMBERS_PER_VIEW) {
            currentIndex++;
            updateVisibleMembers();
        }
    });

    // Cập nhật hiển thị các thành viên
    function updateVisibleMembers() {
        teamMembers.forEach((member, index) => {
            member.classList.remove('active');
            if (index >= currentIndex && index < currentIndex + MEMBERS_PER_VIEW) {
                member.classList.add('active');
            }
        });

        // Cập nhật transform để di chuyển carousel
        const teamGrid = document.querySelector('.team-grid');
        teamGrid.style.transform = `translateX(-${currentIndex * (100 / MEMBERS_PER_VIEW)}%)`;

        // Cập nhật trạng thái nút
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= totalMembers - MEMBERS_PER_VIEW;
        
        // Thêm style mờ cho nút disabled
        prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
        nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
    }
}

// Display error message
function displayError(message) {
    const teamGrid = document.querySelector('.team-grid');
    if (!teamGrid) return;

    teamGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Scroll animation observer
const observeElements = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.team-member').forEach(member => {
        observer.observe(member);
    });
};

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    await loadTeamMembers();
    observeElements();
}); 