// Function to format address
function formatAddress(address) {
    return `${address.street}, ${address.ward}, ${address.district}, ${address.city}, ${address.country}`;
}

// Function to create social media links
function createSocialLinks(socialMedia) {
    const socialLinks = document.createElement('div');
    socialLinks.className = 'social-links';
    
    Object.entries(socialMedia).forEach(([platform, url]) => {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        const icon = document.createElement('i');
        icon.className = `fab fa-${platform}`;
        
        link.appendChild(icon);
        socialLinks.appendChild(link);
    });
    
    return socialLinks;
}

// Function to create working hours
function createWorkingHours(hours) {
    const hoursList = document.createElement('ul');
    hoursList.className = 'working-hours';
    
    Object.entries(hours).forEach(([day, time]) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${day.charAt(0).toUpperCase() + day.slice(1)}:</strong> ${time}`;
        hoursList.appendChild(li);
    });
    
    return hoursList;
}

// Function to update contact information
function updateContactInfo() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/contact-info.json', true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const data = JSON.parse(xhr.responseText);
                console.log('Loaded contact data:', data);
                
                if (!data || !data.contactInfo) {
                    throw new Error('Invalid data structure');
                }

                const contactInfo = data.contactInfo;

                // Update address
                const addressElement = document.getElementById('contact-address');
                if (addressElement) {
                    addressElement.textContent = formatAddress(contactInfo.address);
                }

                // Update phone numbers
                const phoneElement = document.getElementById('contact-phone');
                if (phoneElement) {
                    phoneElement.innerHTML = `
                        <p><i class="fas fa-phone"></i> ${contactInfo.phone.main}</p>
                        <p><i class="fas fa-mobile-alt"></i> ${contactInfo.phone.mobile}</p>
                        <p><i class="fas fa-fax"></i> ${contactInfo.phone.fax}</p>
                    `;
                }

                // Update email addresses
                const emailElement = document.getElementById('contact-email');
                if (emailElement) {
                    emailElement.innerHTML = `
                        <p><i class="fas fa-envelope"></i> ${contactInfo.email.main}</p>
                        <p><i class="fas fa-headset"></i> ${contactInfo.email.support}</p>
                        <p><i class="fas fa-user-graduate"></i> ${contactInfo.email.admission}</p>
                    `;
                }

                // Update social media links
                const socialContainer = document.getElementById('social-media');
                if (socialContainer) {
                    socialContainer.appendChild(createSocialLinks(contactInfo.socialMedia));
                }

                // Update working hours
                const hoursContainer = document.getElementById('working-hours');
                if (hoursContainer) {
                    hoursContainer.appendChild(createWorkingHours(contactInfo.workingHours));
                }

                // Update map
                const mapContainer = document.getElementById('map-container');
                if (mapContainer) {
                    mapContainer.innerHTML = `
                        <iframe 
                            src="${contactInfo.mapEmbed.url}"
                            width="${contactInfo.mapEmbed.width}"
                            height="${contactInfo.mapEmbed.height}"
                            style="border:0;"
                            allowfullscreen=""
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                    `;
                }
            } catch (error) {
                console.error('Error parsing contact information:', error);
                const contactContainer = document.getElementById('contact-address');
                if (contactContainer) {
                    contactContainer.innerHTML = '<p class="error-message">Error loading contact information. Please try again later.</p>';
                }
            }
        } else {
            console.error('Error loading contact information:', xhr.statusText);
            const contactContainer = document.getElementById('contact-address');
            if (contactContainer) {
                contactContainer.innerHTML = '<p class="error-message">Error loading contact information. Please try again later.</p>';
            }
        }
    };
    xhr.onerror = function() {
        console.error('Error loading contact information');
        const contactContainer = document.getElementById('contact-address');
        if (contactContainer) {
            contactContainer.innerHTML = '<p class="error-message">Error loading contact information. Please try again later.</p>';
        }
    };
    xhr.send();
}

// Initialize contact information when the page loads
document.addEventListener('DOMContentLoaded', updateContactInfo); 