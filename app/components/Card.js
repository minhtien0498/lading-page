import React from 'react';
import './Card.css'; // Giả sử bạn có file CSS này

const Card = ({ duration, price, student, rating }) => {
    return (
        <div className="card">
            <div className="info-box">
                <div className="info-item">{duration}</div>
                <div className="info-item">{price}</div>
                <div className="info-item">{student}</div>
                <div className="info-item">{rating}</div>
            </div>
        </div>
    );
};

export default Card; 