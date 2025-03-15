import React from 'react';
import './Course.css'; // Đảm bảo sử dụng file CSS đã có

const Course = ({ courses }) => {
    return (
        <div className="course-list">
            {courses.map((course, index) => (
                <div className="course-card" key={index}>
                    <div className="info-box">
                        <div className="info-item">Duration: {course.duration}</div>
                        <div className="info-item">Price: {course.price}</div>
                        <div className="info-item">Students: {course.student}</div>
                        <div className="info-item">Rating: {course.rating}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Course; 