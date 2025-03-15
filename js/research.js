async function loadResearch() {
    const SHEET_ID = '11qHP1J0WlSyEZ3AD5jqKRs7oaCafkrUAHFVdJ-E_BeY'; // ID của Google Sheet
    const SHEET_NAME = 'Research'; // Tên sheet bạn muốn lấy dữ liệu
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        const jsonString = text.substring(47).slice(0, -2);
        const data = JSON.parse(jsonString);
        
        // Kiểm tra xem data.table.rows có tồn tại không
        if (!data.table || !data.table.rows) {
            throw new Error('No data found in the sheet.');
        }

        const researchItems = data.table.rows.map(row => {
            const item = {};
            row.c.forEach((cell, index) => {
                item[data.table.cols[index].label.toLowerCase()] = cell ? cell.v : null;
            });
            return item;
        });

        displayResearch(researchItems);
    } catch (error) {
        console.error('Error loading research data:', error);
    }
}

// Hàm hiển thị dữ liệu lên giao diện
function displayResearch(researchItems) {
    const researchContainer = document.querySelector('.research-areas');
    researchContainer.innerHTML = ''; // Xóa nội dung cũ

    // Phân loại các dự án theo trạng thái
    const categorizedProjects = {
        'Đang nghiên cứu': [],
        'Sẽ nghiên cứu': [],
        'Đã nghiên cứu': []
    };

    researchItems.forEach(item => {
        if (item.status) {
            categorizedProjects[item.status].push(item);
        }
    });

    // Hiển thị phần "Đang nghiên cứu"
    const ongoingProjects = categorizedProjects['Đang nghiên cứu'];
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('project-section');
    sectionDiv.innerHTML = `<h2>Đang nghiên cứu</h2>`; // Đổi tiêu đề

    ongoingProjects.forEach(item => {
        const areaDiv = document.createElement('div');
        areaDiv.classList.add('research-area');
        areaDiv.innerHTML = `
            <div class="area-icon">
                <i class="fas fa-flask"></i>
            </div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <ul class="area-details">
                ${item.details ? item.details.split(',').map(detail => `<li>${detail.trim()}</li>`).join('') : ''}
            </ul>
            <p><strong>Thời gian:</strong> ${item.year}</p>
            <p><strong>Nhà nghiên cứu:</strong> ${item.researchers}</p>
        `;
        sectionDiv.appendChild(areaDiv);
    });

    researchContainer.appendChild(sectionDiv);
}

// Gọi hàm loadResearch khi trang được tải
document.addEventListener('DOMContentLoaded', loadResearch);
