import React from 'react';
import './Course.css'; // Cập nhật để sử dụng file CSS đã có

const CourseCard = ({ duration, price, student, rating }) => {
    return (
        <div className="course-card">
            <div className="info-box">
                <div className="info-item">Duration: {duration}</div>
                <div className="info-item">Price: {price}</div>
                <div className="info-item">Students: {student}</div>
                <div className="info-item">Rating: {rating}</div>
            </div>
        </div>
    );
};

export default CourseCard; 